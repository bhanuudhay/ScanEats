import express from "express";
import Tesseract from "tesseract.js";
import fileUpload from "express-fileupload";
import fs from "fs";
import path from "path";
import mongoose from "mongoose"; // Ensure we validate ObjectId
import User from "../models/User.js"; // Import user model

const router = express.Router();

// Middleware for file upload
router.use(fileUpload());

// Ensure 'uploads' directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Function to extract nutrition data
const extractNutritionData = (text) => {
  const nutrition = {};
  const regexPatterns = {
    calories: /calories[\s:]*([\d]+)/i,
    fat: /total fat[\s:]*([\d.]+)\s*g/i,
    protein: /protein[\s:]*([\d.]+)\s*g/i,
    carbs: /total\s*carbohydrates?[\s:]*([\d.]+)\s*g/i,
    sugar: /total\s*sugars?[\s:]*([\d.]+)\s*g/i,
    fiber: /fiber[\s:]*([\d.]+)\s*g/i,
    sodium: /sodium[\s:]*([\d]+)\s*mg/i,
  };

  for (const [key, regex] of Object.entries(regexPatterns)) {
    const match = text.match(regex);
    nutrition[key] = match ? parseFloat(match[1]) : null;
  }

  return nutrition;
};

// Function to calculate BMR (Basal Metabolic Rate)
const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age || !gender) return 2000; // Default

  return gender === "male"
    ? 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
    : 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;
};

// Function to calculate calories to burn & steps needed
const calculateBurn = (calories, user) => {
  if (!calories || !user) return { caloriesToBurn: 0, stepsNeeded: 0 };

  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
  const dailyCaloricNeed = bmr * 1.2; // Sedentary lifestyle assumption

  const caloriesToBurn = Math.max(0, calories - dailyCaloricNeed * 0.1);
  const stepsNeeded = Math.round(caloriesToBurn / 0.04);

  return { caloriesToBurn, stepsNeeded };
};

// OCR Route - Process Nutrition Label & Calculate Burn
router.post("/:userId", async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { userId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch user data from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const imageFile = req.files.image;
    const imagePath = path.join(uploadDir, `${Date.now()}_${imageFile.name}`);

    console.log(`🔄 Uploading Image: ${imagePath}`);

    // Move file to server
    await imageFile.mv(imagePath);
    console.log(`✅ Image saved at: ${imagePath}`);

    // Perform OCR
    const { data } = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => console.log(`📜 Tesseract Progress:`, m),
    });

    console.log(`✅ OCR Extraction Complete!`);
    console.log(`📜 Extracted Text:`, data.text);

    // Extract nutrition data
    const nutritionData = extractNutritionData(data.text);

    // Calculate Calories to Burn & Steps Needed
    const { caloriesToBurn, stepsNeeded } = calculateBurn(nutritionData.calories, user);

    // Cleanup - Remove the uploaded file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error("⚠️ Error deleting file:", err);
      else console.log(`🗑️ Deleted file: ${imagePath}`);
    });

    res.json({
      success: true,
      message: "OCR and calculation successful",
      text: data.text,
      nutrition: nutritionData,
      user: { age: user.age, weight: user.weight, height: user.height, gender: user.gender },
      caloriesToBurn,
      stepsNeeded,
    });
  } catch (error) {
    console.error("❌ OCR Error:", error);
    res.status(500).json({ message: "Error processing OCR", error: error.message });
  }
});

export default router;

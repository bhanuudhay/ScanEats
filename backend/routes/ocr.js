import express from "express";
import Tesseract from "tesseract.js";
import multer from "multer";
import fs from "fs/promises";
import * as Jimp from "jimp"; // ✅ Correct way to import Jimp in ES modules
 // Added for image preprocessing
import mongoose from "mongoose";
import User from "../models/User.js";
import FoodEntry from "../models/FoodEntry.js";

const router = express.Router();

// Multer setup for file uploads
const uploadDir = "./uploads";
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// Ensure 'uploads' directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Preprocessing Function (Enhances OCR Performance)
const preprocessImage = async (imagePath) => {
  try {
    let image = await Jimp.read(imagePath);
    await image
      .resize(800, Jimp.AUTO) // Resize for better OCR readability
      .greyscale() // Convert to grayscale
      .contrast(0.5) // Increase contrast
      .normalize() // Normalize lighting
      .writeAsync(imagePath); // Save the changes

    console.log("✅ Image preprocessed successfully");
  } catch (error) {
    console.error("⚠️ Error in image preprocessing:", error);
  }
};

const extractNutritionData = (text) => {
  const nutrition = {};
  const regexPatterns = {
    calories: /calories[^0-9]*([\d]+)/i,  
    fat: /total\s*fat[^0-9]*([\d.]+)\s*g/i,
    protein: /protein[^0-9]*([\d.]+)\s*g/i,
    carbs: /total\s*carbohydrate[^0-9]*([\d.]+)\s*g/i,
    sugar: /sugars?[^0-9]*([\d.]+)\s*g/i,
    fiber: /fiber[^0-9]*([\d.]+)\s*g/i,
    sodium: /sodium[^0-9]*([\d.]+)\s*mg/i,
    servingSize: /serv(?:ing)?\s*size[^0-9]*([\d.]+)\s*(g|ml|oz|cup|tbsp|tsp)/i,
  };

  for (const [key, regex] of Object.entries(regexPatterns)) {
    try {
      const match = text.match(regex);
      if (match) {
        nutrition[key] = parseFloat(match[1]); // Extract only numeric values
      } else {
        nutrition[key] = 0; // Default to 0 if not found
      }
    } catch (err) {
      nutrition[key] = 0;
    }
  }

  console.log("✅ Extracted Nutrition Data (Ignoring %):", nutrition);
  return nutrition;
};


// OCR Route - Process Nutrition Label & Store Data
router.post("/:userId", upload.single("image"), async (req, res) => {
  let imagePath = null;

  try {
    console.log("📸 Received OCR request");

    if (!req.file) {
      console.error("❌ No image uploaded!");
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Invalid user ID format");
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    imagePath = req.file.path;
    console.log(`✅ Image saved: ${imagePath}`);

    // Preprocess the image before OCR
    await preprocessImage(imagePath);

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

    // Store data in MongoDB
    const newFoodEntry = new FoodEntry({
      userId,
      foodName: "Scanned Food",
      calories: nutritionData.calories,
      fat: nutritionData.fat,
      protein: nutritionData.protein,
      carbs: nutritionData.carbs,
      sugar: nutritionData.sugar,
      fiber: nutritionData.fiber,
      sodium: nutritionData.sodium,
      servingSize: nutritionData.servingSize,
      caloriesToBurn,
      stepsNeeded,
    });

    await newFoodEntry.save();
    console.log(`✅ Food entry saved: ${newFoodEntry._id}`);

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
  } finally {
    // Cleanup - Remove uploaded file
    if (imagePath) {
      try {
        await fs.unlink(imagePath);
        console.log(`🗑️ Deleted file: ${imagePath}`);
      } catch (err) {
        console.error("⚠️ Error deleting file:", err);
      }
    }
  }
});

// Calculate BMR
const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age || !gender) {
    return 2000;
  }
  return gender === "male"
    ? 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
    : 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;
};

// Calculate calories to burn & steps needed
const calculateBurn = (calories, user) => {
  if (!calories || !user) return { caloriesToBurn: 0, stepsNeeded: 0 };

  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
  const dailyCaloricNeed = bmr * 1.2; // Assuming a sedentary lifestyle

  // ✅ New Formula: Only subtract calories already burned by BMR
  const caloriesToBurn = Math.max(0, calories - (dailyCaloricNeed / 24)); 

  // ✅ Steps calculation based on standard 0.04 kcal per step (varies by weight)
  const stepsNeeded = Math.round(caloriesToBurn / 0.04);

  return { caloriesToBurn, stepsNeeded };
};


export default router;

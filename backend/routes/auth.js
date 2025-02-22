import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config(); // Load environment variables

const router = express.Router();

// ✅ User Registration (Signup)
router.post("/signup", async (req, res) => {
  try {
    console.log("📩 Signup Request Received:", req.body);

    let { name, email, password, age, height, weight, gender } = req.body;

    // 🔹 Trim input to avoid leading/trailing spaces
    name = name.trim();
    email = email.toLowerCase().trim();
    password = password.trim();

    // 🔹 Validate required fields
    if (!name || !email || !password || !age || !height || !weight || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔹 Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 🔹 Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // 🔹 Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔹 Hash password securely
    console.log("🔑 Hashing password...");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("✅ Password hashed successfully");

    // 🔹 Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      age,
      height,
      weight,
      gender,
    });

    await newUser.save();
    console.log("✅ User saved to database:", newUser._id);

    // 🔹 Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 🔹 Set HTTP-only cookie for added security
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000, // 1 hour
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name,
        email,
        age,
        height,
        weight,
        gender,
      },
    });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ✅ User Login
router.post("/login", async (req, res) => {
  try {
    console.log("🔑 Login Request Received:", req.body);

    let { email, password } = req.body;

    // 🔹 Trim input
    email = email.toLowerCase().trim();
    password = password.trim();

    // 🔹 Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 🔹 Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 🔹 Log password types & values for debugging
    console.log("Entered Password:", password, "| Type:", typeof password);
    console.log("Stored Hashed Password:", user.password, "| Type:", typeof user.password);

    // 🔹 Compare passwords securely
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Password Match Status:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔹 Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        height: user.height,
        weight: user.weight,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// ✅ Token Verification Middleware
export const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(403).json({ message: "Access denied. No token provided." });
    }

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
      next();
    } catch (error) {
      console.error("❌ Token Verification Error:", error.message);
      return res.status(401).json({ message: "Invalid or expired token." });
    }
  } catch (error) {
    console.error("⚠️ Error in token verification middleware:", error.message);
    return res.status(500).json({ message: "Error verifying token" });
  }
};

export default router;

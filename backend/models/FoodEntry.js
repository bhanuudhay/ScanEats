import mongoose from "mongoose";

const FoodEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  foodName: { type: String, required: true },
  calories: { type: Number, required: true },
  fat: { type: Number, default: null },
  protein: { type: Number, default: null },
  carbs: { type: Number, default: null },
  sugar: { type: Number, default: null },
  fiber: { type: Number, default: null },
  sodium: { type: Number, default: null },
  caloriesToBurn: { type: Number, required: true },
  stepsNeeded: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("FoodEntry", FoodEntrySchema);

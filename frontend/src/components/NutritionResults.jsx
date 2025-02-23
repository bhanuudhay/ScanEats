import React from "react";

const NutritionResults = ({ nutrition = {} }) => {
  const {
    calories = 0,
    fat = 0,
    protein = 0,
    carbs = 0,
    sugar = 0,
    fiber = 0,
    sodium = 0,
    servingSize = "N/A",
    caloriesToBurn = 0,
    stepsNeeded = 0,
  } = nutrition;

  return (
    <div className="nutrition-results">
      <h2>🍎 Nutrition Analysis</h2>
      <ul>
        <li><strong>Calories:</strong> {calories} kcal</li>
        <li><strong>Fat:</strong> {fat} g</li>
        <li><strong>Protein:</strong> {protein} g</li>
        <li><strong>Carbs:</strong> {carbs} g</li>
        <li><strong>Sugar:</strong> {sugar} g</li>
        <li><strong>Fiber:</strong> {fiber} g</li>
        <li><strong>Sodium:</strong> {sodium} mg</li>
        <li><strong>Serving Size:</strong> {servingSize}</li>
        <li><strong>Calories to Burn:</strong> {caloriesToBurn} kcal</li>
        <li><strong>Steps Needed:</strong> {stepsNeeded} steps</li>
      </ul>
    </div>
  );
};

export default NutritionResults;

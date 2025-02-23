import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import NutritionResults from "./components/NutritionResults";


function App() {
  const [userId, setUserId] = useState(null);
  const [nutrition, setNutrition] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn("⚠️ No user ID found! Please log in.");
    }
  }, []);

  const handleNutritionUpdate = (data) => {
    if (data && typeof data === "object") {
      setNutrition(data);
    } else {
      console.error("❌ Failed to update nutrition data.");
    }
  };

  return (
    <div>
      <h1>ScanEats 🍽</h1>

      {userId ? (
        <>
          <CameraCapture userId={userId} onNutritionUpdate={handleNutritionUpdate} />
          {nutrition ? (
            <NutritionResults nutrition={nutrition} />
          ) : (
            <p>📜 No nutrition data available. Scan a product to see results.</p>
          )}
        </>
      ) : (
        <p style={{ color: "red", fontWeight: "bold" }}>
          ⚠️ Please log in to use the scanner.
        </p>
      )}
    </div>
  );
}

export default App;

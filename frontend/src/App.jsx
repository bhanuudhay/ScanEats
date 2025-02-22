import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";

function App() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Retrieve userId from localStorage (assuming it's stored after login)
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn("⚠️ No user ID found! Make sure user is logged in.");
    }
  }, []);

  return (
    <div>
      <h1>ScanEats</h1>
      {userId ? (
        <CameraCapture userId={userId} />
      ) : (
        <p>Please log in to use the scanner.</p>
      )}
    </div>
  );
}

export default App;

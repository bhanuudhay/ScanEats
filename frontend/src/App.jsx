import React from "react";
import CameraCapture from "./components/CameraCapture";

function App() {
  return (
    <div>
      <h1>ScanEats</h1>
      <CameraCapture userId={userId} />
    </div>
  );
}

export default App;

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const CameraCapture = ({ userId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState(null); // Store image URL for preview
  const [ocrResult, setOcrResult] = useState("");
  const [nutritionData, setNutritionData] = useState(null);
  const [caloriesToBurn, setCaloriesToBurn] = useState(0);
  const [stepsNeeded, setStepsNeeded] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  // 🎥 Start Camera
  const startCamera = async () => {
    try {
      // Stop existing stream if active
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      setError("Error accessing camera. Please allow camera permissions.");
      console.error("📷 Camera Error:", error);
    }
  };

  // 🔴 Stop Camera when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (imageURL) {
        URL.revokeObjectURL(imageURL); // Clean up image URL
      }
    };
  }, [stream, imageURL]);

  // 📸 Capture Image from Video
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to Blob and save as File
      canvas.toBlob(blob => {
        const file = new File([blob], "captured.png", { type: "image/png" });
        setImage(file);
        const url = URL.createObjectURL(file);
        setImageURL(url); // Store image URL for preview
      }, "image/png");
    }
  };

  // 📤 Send Image to Backend for OCR Processing
  const sendImageToBackend = async () => {
    if (!image) return setError("No image captured!");
    if (!userId) return setError("User ID is required for calculations!");

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post(`http://localhost:5001/api/ocr/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOcrResult(response.data.text);
      setNutritionData(response.data.nutrition);
      setCaloriesToBurn(response.data.caloriesToBurn);
      setStepsNeeded(response.data.stepsNeeded);
    } catch (error) {
      console.error("🛑 OCR Processing Error:", error);
      setError(error.response?.data?.message || "Error processing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Nutrition Label Scanner</h2>

      {/* 🎥 Video Stream */}
      <div style={styles.videoContainer}>
        <video ref={videoRef} autoPlay style={styles.video}></video>
      </div>

      <button onClick={startCamera} style={styles.button} disabled={stream}>
        {stream ? "Camera Ready ✅" : "Start Camera"}
      </button>
      <button onClick={captureImage} style={styles.button} disabled={!stream}>
        Capture 📸
      </button>

      {/* 🎯 Hidden Canvas for Capturing Image */}
      <canvas ref={canvasRef} width="300" height="200" style={{ display: "none" }}></canvas>

      {/* 🖼️ Captured Image Preview */}
      {imageURL && (
        <div style={styles.imagePreview}>
          <h3>Captured Image:</h3>
          <img src={imageURL} alt="Captured" width="300" />
        </div>
      )}

      <button onClick={sendImageToBackend} style={styles.button} disabled={loading || !image}>
        {loading ? "Scanning... 🔄" : "Scan 📝"}
      </button>

      {/* ⚠️ Error Message */}
      {error && <p style={styles.error}>❌ {error}</p>}

      {/* 📝 OCR Result */}
      {ocrResult && (
        <div style={styles.resultContainer}>
          <h3>Extracted Text:</h3>
          <p>{ocrResult}</p>
        </div>
      )}

      {/* 🥗 Nutrition Data */}
      {nutritionData && (
        <div style={styles.resultContainer}>
          <h3>Extracted Nutrition Data:</h3>
          <ul>
            {Object.entries(nutritionData).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value !== null ? value : "N/A"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🔥 Calories Burn & Steps Calculation */}
      {caloriesToBurn > 0 && stepsNeeded > 0 && (
        <div style={styles.resultContainer}>
          <h3>Calories to Burn:</h3>
          <p>{caloriesToBurn} kcal</p>

          <h3>Steps Needed:</h3>
          <p>{stepsNeeded} steps 🚶‍♂️</p>
        </div>
      )}
    </div>
  );
};

// 🎨 Styles
const styles = {
  container: { textAlign: "center", padding: "20px" },
  videoContainer: { display: "flex", justifyContent: "center", marginBottom: "10px" },
  video: { width: "100%", maxWidth: "320px", borderRadius: "10px", border: "2px solid #ddd" },
  button: { margin: "5px", padding: "10px 15px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#007BFF", color: "white", fontWeight: "bold" },
  imagePreview: { margin: "15px 0" },
  resultContainer: { marginTop: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "10px", background: "#f9f9f9" },
  error: { color: "red", marginTop: "10px", fontWeight: "bold" },
};

export default CameraCapture;

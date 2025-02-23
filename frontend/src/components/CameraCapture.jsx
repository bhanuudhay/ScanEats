import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const CameraCapture = ({ userId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState(null);
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
      stopCamera(); // Stop previous stream if active

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

  // 🔴 Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (imageURL) {
        URL.revokeObjectURL(imageURL); // Cleanup captured image URL
      }
    };
  }, [imageURL]);

  // 📸 Capture Image from Video
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera is not ready.");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to capture image.");
          return;
        }
        const file = new File([blob], `captured_${Date.now()}.png`, { type: "image/png" });
        setImage(file);
        const url = URL.createObjectURL(file);
        setImageURL(url);
      },
      "image/png",
      1
    );
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

      if (response.data) {
        setOcrResult(response.data.text || "No text detected");
        setNutritionData(response.data.nutrition || {});
        setCaloriesToBurn(response.data.caloriesToBurn || 0);
        setStepsNeeded(response.data.stepsNeeded || 0);
      } else {
        throw new Error("Invalid response from server");
      }
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
        <video ref={videoRef} autoPlay muted style={styles.video}></video>
      </div>

      <button onClick={startCamera} style={styles.button} disabled={stream}>
        {stream ? "Camera Ready ✅" : "Start Camera"}
      </button>
      <button onClick={captureImage} style={styles.button} disabled={!stream}>
        Capture 📸
      </button>
      <button onClick={stopCamera} style={styles.button} disabled={!stream}>
        Stop Camera ⏹️
      </button>

      {/* 🎯 Hidden Canvas for Capturing Image */}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

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
      {nutritionData && Object.keys(nutritionData).length > 0 && (
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
  button: {
    margin: "5px",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: "5px",
    border: "none",
    background: "#007BFF",
    color: "white",
    fontWeight: "bold",
  },
  imagePreview: { margin: "15px 0" },
  resultContainer: { marginTop: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "10px", background: "#f9f9f9" },
  error: { color: "red", marginTop: "10px", fontWeight: "bold" },
};

export default CameraCapture;

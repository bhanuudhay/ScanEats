# ScanEats - Nutrition Label Scanner

ScanEats is a web application that allows users to scan food product labels, extract nutritional information through Optical Character Recognition (OCR), and calculate personalized health insights like calories burned and steps needed. The app uses a camera interface to capture product images, processes the data, and displays results in a user-friendly format.

## Features

- **OCR Integration**: Extracts text from scanned images of product labels using OCR technology.
- **Nutritional Data**: Displays key nutritional information such as calories, fat, protein, carbs, sugar, fiber, and sodium.
- **Health Insights**: Calculates calories to burn and steps needed based on scanned nutritional data.
- **User Management**: Users can log in and store their information for personalized insights.

## Technologies Used

### Frontend:
- **React**: A popular JavaScript library for building user interfaces. React is used for building dynamic, responsive UI components such as the camera capture interface and displaying nutrition results.
- **Axios**: A promise-based HTTP client for making API requests to the backend, sending image data for OCR processing and retrieving nutritional data.

### Backend:
- **Node.js with Express**: The server is built with Express, a minimal and flexible Node.js web application framework that provides routing and API endpoints for processing OCR and nutritional data.
- **Mongoose**: A Node.js library for MongoDB, used for managing user data and interacting with the database.
- **Multer**: Middleware for handling multipart/form-data, used for managing image uploads from the frontend.
- **OCR Integration**: OCR processing extracts text from food labels, enabling the backend to parse nutritional information.
- **Cors**: A package used for enabling cross-origin requests between the frontend and backend.

### Libraries:
- **dotenv**: Loads environment variables from a `.env` file for secure configuration.
- **@tensorflow/tfjs-node**: An optional library used for additional machine learning capabilities like OCR or data analysis (if implemented).

## Setup

### Frontend Setup
1. Clone the repository to your local machine.
2. Navigate to the frontend folder:
   ```bash
   cd frontend
3. Install the required dependencies:
   ```bash
   npm install
3. Start the server:
   ```bash
   npm run dev
   
### Backend Setup  - Follow Same Steps for Backend  only 
           cd backend

## Usage

* **Capture an Image:** Start the camera in the app, capture an image of a food label, and send it to the backend for OCR processing.
* **View Nutritional Information:** The OCR will extract text from the food label and display the nutritional data, including calories, fat, protein, carbs, etc.
* **Personalized Health Insights:** The app calculates how many calories you need to burn and how many steps you need to walk based on the extracted nutritional data.

## Technologies Used

* **React:** Chosen for its component-based architecture, enabling efficient rendering and a smooth user experience. React's ability to manage state makes it perfect for handling dynamic data like camera input and nutrition results.
* **Express:** A lightweight and flexible web framework for Node.js, which provides fast and easy handling of HTTP requests and API routes. Express is scalable and easy to integrate with other services like OCR processing and database management.
* **Multer:** Essential for handling file uploads in Express. Multer is used to manage the image files captured by the frontend before sending them to the server for OCR processing.
* **OCR Technology:** Optical Character Recognition is key to extracting text from the scanned food labels. This allows the app to parse nutritional data and offer users meaningful insights into their food intake.
* **Axios:** Simplifies making API requests from the frontend to the backend. It's easy to use, supports async/await, and handles HTTP requests and responses smoothly.
* **Mongoose:** Provides an elegant solution for interacting with MongoDB. It allows for easy data validation and querying, ensuring smooth user authentication and data management.

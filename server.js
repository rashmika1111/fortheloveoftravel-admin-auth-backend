const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log(" Starting server...");
console.log(" Environment variables loaded:", {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? "Set" : "Missing",
  JWT_SECRET: process.env.JWT_SECRET ? " Set" : " Missing"
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Project LV Backend API is running! " });
});

// DB connection
console.log("🔌 Attempting to connect to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api/auth`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.log("Make sure MongoDB is running on your system");
    console.log("You can install MongoDB from: https://www.mongodb.com/try/download/community");
  });

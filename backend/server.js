const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
    .connect("mongodb://localhost:27017/EnvironmentData")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/reports", reportRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

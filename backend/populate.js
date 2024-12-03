const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Meteorology = require("./models/Meteorology");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/EnvironmentData");

// Function to read a PNG file and convert it to Buffer
const readImage = (imagePath) => {
    return fs.readFileSync(imagePath);
};

// Sample Data
const meteorologyData = [
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Seasonal",
        month: "October",
        year: 2024,
        content: {
            text: "There is a possibility for Near Normal rainfall over Sri Lanka except Ampara and Batticaloa districts where there is a possibility for Below Normal rainfall, during OND 2024 as a whole.<br><br>However if La Nina onset occurs in October 2024 there is some possibility of below average rainfall over Mullaitivu, Trincomalee, Vavuniya, Kilinochchi and Jaffna districts as well. On the other hand development of the synoptic scale systems such as lows and depressions are also possible during the month of October and November. If so rainfall can increase.",
            png1: readImage(path.join(__dirname, 'images', 'Screenshot 2024-12-03 113705.png')),  // Store image as Buffer
        },
    },
    // Add other data here in similar fashion, using `readImage` for png1, png2, and png3
];

async function populateData() {
    try {
        await Meteorology.deleteMany();  // Clear any existing data
        await Meteorology.insertMany(meteorologyData);  // Insert new data
        console.log("Database populated successfully!");
        mongoose.connection.close();  // Close connection after populating
    } catch (error) {
        console.error("Error populating database:", error);
    }
}

populateData();

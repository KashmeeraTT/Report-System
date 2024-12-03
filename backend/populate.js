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
    {
        department: "ID",
        category: "Reservoir",
        subcategory: "Major",
        district: "Puttalam",
        day: 9,
        month: "October",
        year: 2024,
        content: {
            csv1: "No,Division,Major Reservoir Name,Gross Extent,FSD,Gross Capacity\n1,Inginiimitiya,Inginiimitiya,6005,22.00,58858\n2,Puttalam,Tabbowa,2093,18.00,15403",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Recieved",
        month: "October",
        year: 2024,
        district: "Puttalam",
        content: {
            text: "According to the available rainfall data in the Department of Meteorology, below normal rainfalls were reported from Anuradhapura, Kurunegala, Mathale, Kandy, Nuwara Eliya and Badulla districts. Near or above normal rainfalls were reported from other parts of the country during the month of October 2024.<p>Below Normal rainfalls were observed in Puttalam district. The observed Percent of Normal Precipitation was <OBSERVED_PERCIPITATION=40%> as district average.<p>Rainfall anomaly Category:<ul><li>Above Normal: 110 % < Rainfall anomaly<li>Near Normal: 90 % ≤ Rainfall anomaly ≤110 %<li>Below Normal: 90% > Rainfall anomaly</ul>",
            png1: readImage(path.join(__dirname, 'images', '2024-11-00-DoM-Received-Monthly-Rainfall-October.png')),
            png2: readImage(path.join(__dirname, 'images', '2024-11-00-DoM-Percent-of-Normal-Precipitation-October.png')),
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

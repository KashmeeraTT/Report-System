const mongoose = require("mongoose");
const Meteorology = require("./models/Meteorology");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/EnvironmentData");

const meteorologyData = [
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Seasonal",
        month: "October",
        year: 2024,
        content: {
            text: "Rainfall is expected to be above normal.",
            png1: "seasonal_rainfall_october.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Monthly",
        month: "November",
        submonth: "November",
        year: 2024,
        content: {
            text: "Rainfall is expected to be near normal.",
            png1: "rainfall_forecast_november_november.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Monthly",
        month: "November",
        submonth: "December",
        year: 2024,
        content: {
            text: "Rainfall is expected to be near normal.",
            png1: "rainfall_forecast_november_december.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Monthly",
        month: "November",
        submonth: "January",
        year: 2024,
        content: {
            text: "Rainfall is expected to be near normal.",
            png1: "rainfall_forecast_november_january.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Weekly",
        year: 2024,
        weekNumber: 42,
        subweekNumber: 1,
        district: "Puttalam",
        content: {
            text: "Near or slightly below normal rainfall expected in Puttalam.",
            png1: "weekly_rainfall_week1_october.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Weekly",
        year: 2024,
        weekNumber: 42,
        subweekNumber: 2,
        district: "Puttalam",
        content: {
            text: "Near or slightly below normal rainfall expected in Puttalam.",
            png1: "weekly_rainfall_week1_october.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Weekly",
        year: 2024,
        weekNumber: 42,
        subweekNumber: 3,
        district: "Puttalam",
        content: {
            text: "Near or slightly below normal rainfall expected in Puttalam.",
            png1: "weekly_rainfall_week1_october.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Weekly",
        year: 2024,
        weekNumber: 42,
        subweekNumber: 4,
        district: "Puttalam",
        content: {
            text: "Near or slightly below normal rainfall expected in Puttalam.",
            png1: "weekly_rainfall_week1_october.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Recieved",
        month: "September",
        year: 2024,
        district: "Puttalam",
        content: {
            text: "Rainfall received was significantly higher than average.",
            png1: "received_rainfall_1.png",
            png2: "received_rainfall_2.png",
        },
    },
    {
        department: "DoM",
        category: "Rainfall",
        subcategory: "Climatological",
        month: "October",
        year: 2024,
        district: "Puttalam",
        content: {
            text: "Climatological data shows normal rainfall trends for October.",
            csv1: "climatological_rainfall_1.csv",
            csv2: "climatological_rainfall_2.csv",
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
            csv1: "major_reservoir_october.csv",
        },
    },
    {
        department: "ID",
        category: "Reservoir",
        subcategory: "Medium",
        district: "Puttalam",
        day: 10,
        month: "October",
        year: 2024,
        content: {
            csv1: "medium_reservoir_october.csv",
        },
    },
    {
        department: "DAD",
        category: "Reservoir",
        subcategory: "Minor",
        district: "Puttalam",
        day: 10,
        month: "October",
        year: 2024,
        content: {
            png1: "tank1.png",
            png2: "tank2.png",
            png3: "tank3.png",
        },
    },
];

async function populateData() {
    try {
        await Meteorology.deleteMany();
        await Meteorology.insertMany(meteorologyData);
        console.log("Database populated successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error populating database:", error);
    }
}

populateData();

const mongoose = require("mongoose");

const MeteorologySchema = new mongoose.Schema({
    department: String,
    category: String,
    subcategory: String,
    day: Number,
    month: String,
    submonth: String,
    year: Number,
    district: String,
    weekNumber: Number,
    subweekNumber: Number,
    content: {
        text: String,
        png1: String,
        png2: String,
        png3: String,
        csv1: String,
        csv2: String,
    },
});

module.exports = mongoose.model("Meteorology", MeteorologySchema);

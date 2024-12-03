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
        png1: Buffer,
        png2: Buffer,
        png3: Buffer,
        csv1: String,
        csv2: String,
    },
});

module.exports = mongoose.model("Meteorology", MeteorologySchema);

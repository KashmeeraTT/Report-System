const moment = require("moment");
const Meteorology = require("../models/Meteorology");

// Calculate ISO week number
function calculateWeekNumber(day, month, year) {
    const date = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD");
    return date.isoWeek();
}

async function findNearestPrevious(category, subcategory, district, year, month, day) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Ensure the month is valid
    const monthIndex = months.indexOf(month);
    if (monthIndex === -1) {
        throw new Error(`Invalid month name: ${month}`);
    }

    // Start date (one year before the input date)
    const startDate = new Date(year - 1, monthIndex, day);

    // End date (the input date)
    const endDate = new Date(year, monthIndex, day);

    // Query the database iteratively for nearest previous or equal document within one year
    for (let y = year; y >= startDate.getFullYear(); y--) {
        for (let m = y === year ? monthIndex : months.length - 1; m >= (y === startDate.getFullYear() ? startDate.getMonth() : 0); m--) {
            const queryMonth = months[m];
            const query = {
                category,
                subcategory,
                district,
                year: y,
                month: queryMonth,
            };

            // Add day condition only for the input month of the input year
            if (y === year && m === monthIndex) {
                query.day = { $lte: day }; // Include equality for the same month
            }

            // Perform the query
            const result = await Meteorology.findOne(query)
                .sort({ year: -1, month: -1, day: -1 }) // Sort descending
                .exec();

            // Return the result if found
            if (result) {
                return result;
            }
        }
    }

    // Return null if no match is found
    return null;
}

// Generate the report
exports.generateReport = async (req, res) => {
    const { year, month, day, district } = req.body;

    try {
        const weekNumber = calculateWeekNumber(day, month, year);

        // Fetch data for all sections of the report
        const seasonalRainfall = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Seasonal",
            month,
            year,
        });

        const rainfallForecast1 = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Monthly",
            month,
            submonth: month,
            year,
        });

        const nextMonth1 = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD")
            .add(1, "month")
            .format("MMMM");
        const nextMonth1Year = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD")
            .add(1, "month")
            .year();
        const rainfallForecast2 = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Monthly",
            month,
            submonth: nextMonth1,
            year,
        });

        const nextMonth2 = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD")
            .add(2, "month")
            .format("MMMM");
        const nextMonth2Year = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD")
            .add(2, "month")
            .year();
        const rainfallForecast3 = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Monthly",
            month,
            submonth: nextMonth2,
            year,
        });

        const weeklyRainfall1 = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Weekly",
            year,
            district,
            weekNumber,
            subweekNumber: 1,
        });

        const weeklyRainfall2 = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Weekly",
            year,
            district,
            weekNumber,
            subweekNumber: 2,
        });

        const weeklyRainfall3 = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Weekly",
            year,
            district,
            weekNumber,
            subweekNumber: 3,
        });

        const weeklyRainfall4 = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Weekly",
            year,
            district,
            weekNumber,
            subweekNumber: 4,
        });

        const previousMonth = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD")
            .subtract(1, "month")
            .format("MMMM");
        const previousMonthYear = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD")
            .subtract(1, "month")
            .year();
        const receivedRainfall = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Received",
            year,
            month: previousMonth,
            district,
        });

        const climatologicalRainfall = await Meteorology.findOne({
            category: "Rainfall",
            subcategory: "Climatological",
            year,
            month,
            district,
        });

        const majorReservoir = await findNearestPrevious(
            "Reservoir",
            "Major",
            district,
            year,
            month,
            day
        );

        const mediumReservoir = await findNearestPrevious(
            "Reservoir",
            "Medium",
            district,
            year,
            month,
            day
        );

        const minorTank = await findNearestPrevious(
            "Reservoir",
            "Minor",
            district,
            year,
            month,
            day
        );

        // Generate dynamic introduction
        const introduction = `
            <div>
                <h1>District Agro-met Advisory Co-production</h1>
                <h2>${district} District</h2>
                <h3>${day} ${month} ${year}</h3>
                <h4>Part A</h4>
                <p>
                    1. The Natural Resources Management Centre, Department of Agriculture (NRMC, DoA) 
                    has released the Agro-met advisory for ${month} ${year}, which incorporates weather 
                    forecasts provided by the Department of Meteorology (DoM) and the irrigation water availability 
                    information from the Irrigation Department (ID), Mahaweli Water Management Secretariat 
                    (MASL-WMS), and the Department of Agrarian Development (DAD). Field-level data and 
                    information for this document were collected from the Department of Agriculture (DoA), 
                    Mahaweli Authority of Sri Lanka (MASL), ID, DAD, and plantation research institutes.
                </p>
                <p>
                    2. The Department of Meteorology (DoM) has issued the seasonal weather forecast 
                    for the upcoming three-month period, outlining the anticipated weather conditions.
                </p>
            </div>
        `;

        // Generate the HTML report
        const report = `
            <html>
                <head>
                    <title>Environment Data Report</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            line-height: 1.6;
                        }
                        h1, h2, h3, h4 {
                            text-align: center;
                        }
                        .section {
                            margin-top: 20px;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                    </style>
                </head>
                <body>
                    ${introduction}
                    ${generateSection(`Seasonal Rainfall Forecast ${month} ${year}`, seasonalRainfall)}
                    ${generateSection(`Rainfall Forecast ${month} ${year}`, rainfallForecast1)}
                    ${generateSection(`Rainfall Forecast ${nextMonth1} ${nextMonth1Year}`, rainfallForecast2)}
                    ${generateSection(`Rainfall Forecast ${nextMonth2} ${nextMonth2Year}`, rainfallForecast3)}
                    ${generateSection(`Weekly Rainfall 1 (Week ${weekNumber}) ${district}`, weeklyRainfall1)}
                    ${generateSection(`Weekly Rainfall 2 (Week ${weekNumber}) ${district}`, weeklyRainfall2)}
                    ${generateSection(`Weekly Rainfall 3 (Week ${weekNumber}) ${district}`, weeklyRainfall3)}
                    ${generateSection(`Weekly Rainfall 4 (Week ${weekNumber}) ${district}`, weeklyRainfall4)}
                    ${generateSection(`Received Rainfall ${previousMonth} ${previousMonthYear}`, receivedRainfall)}
                    ${generateSection(`General Climatological Rainfall ${month} ${year}`, climatologicalRainfall)}
                    ${generateSection(`Major Reservoir Water Availability as of ${day} ${month} ${year}`, majorReservoir)}
                    ${generateSection(`Medium Reservoir Water Availability as of ${day} ${month} ${year}`, mediumReservoir)}
                    ${generateSection(`Minor Tank Water Availability as of ${day} ${month} ${year}`, minorTank)}
                </body>
            </html>
        `;

        // Send the report as a downloadable file
        const filename = `${district}_Report_${day}_${month}_${year}.html`;
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "text/html");
        res.send(report);
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: "Error generating report." });
    }
};

// Helper to generate an HTML section
function generateSection(title, data) {
    if (!data) {
        return `<div class="section"><h2>${title}</h2><p>Data not available.</p></div>`;
    }

    return `
        <div class="section">
            <h2>${title}</h2>
            <p>${data.content.text || "No text available."}</p>
            ${data.content.png1 ? `<img src="${data.content.png1}" alt="${title} Image 1" />` : ""}
            ${data.content.png2 ? `<img src="${data.content.png2}" alt="${title} Image 2" />` : ""}
            ${data.content.png3 ? `<img src="${data.content.png3}" alt="${title} Image 3" />` : ""}
            ${data.content.csv1 ? `<p>CSV File 1: ${data.content.csv1}</p>` : ""}
            ${data.content.csv2 ? `<p>CSV File 2: ${data.content.csv2}</p>` : ""}
        </div>
    `;
}

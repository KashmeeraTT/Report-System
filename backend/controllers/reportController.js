const moment = require("moment");
const Meteorology = require("../models/Meteorology");

// Calculate ISO week number
function calculateWeekNumber(day, month, year) {
    const date = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD");
    return date.isoWeek();
}

// Find the nearest previous document within one year
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

    // Query within the one-year range
    for (let y = year; y >= startDate.getFullYear(); y--) {
        for (let m = y === year ? monthIndex : months.length - 1;
            m >= (y === startDate.getFullYear() ? startDate.getMonth() : 0);
            m--) {
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

            const result = await Meteorology.findOne(query)
                .sort({ year: -1, month: -1, day: -1 })
                .exec();

            if (result) {
                return result;
            }
        }
    }
    return null;
}

// Helper to generate an HTML section with page break
function generateSection(title, data) {
    if (!data) {
        return `
            <div class="section">
                <h2>${title}</h2>
                <p>Data not available.</p>
            </div>
            <!-- PAGE BREAK -->
        `;
    }

    // Convert Buffer to base64 string to embed in HTML
    const png1Base64 = data.content.png1 ? `data:image/png;base64,${data.content.png1.toString('base64')}` : null;
    const png2Base64 = data.content.png2 ? `data:image/png;base64,${data.content.png2.toString('base64')}` : null;
    const png3Base64 = data.content.png3 ? `data:image/png;base64,${data.content.png3.toString('base64')}` : null;

    return `
        <div class="section">
            <h2>${title}</h2>
            <p style="text-align: justify;">${data.content.text || "No text available."}</p>
            <div style="text-align: center;">
                ${png1Base64 ? `<img src="${png1Base64}" alt="${title} Image 1" />` : ""}
                ${png2Base64 ? `<img src="${png2Base64}" alt="${title} Image 2" />` : ""}
                ${png3Base64 ? `<img src="${png3Base64}" alt="${title} Image 3" />` : ""}
                ${data.content.csv1 ? `<p>CSV File 1: <a href="${data.content.csv1}" target="_blank">Download</a></p>` : ""}
                ${data.content.csv2 ? `<p>CSV File 2: <a href="${data.content.csv2}" target="_blank">Download</a></p>` : ""}
            </div>
        </div>
        <!-- PAGE BREAK -->
    `;
}

// Generate the report
exports.generateReport = async (req, res) => {
    const { year, month, day, district } = req.body;

    try {
        const weekNumber = calculateWeekNumber(day, month, year);

        // Fetch data for all sections of the report
        const seasonalRainfall = await Meteorology.findOne({ category: "Rainfall", subcategory: "Seasonal", month, year });
        const rainfallForecast1 = await Meteorology.findOne({ category: "Rainfall", subcategory: "Monthly", month, submonth: month, year });

        const nextMonth1 = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD").add(1, "month").format("MMMM");
        const nextMonth1Year = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD").add(1, "month").year();
        const rainfallForecast2 = await Meteorology.findOne({ category: "Rainfall", subcategory: "Monthly", month, submonth: nextMonth1, year });

        const nextMonth2 = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD").add(2, "month").format("MMMM");
        const nextMonth2Year = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD").add(2, "month").year();
        const rainfallForecast3 = await Meteorology.findOne({ category: "Rainfall", subcategory: "Monthly", month, submonth: nextMonth2, year });

        const weeklyRainfall1 = await Meteorology.findOne({ category: "Rainfall", subcategory: "Weekly", year, district, weekNumber, subweekNumber: 1 });
        const weeklyRainfall2 = await Meteorology.findOne({ category: "Rainfall", subcategory: "Weekly", year, district, weekNumber, subweekNumber: 2 });
        const weeklyRainfall3 = await Meteorology.findOne({ category: "Rainfall", subcategory: "Weekly", year, district, weekNumber, subweekNumber: 3 });
        const weeklyRainfall4 = await Meteorology.findOne({ category: "Rainfall", subcategory: "Weekly", year, district, weekNumber, subweekNumber: 4 });

        const previousMonth = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD").subtract(1, "month").format("MMMM");
        const previousMonthYear = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD").subtract(1, "month").year();
        const receivedRainfall = await Meteorology.findOne({ category: "Rainfall", subcategory: "Received", year, month: previousMonth, district });

        const climatologicalRainfall = await Meteorology.findOne({ category: "Rainfall", subcategory: "Climatological", year, month, district });

        const majorReservoir = await findNearestPrevious("Reservoir", "Major", district, year, month, day);
        const mediumReservoir = await findNearestPrevious("Reservoir", "Medium", district, year, month, day);
        const minorTank = await findNearestPrevious("Reservoir", "Minor", district, year, month, day);

        // Generate dynamic introduction
        const introduction = `
            <div class="section">
                <h1>District Agro-met Advisory Co-production</h1>
                <h2>${district} District</h2>
                <h3>${day} ${month} ${year}</h3>
                <p style="text-align: justify;">
                    The Natural Resources Management Centre, Department of Agriculture (NRMC, DoA) 
                    has released the Agro-met advisory for ${month} ${year}, incorporating weather 
                    forecasts from the Department of Meteorology (DoM) and irrigation water availability 
                    information from various departments. Field-level data were collected from multiple sources 
                    to compile this report.
                </p>
                <p style="text-align: justify;">
                    The Department of Meteorology (DoM) has issued the seasonal weather forecast 
                    for the upcoming three-month period, outlining anticipated weather conditions.
                </p>
            </div>
            <!-- PAGE BREAK -->
        `;

        // Generate the HTML report with sections
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
                        .pagination-controls {
                            text-align: center;
                            margin-top: 20px;
                        }
                        .pagination-button {
                            padding: 10px 20px;
                            margin: 0 5px;
                            background-color: #007bff;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                        .pagination-button:disabled {
                            background-color: #ccc;
                            cursor: not-allowed;
                        }
                    </style>
                </head>
                <body>
                    ${introduction}
                    ${generateSection(`Seasonal Rainfall Forecast ${month} ${year} - ${nextMonth2} ${nextMonth2Year}`, seasonalRainfall)}
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
}

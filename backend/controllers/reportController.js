const moment = require("moment");
const Meteorology = require("../models/Meteorology");

// Calculate ISO week number
function calculateWeekNumber(day, month, year) {
    const date = moment(`${year}-${month}-${day}`, "YYYY-MMMM-DD");
    return date.isoWeek();
}

// Adjusts week numbers and years if they fall outside the current year.
function adjustWeekNumbers(year, startWeekNumber, weeksToCheck = 4) {
    const weeks = [];

    for (let i = 0; i < weeksToCheck; i++) {
        const currentDate = moment()
            .year(year)
            .isoWeek(startWeekNumber + i)
            .startOf("isoWeek");

        // If the calculated week number overflows, adjust the year and week number
        weeks.push({
            weekNumber: currentDate.isoWeek(),
            year: currentDate.year(),
        });
    }

    return weeks;
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
function generateSection(title, data, observedPrecipitation = null) {
    if (!data) {
        return `
            <div class="section" style="page-break-after: always;">
                <h2>${title}</h2>
                <p>Data not available.</p>
            </div>
            <!-- PAGE BREAK -->
        `;
    }

    // Replace the placeholder with the actual observed precipitation value
    let updatedText = data.content.text;
    if (observedPrecipitation) {
        console.log(observedPrecipitation);
        updatedText = updatedText.replace(
            "<OBSERVED_PERCIPITATION>",
            `${observedPrecipitation}%`
        );
    }

    // Convert Buffer to base64 string to embed in HTML
    const png1Base64 = data.content.png1 ? `data:image/png;base64,${data.content.png1.toString('base64')}` : null;
    const png2Base64 = data.content.png2 ? `data:image/png;base64,${data.content.png2.toString('base64')}` : null;
    const png3Base64 = data.content.png3 ? `data:image/png;base64,${data.content.png3.toString('base64')}` : null;

    // Helper to render CSV data as a table
    const renderCsvToHtmlTable = (csvData) => {
        if (!csvData) return "";

        const rows = csvData.split("\n");
        let htmlTable = "<table border='1' style='border-collapse: collapse; width: 100%; text-align: left;'>";

        rows.forEach((row, rowIndex) => {
            const columns = row.split(",");
            if (rowIndex === 0) {
                htmlTable += "<tr>";
                columns.forEach((cell) => {
                    htmlTable += `<th style="padding: 8px; background-color: #f2f2f2;">${cell.trim()}</th>`;
                });
                htmlTable += "</tr>";
            } else {
                htmlTable += "<tr>";
                columns.forEach((cell) => {
                    htmlTable += `<td style="padding: 8px;">${cell.trim()}</td>`;
                });
                htmlTable += "</tr>";
            }
        });

        htmlTable += "</table>";
        return htmlTable;
    };

    const csv1Table = data.content.csv1 ? renderCsvToHtmlTable(data.content.csv1) : "";
    const csv2Table = data.content.csv2 ? renderCsvToHtmlTable(data.content.csv2) : "";

    return `
        <div class="section" style="page-break-after: always;">
            <h2>${title}</h2>
            <p style="text-align: justify;">${updatedText || "No text available."}</p>
            <div style="text-align: center; margin-top: 20px;">
                ${png1Base64 ? `<img src="${png1Base64}" alt="${title} Image 1" style="max-width: 80%; margin: 10px auto;" />` : ""}
                ${png2Base64 ? `<img src="${png2Base64}" alt="${title} Image 2" style="max-width: 80%; margin: 10px auto;" />` : ""}
                ${png3Base64 ? `<img src="${png3Base64}" alt="${title} Image 3" style="max-width: 80%; margin: 10px auto;" />` : ""}
                ${csv1Table ? `<div style="margin-top: 20px;">${csv1Table}</div>` : ""}
                ${csv2Table ? `<div style="margin-top: 20px;">${csv2Table}</div>` : ""}
            </div>
        </div>
        <!-- PAGE BREAK -->
    `;
}

// Generate the report
exports.generateReport = async (req, res) => {
    const { year, month, day, district, observedPrecipitation } = req.body;

    try {
        const weekNumber = calculateWeekNumber(day, month, year);
        const adjustedWeekNumbers = adjustWeekNumbers(year, weekNumber)
        console.log(adjustedWeekNumbers);

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
        const receivedRainfall = await Meteorology.findOne({ category: "Rainfall", subcategory: "Recieved", year, month: previousMonth, district });

        const climatologicalRainfall = await Meteorology.findOne({ category: "Rainfall", subcategory: "Climatological", year, month, district });

        const majorReservoir = await findNearestPrevious("Reservoir", "Major", district, year, month, day);
        const mediumReservoir = await findNearestPrevious("Reservoir", "Medium", district, year, month, day);
        const minorTank = await findNearestPrevious("Reservoir", "Minor", district, year, month, day);

        // Generate dynamic introduction
        const introduction = `
            <div class="section" style="page-break-after: always;">
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
                    ${generateSection(`Weekly Rainfall ${district} District Week ${weekNumber} ${year}`, weeklyRainfall1)}
                    ${generateSection(`Weekly Rainfall ${district} District Week ${adjustedWeekNumbers[1].weekNumber} ${adjustedWeekNumbers[1].year}`, weeklyRainfall2)}
                    ${generateSection(`Weekly Rainfall ${district} District Week ${adjustedWeekNumbers[2].weekNumber} ${adjustedWeekNumbers[2].year}`, weeklyRainfall3)}
                    ${generateSection(`Weekly Rainfall ${district} District Week ${adjustedWeekNumbers[3].weekNumber} ${adjustedWeekNumbers[3].year}`, weeklyRainfall4)}
                    ${generateSection(`Received Rainfall ${previousMonth} ${previousMonthYear}`, receivedRainfall, observedPrecipitation)}
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

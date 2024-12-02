import React, { useState } from "react";
import "./GenerateReport.css"; // Import CSS for styling

function GenerateReport() {
    const [formData, setFormData] = useState({
        year: "",
        month: "",
        day: "",
        district: "",
    });

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const districts = [
        "Colombo",
        "Gampaha",
        "Kalutara",
        "Kandy",
        "Matale",
        "Nuwara Eliya",
        "Galle",
        "Matara",
        "Hambantota",
        "Jaffna",
        "Kilinochchi",
        "Mannar",
        "Vavuniya",
        "Mullaitivu",
        "Batticaloa",
        "Ampara",
        "Trincomalee",
        "Kurunegala",
        "Puttalam",
        "Anuradhapura",
        "Polonnaruwa",
        "Badulla",
        "Moneragala",
        "Ratnapura",
        "Kegalle",
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await fetch("http://localhost:3000/api/reports/generate-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to generate report");
            }

            const htmlReport = await response.text();
            setReport(htmlReport); // Set report for viewing in the browser
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/reports/generate-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to download report");
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const { year, month, day, district } = formData;
            const filename = `${district}_Report_${day}_${month}_${year}.html`;
            a.download = filename;

            a.click();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <div className="form-container">
                <h1 className="title">Generate Report</h1>
                <form className="form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="year" className="label">Year:</label>
                        <input
                            type="number"
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="month" className="label">Month:</label>
                        <select
                            id="month"
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">Select a month</option>
                            {[
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December",
                            ].map((month) => (
                                <option key={month} value={month}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="day" className="label">Day:</label>
                        <select
                            id="day"
                            name="day"
                            value={formData.day}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">Select a day</option>
                            {[...Array(31).keys()].map((day) => (
                                <option key={day + 1} value={day + 1}>
                                    {day + 1}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="district" className="label">District:</label>
                        <select
                            id="district"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">Select a district</option>
                            {districts.map((district) => (
                                <option key={district} value={district}>
                                    {district}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="button">
                        View Report
                    </button>
                </form>
                {loading && <p className="loading">Generating report...</p>}
                {error && <p className="error">{error}</p>}
                {report && (
                    <div className="button-container">
                        <button onClick={handleDownload} className="button download-button">
                            Download Report
                        </button>
                    </div>
                )}
            </div>
            <div className="report-container">
                {report ? (
                    <div className="report">
                        <h2>Generated Report:</h2>
                        <iframe
                            title="Report"
                            srcDoc={report}
                            className="iframe"
                        ></iframe>
                    </div>
                ) : (
                    <p className="placeholder">The report will appear here once generated.</p>
                )}
            </div>
        </div>
    );
}

export default GenerateReport;

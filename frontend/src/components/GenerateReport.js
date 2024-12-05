import React, { useState, useEffect } from "react";
import "./GenerateReport.css";

function GenerateReport() {
    const [formData, setFormData] = useState({
        year: "",
        month: "",
        day: "",
        district: "",
        observedPrecipitation: "", // New field for observed precipitation
    });

    const [reportPages, setReportPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const districts = [
        "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale",
        "Puttalam", "Trincomalee", "Nuwara Eliya",
        "Matara", "Galle", "Hambantota", "Jaffna", "Kilinochchi",
        "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara",
        "Kurunegala", "Anuradhapura", "Polonnaruwa", "Badulla",
        "Moneragala", "Ratnapura", "Kegalle",
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setReportPages([]);
        setCurrentPage(0);

        try {
            const response = await fetch("http://localhost:3000/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to generate report");
            }

            const htmlReport = await response.text();

            // Split the report into pages using the marker
            const pages = htmlReport.split("<!-- PAGE BREAK -->");
            setReportPages(pages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to download report");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const filename = `${formData.district}_Report_${formData.day}_${formData.month}_${formData.year}.html`;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleNextPage = () => {
        if (currentPage < reportPages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Disable download button if on page 10 and observedPrecipitation is invalid
    const isDownloadDisabled =
        (formData.observedPrecipitation === "" ||
            isNaN(formData.observedPrecipitation) ||
            formData.observedPrecipitation < 0 ||
            formData.observedPrecipitation > 100);

    useEffect(() => {
        if (currentPage !== 9) {
            // Highlight observed precipitation when navigating away from the 10th page
            const observedField = document.getElementById("observedPrecipitation");
            if (observedField && formData.observedPrecipitation !== "") {
                observedField.style.color = "red";
            }
        }
    }, [currentPage, formData.observedPrecipitation]);

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
                            min="1900"
                            max="2100"
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
                                "January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                            ].map((month) => (
                                <option key={month} value={month}>{month}</option>
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
                                <option key={day + 1} value={day + 1}>{day + 1}</option>
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
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>
                    {currentPage === 9 && (
                        <div className="form-group">
                            <label htmlFor="observedPrecipitation" className="label">Observed Precipitation (%):</label>
                            <input
                                type="number"
                                id="observedPrecipitation"
                                name="observedPrecipitation"
                                value={formData.observedPrecipitation}
                                onChange={handleChange}
                                className="input"
                                min="0"
                                max="100"
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="button">Generate Report</button>
                </form>
                {loading && <p className="loading">Generating report...</p>}
                {error && <p className="error">{error}</p>}
                {reportPages.length > 0 && (
                    <div className="button-container">
                        <button
                            onClick={handleDownload}
                            className={`button ${isDownloadDisabled ? "disabled-button" : ""}`}
                            disabled={isDownloadDisabled}
                        >
                            Download Report
                        </button>
                        <p
                            className="note"
                            style={{
                                color: isDownloadDisabled ? "red" : "green",
                                marginTop: "10px",
                                fontSize: "14px",
                            }}
                        >
                            {isDownloadDisabled
                                ? "Please go to page 10 to fill the observed precipitation field."
                                : `Observed precipitation is filled: ${formData.observedPrecipitation}%`}
                        </p>
                    </div>
                )}
            </div>
            <div className="report-container">
                {reportPages.length > 0 ? (
                    <div className="report-viewer">
                        <iframe
                            title="Report Page"
                            srcDoc={reportPages[currentPage]}
                            className="iframe"
                        ></iframe>
                        <div className="pagination-controls">
                            <button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 0}
                                className="pagination-button"
                            >
                                Previous
                            </button>
                            <span className="page-indicator">
                                Page {currentPage + 1} of {reportPages.length}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === reportPages.length - 1}
                                className="pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="placeholder">The report will appear here once generated.</p>
                )}
            </div>
        </div>
    );
}

export default GenerateReport;

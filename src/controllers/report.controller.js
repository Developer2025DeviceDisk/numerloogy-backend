const { getNumerologyReport } = require('../services/rapidapi.service');
const { generateNumerologyPDF } = require('../services/pdf.service');
const mongoose = require('mongoose');

// Assuming Report model is registered in server.js, but we might need to import it if we refactor.
// For now, let's use the model from mongoose if it's already registered.
const Report = mongoose.models.Report || mongoose.model('Report', new mongoose.Schema({
    fullName: String,
    email: { type: String, required: true },
    phone: String,
    dob: String,
    gender: String,
    location: String,
    createdAt: { type: Date, default: Date.now }
}));

const createReport = async (req, res) => {
    try {
        console.log('Received report request:', JSON.stringify(req.body, null, 2));
        const userData = req.body;
        
        // 1. Save user data to MongoDB (as requested before)
        const newReport = new Report(userData);
        await newReport.save();

        // 2. Call RapidAPI for numerology insights
        const apiData = await getNumerologyReport(userData);

        // 3. Generate PDF
        const pdfBuffer = await generateNumerologyPDF(userData, apiData);

        // 4. Send PDF for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Numerology_Report_${userData.fullName.replace(/\s+/g, '_')}.pdf`);
        res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error('Report Creation Error:', error.message);
        res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
    }
};

module.exports = { createReport };

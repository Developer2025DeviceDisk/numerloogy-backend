const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/report.controller');

// Define a test route
router.get('/test', (req, res) => {
    res.json({ message: "Numerology routes working!" });
});

// Route to create and download the report
router.post('/', createReport);

module.exports = router;
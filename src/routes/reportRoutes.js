const express = require('express');
const router = express.Router();

// Define a test route
router.get('/test', (req, res) => {
    res.json({ message: "Numerology routes working!" });
});

// THIS IS THE MOST IMPORTANT LINE:
module.exports = router;
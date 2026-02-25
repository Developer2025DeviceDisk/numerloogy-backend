const express = require('express');
const router = express.Router();
const Contact = require('../models/contact'); 

// POST request to save data
router.post('/', async (req, res) => {
    try {
        const newContact = new Contact(req.body);
        await newContact.save();
        res.status(201).json({ message: "Saved successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚨 YOU ARE LIKELY MISSING THIS LINE BELOW 🚨
module.exports = router;
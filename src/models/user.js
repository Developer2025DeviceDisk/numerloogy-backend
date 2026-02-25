const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    lifePathNumber: { type: Number, required: true },
    destinyNumber: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserReport', reportSchema);
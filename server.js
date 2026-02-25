require('dotenv').config(); // MUST be the first line to load your credentials
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Initialize the Express application
const app = express();

// 1. Connect to MongoDB Atlas
// This uses the MONGO_URI from your .env file
connectDB();

// 2. Middleware
app.use(cors()); // Allows your frontend to connect to the backend
app.use(express.json()); // Allows the server to read JSON data from your forms

// 3. Application Routes
// Route for Reports
app.use('/api/reports', require('./src/routes/reportRoutes'));

// Route for Contact Us submissions
app.use('/api/contact', require('./src/routes/contactRoutes'));

// 4. Basic Health Check (Optional)
// Visit http://localhost:5000 in your browser to see this
app.get('/', (req, res) => {
    res.send('Server is up and running! 🚀');
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// 6. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔗 Contact API ready at: http://localhost:${PORT}/api/contact`);
});
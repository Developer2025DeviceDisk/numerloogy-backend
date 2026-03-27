require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- 1. Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- 2. Database Connection ---
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://suraj:Suraj2523@cluster0.o6djoxw.mongodb.net/numerology?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// --- 3. Schemas & Models ---

// Schema for the Contact Form
const ContactSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true },
    subject: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', ContactSchema);

// Schema for the Reports Form
const ReportSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, required: true },
    phone: String,
    dob: String, 
    gender: String,
    location: String,
    createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model('Report', ReportSchema);
// --- New Schema for Subscribers ---
const SubscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now }
});
const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

// --- 4. Routes ---
const reportRoutes = require('./src/routes/reportRoutes');

// Health Check
app.get('/', (req, res) => {
    res.send('Server is up and running! 🚀');
});

// Route for Contact Form (handleSubmit)
app.post('/api/contact', async (req, res) => {
    try {
        const newContact = new Contact(req.body);
        await newContact.save();
        res.status(201).json({ success: true, message: "Contact message saved!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error saving contact", error: error.message });
    }
});

// Route for Reports Form
app.use('/api/reports', reportRoutes);

// NEW: Route for Newsletter Subscription

app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes("@")) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
        }

        // Check if already exists
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: "You're already subscribed!" });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.status(201).json({ success: true, message: "Subscribed successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error saving subscription", error: error.message });
    }
});

// --- 5. Global Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong on the server!' });
});

// --- 6. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`👉 Contact API: http://localhost:${PORT}/api/contact`);
    console.log(`👉 Reports API: http://localhost:${PORT}/api/reports`);
});
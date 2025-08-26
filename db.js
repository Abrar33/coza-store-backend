require('dotenv').config(); // Load .env variables

const mongoose = require('mongoose');
const db = process.env.db;

mongoose.connect(db)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));
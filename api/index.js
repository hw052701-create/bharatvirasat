const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: __dirname + '/../backend/.env' });

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — allow all origins for PWA & GitHub Pages
app.use(cors({ origin: '*' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── MongoDB Connection with Cached Connection for Serverless ──────────────────
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://bharatvirasat:BharatVirasat2026@cluster0.i9yzfym.mongodb.net/bharatvirasat?retryWrites=true&w=majority&appName=Cluster0';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ MongoDB Atlas Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

// Middleware to ensure DB connection per serverless request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('../backend/routes/auth'));
app.use('/api/heritage',  require('../backend/routes/heritage'));
app.use('/api/geohunt',   require('../backend/routes/geohunt'));
app.use('/api/community', require('../backend/routes/community'));
app.use('/api/ai',        require('../backend/routes/ai'));
app.use('/api/user',      require('../backend/routes/user'));

// ─── Health Checks ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🏛️ BharatVirasat API is Live on Vercel!',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Export app for Vercel Serverless Function
module.exports = app;

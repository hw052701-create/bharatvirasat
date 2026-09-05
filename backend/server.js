const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — allow all origins for PWA & GitHub Pages
app.use(cors({ origin: '*' }));

// Health Check Endpoint (at root and /api/health)
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.get('/', (req, res) => res.json({ message: 'BharatVirasat Backend API is Running 🪷', status: 'ok' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── MongoDB Connection ─────────────────────────────────────────────────────────
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://bharatvirasat:BharatVirasat2026@cluster0.i9yzfym.mongodb.net/bharatvirasat?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB Atlas Connected successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/heritage',  require('./routes/heritage'));
app.use('/api/geohunt',   require('./routes/geohunt'));
app.use('/api/community', require('./routes/community'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/user',      require('./routes/user'));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🏛️ BharatVirasat API is Live!',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BharatVirasat Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

if (String(PORT) !== '5000') {
  try {
    const s5000 = app.listen(5000, '0.0.0.0', () => console.log('Also listening on 5000'));
    s5000.on('error', () => {});
  } catch(e) {}
}
if (String(PORT) !== '8080') {
  try {
    const s8080 = app.listen(8080, '0.0.0.0', () => console.log('Also listening on 8080'));
    s8080.on('error', () => {});
  } catch(e) {}
}

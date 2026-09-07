const express = require('express');
const router = express.Router();
const Heritage = require('../models/Heritage');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/heritage ───────────────────────────────────────────────────────
// Get all heritage sites with filters
router.get('/', async (req, res) => {
  try {
    const { type, state, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (type && type !== 'all') query.type = type;
    if (state && state !== 'all') query.state = new RegExp(state, 'i');
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { district: searchRegex },
        { state: searchRegex },
        { tags: searchRegex },
        { dynasty: searchRegex },
        { description: searchRegex }
      ];
    }

    const total = await Heritage.countDocuments(query);
    const sites = await Heritage.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ views: -1, rating: -1, createdAt: -1 });

    res.json({ success: true, data: sites, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heritage sites', message: error.message });
  }
});

// ─── GET /api/heritage/featured ─────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const sites = await Heritage.find({ isASIProtected: true }).limit(6).sort({ views: -1 });
    res.json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured sites' });
  }
});

// ─── GET /api/heritage/nearby ────────────────────────────────────────────────
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radKm = parseFloat(radius);

    // Simple bounding box approximation
    const latDelta = radKm / 111;
    const lngDelta = radKm / (111 * Math.cos(latNum * Math.PI / 180));

    const sites = await Heritage.find({
      'location.lat': { $gte: latNum - latDelta, $lte: latNum + latDelta },
      'location.lng': { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta }
    }).limit(20);

    res.json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby sites' });
  }
});

// ─── GET /api/heritage/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const site = await Heritage.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!site) return res.status(404).json({ error: 'Heritage site not found' });
    res.json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch site', message: error.message });
  }
});

// ─── POST /api/heritage (admin/seed) ─────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const site = await Heritage.create(req.body);
    res.status(201).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create site', message: error.message });
  }
});

// ─── POST /api/heritage/seed ─────────────────────────────────────────────────
// Seed initial heritage data (from curated dataset)
router.post('/seed/init', async (req, res) => {
  try {
    const count = await Heritage.countDocuments();
    if (count > 50) return res.json({ message: 'Database already seeded', count });

    let heritageSites = [];
    const dataPath = path.join(__dirname, '../data/heritageSites.json');
    if (fs.existsSync(dataPath)) {
      heritageSites = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    if (heritageSites.length === 0) {
      const { parseNewDataFile } = require('../scripts/seedNewData');
      heritageSites = parseNewDataFile();
    }

    await Heritage.deleteMany({});
    await Heritage.insertMany(heritageSites);
    res.json({ success: true, message: `Seeded ${heritageSites.length} heritage sites`, count: heritageSites.length });
  } catch (error) {
    res.status(500).json({ error: 'Seeding failed', message: error.message });
  }
});

module.exports = router;

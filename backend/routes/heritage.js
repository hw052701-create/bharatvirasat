const express = require('express');
const router = express.Router();
const Heritage = require('../models/Heritage');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/heritage ───────────────────────────────────────────────────────
// Get all heritage sites with filters
router.get('/', async (req, res) => {
  try {
    const { type, state, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (type && type !== 'all') query.type = type;
    if (state) query.state = new RegExp(state, 'i');
    if (search) {
      query.$text = { $search: search };
    }

    const total = await Heritage.countDocuments(query);
    const sites = await Heritage.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ views: -1, createdAt: -1 });

    res.json({ success: true, data: sites, total, page: parseInt(page), pages: Math.ceil(total / limit) });
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
// Seed initial heritage data (one-time use)
router.post('/seed/init', async (req, res) => {
  try {
    const count = await Heritage.countDocuments();
    if (count > 0) return res.json({ message: 'Database already seeded', count });

    const heritageSites = [
      { name: 'Taj Mahal', type: 'architecture', description: 'An ivory-white marble mausoleum on the south bank of the Yamuna river, commissioned by Mughal emperor Shah Jahan in 1631.', shortDesc: 'Iconic white marble mausoleum built by Shah Jahan', state: 'Uttar Pradesh', city: 'Agra', location: { lat: 27.1751, lng: 78.0421, address: 'Agra, Uttar Pradesh' }, builtIn: '1653', dynasty: 'Mughal', significance: 'UNESCO World Heritage Site, Symbol of Love', isASIProtected: true, isUNESCO: true, tags: ['mughal', 'marble', 'monument', 'unesco'], rating: 4.9, reviewCount: 50000 },
      { name: 'Red Fort', type: 'architecture', description: 'A historic fort in Old Delhi that served as the main residence of the Mughal emperors for nearly 200 years.', shortDesc: 'Magnificent red sandstone Mughal fort in Delhi', state: 'Delhi', city: 'New Delhi', location: { lat: 28.6562, lng: 77.2410, address: 'Old Delhi' }, builtIn: '1648', dynasty: 'Mughal', significance: 'UNESCO World Heritage Site, National Symbol', isASIProtected: true, isUNESCO: true, tags: ['mughal', 'fort', 'delhi', 'unesco'], rating: 4.5, reviewCount: 30000 },
      { name: 'Hampi', type: 'architecture', description: 'A village in northern Karnataka, contains ruins of the Vijayanagara Empire. The fascinating landscape of giant boulders and the beautiful temples make it unique.', shortDesc: 'Ruins of the magnificent Vijayanagara Empire', state: 'Karnataka', city: 'Hampi', location: { lat: 15.3350, lng: 76.4600, address: 'Hampi, Karnataka' }, builtIn: '14th century', dynasty: 'Vijayanagara', significance: 'UNESCO World Heritage Site', isASIProtected: true, isUNESCO: true, tags: ['vijayanagara', 'ruins', 'karnataka', 'temple'], rating: 4.8, reviewCount: 15000 },
      { name: 'Ajanta Caves', type: 'architecture', description: '30 rock-cut Buddhist cave monuments dating from the 2nd century BCE. Famous for Buddhist religious art.', shortDesc: '2000-year-old Buddhist rock-cut cave paintings', state: 'Maharashtra', city: 'Aurangabad', location: { lat: 20.5519, lng: 75.7033, address: 'Aurangabad, Maharashtra' }, builtIn: '2nd century BCE', dynasty: 'Satavahana', significance: 'UNESCO World Heritage Site, Buddhist Art', isASIProtected: true, isUNESCO: true, tags: ['buddhist', 'caves', 'paintings', 'maharashtra'], rating: 4.7, reviewCount: 20000 },
      { name: 'Khajuraho Temples', type: 'architecture', description: 'A group of Hindu and Jain temples, famous for their Nagara-style architecture and erotic sculptures.', shortDesc: 'Stunning medieval temples with intricate sculptures', state: 'Madhya Pradesh', city: 'Khajuraho', location: { lat: 24.8520, lng: 79.9190, address: 'Khajuraho, Madhya Pradesh' }, builtIn: '950-1050 CE', dynasty: 'Chandela', significance: 'UNESCO World Heritage Site', isASIProtected: true, isUNESCO: true, tags: ['chandela', 'temple', 'sculpture', 'madhya-pradesh'], rating: 4.6, reviewCount: 12000 },
      { name: 'Konark Sun Temple', type: 'architecture', description: 'A 13th-century CE Sun Temple at Konark, designed as a giant chariot of the sun god Surya.', shortDesc: 'Magnificent 13th-century chariot-shaped Sun Temple', state: 'Odisha', city: 'Konark', location: { lat: 19.8876, lng: 86.0945, address: 'Konark, Odisha' }, builtIn: '1250 CE', dynasty: 'Eastern Ganga', significance: 'UNESCO World Heritage Site', isASIProtected: true, isUNESCO: true, tags: ['sun-temple', 'odisha', 'ganga-dynasty', 'chariot'], rating: 4.7, reviewCount: 18000 },
      { name: 'Holi Festival', type: 'culture', description: 'The Festival of Colors, celebrated on the day after the full moon in Phalguna. People celebrate with colored powders and water.', shortDesc: 'Vibrant festival of colors celebrating spring', state: 'All India', city: 'Mathura (Origin)', location: { lat: 27.4924, lng: 77.6737, address: 'Mathura, Uttar Pradesh' }, tags: ['festival', 'colors', 'spring', 'hindu'], rating: 4.9, reviewCount: 5000 },
      { name: 'Madhubani Paintings', type: 'culture', description: 'A style of Indian painting practiced in the Mithila region of Bihar. Characterized by complex geometric patterns.', shortDesc: 'Ancient folk art tradition from Mithila region', state: 'Bihar', city: 'Madhubani', location: { lat: 26.3600, lng: 86.0700, address: 'Madhubani, Bihar' }, tags: ['folk-art', 'painting', 'bihar', 'mithila'], rating: 4.6, reviewCount: 3000 },
      { name: 'Bharatnatyam', type: 'culture', description: 'One of the oldest classical dance forms of India originating from Tamil Nadu. Known for its grace, precision and sculpturesque poses.', shortDesc: 'Ancient classical dance form of Tamil Nadu', state: 'Tamil Nadu', city: 'Chennai', location: { lat: 13.0827, lng: 80.2707, address: 'Tamil Nadu' }, tags: ['dance', 'classical', 'tamil-nadu', 'art'], rating: 4.8, reviewCount: 8000 },
      { name: 'Qutub Minar', type: 'architecture', description: 'A UNESCO World Heritage Site in Delhi, the tallest minaret in India. Built by Qutb ud-Din Aibak in 1193.', shortDesc: 'Tallest minaret in India, built in 1193', state: 'Delhi', city: 'New Delhi', location: { lat: 28.5245, lng: 77.1855, address: 'Mehrauli, New Delhi' }, builtIn: '1193', dynasty: 'Delhi Sultanate', isASIProtected: true, isUNESCO: true, tags: ['sultanate', 'minaret', 'delhi', 'islamic'], rating: 4.5, reviewCount: 25000 },
      { name: 'Ellora Caves', type: 'architecture', description: 'UNESCO World Heritage Site featuring 100 caves cut into the vertical face of the Charanandri hills, representing Buddhist, Hindu and Jain traditions.', shortDesc: 'Rock-cut caves representing 3 religions together', state: 'Maharashtra', city: 'Aurangabad', location: { lat: 20.0258, lng: 75.1780, address: 'Ellora, Maharashtra' }, builtIn: '600-1000 CE', significance: 'UNESCO World Heritage Site, Religious Harmony', isASIProtected: true, isUNESCO: true, tags: ['caves', 'buddhist', 'hindu', 'jain', 'maharashtra'], rating: 4.8, reviewCount: 22000 },
      { name: 'Fatehpur Sikri', type: 'architecture', description: 'A city and a municipal board in the Agra District. The city was founded as the capital of the Mughal Empire by Emperor Akbar in 1571.', shortDesc: 'Abandoned Mughal capital city built by Akbar', state: 'Uttar Pradesh', city: 'Agra', location: { lat: 27.0945, lng: 77.6660, address: 'Fatehpur Sikri, UP' }, builtIn: '1571', dynasty: 'Mughal', isASIProtected: true, isUNESCO: true, tags: ['mughal', 'akbar', 'abandoned', 'capital'], rating: 4.4, reviewCount: 10000 },
      { name: 'Mahabalipuram Shore Temple', type: 'architecture', description: 'A complex of sanctuaries carved out of rock along the Shore of the Bay of Bengal. Built by the Pallava dynasty.', shortDesc: 'Ancient Pallava temples on the Bay of Bengal shore', state: 'Tamil Nadu', city: 'Mahabalipuram', location: { lat: 12.6169, lng: 80.1993, address: 'Mahabalipuram, Tamil Nadu' }, builtIn: '700-728 CE', dynasty: 'Pallava', isASIProtected: true, isUNESCO: true, tags: ['pallava', 'shore', 'temple', 'tamil-nadu'], rating: 4.6, reviewCount: 14000 },
      { name: 'Sanchi Stupa', type: 'architecture', description: 'The oldest stone structure in India, built by Emperor Ashoka in 3rd century BCE. One of the most important Buddhist monuments.', shortDesc: 'Oldest stone structure in India, built by Ashoka', state: 'Madhya Pradesh', city: 'Sanchi', location: { lat: 23.4793, lng: 77.7400, address: 'Sanchi, Madhya Pradesh' }, builtIn: '3rd century BCE', dynasty: 'Maurya', isASIProtected: true, isUNESCO: true, tags: ['ashoka', 'buddhist', 'stupa', 'maurya'], rating: 4.6, reviewCount: 9000 },
      { name: 'Pattadakal', type: 'architecture', description: 'A complex of 8th-century CE Hindu and Jain temples in Karnataka. A UNESCO World Heritage Site representing the peak of Chalukyan architecture.', shortDesc: 'Superb 8th-century Chalukyan temple complex', state: 'Karnataka', city: 'Pattadakal', location: { lat: 15.9484, lng: 75.8195, address: 'Pattadakal, Karnataka' }, builtIn: '8th century CE', dynasty: 'Chalukya', isASIProtected: true, isUNESCO: true, tags: ['chalukya', 'temple', 'karnataka', 'jain'], rating: 4.5, reviewCount: 7000 },
      { name: 'Nalanda University Ruins', type: 'research', description: 'Nalanda was one of the great centers of learning in the ancient world. Operating from 5th to 12th century CE, it attracted students from across Asia.', shortDesc: 'Ruins of the world\'s first residential university', state: 'Bihar', city: 'Nalanda', location: { lat: 25.1360, lng: 85.4433, address: 'Nalanda, Bihar' }, builtIn: '5th century CE', significance: 'UNESCO World Heritage Site, Ancient University', isASIProtected: true, isUNESCO: true, tags: ['university', 'buddhist', 'bihar', 'ancient-learning'], rating: 4.7, reviewCount: 11000 },
      { name: 'Rani ki Vav', type: 'architecture', description: 'An intricately constructed stepwell situated on the banks of the Saraswati River. Built in 11th century to commemorate a king.', shortDesc: 'Exquisite 11th-century stepwell dedicated to a king', state: 'Gujarat', city: 'Patan', location: { lat: 23.8592, lng: 72.1022, address: 'Patan, Gujarat' }, builtIn: '1063 CE', dynasty: 'Solanki', isASIProtected: true, isUNESCO: true, tags: ['stepwell', 'gujarat', 'solanki', 'water-heritage'], rating: 4.7, reviewCount: 8500 },
      { name: 'Chola Bronze Sculptures', type: 'research', description: 'The Chola bronzes are a collection of bronze sculptures from the medieval Chola period of South India. The Nataraja (Lord of Dance) is the most famous.', shortDesc: 'World-famous bronze sculptures of the Chola period', state: 'Tamil Nadu', city: 'Thanjavur', location: { lat: 10.7870, lng: 79.1378, address: 'Thanjavur, Tamil Nadu' }, builtIn: '9th-13th century CE', dynasty: 'Chola', tags: ['bronze', 'chola', 'nataraja', 'sculpture'], rating: 4.8, reviewCount: 6000 },
      { name: 'Varanasi Ghats', type: 'culture', description: 'The ghats are embankments made in steps of stone slabs along the river bank where pilgrims perform ritual ablutions. One of the oldest living cities in the world.', shortDesc: 'Sacred ghats of the world\'s oldest living city', state: 'Uttar Pradesh', city: 'Varanasi', location: { lat: 25.3176, lng: 82.9739, address: 'Varanasi, Uttar Pradesh' }, significance: 'Oldest living city, Spiritual capital', tags: ['ghat', 'ganges', 'spiritual', 'varanasi', 'ritual'], rating: 4.8, reviewCount: 40000 },
      { name: 'Meenakshi Amman Temple', type: 'architecture', description: 'A historic Hindu temple in Madurai, Tamil Nadu. It is dedicated to Meenakshi, a form of Parvati and her consort, Sundareswarar, a form of Shiva.', shortDesc: 'Magnificent Dravidian temple with 14 towering gopurams', state: 'Tamil Nadu', city: 'Madurai', location: { lat: 9.9196, lng: 78.1193, address: 'Madurai, Tamil Nadu' }, builtIn: '17th century CE', dynasty: 'Nayaka', isASIProtected: true, tags: ['dravidian', 'temple', 'tamil-nadu', 'gopuram', 'shiva'], rating: 4.8, reviewCount: 35000 },
      { name: 'Mysore Palace', type: 'architecture', description: 'The official residence and seat of the Wadiyars, the Maharajas of Mysore. One of the most visited monuments in India.', shortDesc: 'Opulent royal palace of the Mysore Maharajas', state: 'Karnataka', city: 'Mysore', location: { lat: 12.3051, lng: 76.6551, address: 'Mysore, Karnataka' }, builtIn: '1912', dynasty: 'Wadiyar', isASIProtected: true, tags: ['palace', 'royal', 'karnataka', 'wadiyar'], rating: 4.7, reviewCount: 28000 }
    ];

    await Heritage.insertMany(heritageSites);
    res.json({ success: true, message: `Seeded ${heritageSites.length} heritage sites`, count: heritageSites.length });
  } catch (error) {
    res.status(500).json({ error: 'Seeding failed', message: error.message });
  }
});

module.exports = router;

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Heritage = require('../models/Heritage');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://bharatvirasat:BharatVirasat2026@cluster0.i9yzfym.mongodb.net/bharatvirasat?retryWrites=true&w=majority&appName=Cluster0';

// City and district coordinates registry
const cityCoords = {
  // Uttar Pradesh
  "Agra": { lat: 27.1767, lng: 78.0081 },
  "Lucknow": { lat: 26.8467, lng: 80.9462 },
  "Old Lucknow": { lat: 26.8688, lng: 80.9129 },
  "Husainabad": { lat: 26.8715, lng: 80.9078 },
  "Husainabad Road": { lat: 26.8710, lng: 80.9085 },
  "Residency": { lat: 26.8612, lng: 80.9272 },
  "Residency Road": { lat: 26.8612, lng: 80.9272 },
  "Dilkusha": { lat: 26.8286, lng: 80.9636 },
  "Hazratganj": { lat: 26.8500, lng: 80.9499 },
  "Hazratganj area": { lat: 26.8500, lng: 80.9499 },
  "Kaiserbagh": { lat: 26.8546, lng: 80.9318 },
  "Yahiyaganj": { lat: 26.8582, lng: 80.9167 },
  "Gomti riverfront": { lat: 26.8631, lng: 80.9324 },
  "Gomti riverbank": { lat: 26.8631, lng: 80.9324 },
  "Lucknow Cantonment": { lat: 26.8200, lng: 80.9500 },
  "La Martiniere Road": { lat: 26.8378, lng: 80.9612 },
  "Bara Imambara": { lat: 26.8688, lng: 80.9129 },
  "Bara Imambara complex": { lat: 26.8688, lng: 80.9129 },
  "Varanasi": { lat: 25.3176, lng: 82.9739 },
  "Prayagraj": { lat: 25.4358, lng: 81.8463 },
  "Jhansi": { lat: 25.4484, lng: 78.5685 },
  "Banda": { lat: 25.4754, lng: 80.3347 },
  "Lalitpur": { lat: 24.6865, lng: 78.4116 },
  "Mahoba": { lat: 25.2922, lng: 79.8722 },
  "Shravasti": { lat: 27.5133, lng: 82.0294 },
  "Kushinagar": { lat: 26.7408, lng: 83.8890 },
  "Siddharthnagar": { lat: 27.2965, lng: 82.8126 },
  "Farrukhabad": { lat: 27.3826, lng: 79.5828 },
  "Kaushambi": { lat: 25.5342, lng: 81.3807 },
  "Ayodhya": { lat: 26.7922, lng: 82.1998 },
  "Mathura": { lat: 27.4924, lng: 77.6737 },
  "Chitrakoot": { lat: 25.2078, lng: 80.8542 },
  "Mirzapur": { lat: 25.1337, lng: 82.5644 },
  "Sonbhadra": { lat: 24.6853, lng: 83.0683 },
  "Meerut": { lat: 28.9845, lng: 77.7064 },
  "Kanpur Nagar": { lat: 26.4499, lng: 80.3319 },
  "Barabanki": { lat: 26.9268, lng: 81.1834 },
  "Sitapur": { lat: 27.5678, lng: 80.6829 },
  "Badaun": { lat: 28.0315, lng: 79.1247 },
  "Jaunpur": { lat: 25.7464, lng: 82.6837 },
  "Tikamgarh region / UP heritage context": { lat: 25.2600, lng: 78.9600 },

  // Gujarat
  "Patan": { lat: 23.8493, lng: 72.1266 },
  "Khadir Bet, Kutch": { lat: 23.8864, lng: 70.2178 },
  "Pavagadh/Champaner": { lat: 22.4854, lng: 73.5350 },
  "Panchmahal": { lat: 22.7500, lng: 73.6167 },
  "Old Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Makarba, Ahmedabad": { lat: 22.9984, lng: 72.5028 },
  "Adalaj": { lat: 23.1667, lng: 72.5833 },
  "Modhera": { lat: 23.5835, lng: 72.1332 },
  "Near Saragwala": { lat: 22.5225, lng: 72.2492 },
  "Junagadh": { lat: 21.5222, lng: 70.4579 },
  "Bhuj": { lat: 23.2420, lng: 69.6669 },
  "Bhuj, Kutch": { lat: 23.2420, lng: 69.6669 },
  "Kutch": { lat: 23.7337, lng: 69.8597 },
  "Kutch / Gujarat": { lat: 23.7337, lng: 69.8597 },
  "Lakhpat": { lat: 23.8297, lng: 68.7844 },
  "Mandvi": { lat: 22.8339, lng: 69.3562 },
  "Surat": { lat: 21.1702, lng: 72.8311 },
  "Vadnagar": { lat: 23.7845, lng: 72.6393 },
  "Rajkot": { lat: 22.3039, lng: 70.8022 },
  "Rajkot district": { lat: 22.3039, lng: 70.8022 },
  "Aravalli": { lat: 23.5333, lng: 73.2667 },
  "Mehsana": { lat: 23.5880, lng: 72.3693 },
  "Mehsana / Patan": { lat: 23.7000, lng: 72.2500 },
  "Vadodara": { lat: 22.3072, lng: 73.1812 },
  "Gandhinagar": { lat: 23.2156, lng: 72.6369 },
  "Gir Somnath": { lat: 20.9000, lng: 70.4000 },
  "Mahisagar": { lat: 23.1667, lng: 73.5500 },
  "Dandi, Navsari": { lat: 20.8872, lng: 72.7933 },
  "Gujarat": { lat: 22.2587, lng: 71.1924 },
  "Statewide": { lat: 22.2587, lng: 71.1924 },
  "Ahmedabad and other locations": { lat: 23.0225, lng: 72.5714 },
  "Ahmedabad / Dandi": { lat: 23.0225, lng: 72.5714 },
  "Tarnetar": { lat: 22.5000, lng: 71.2500 },
  "Madhavpur": { lat: 21.2550, lng: 69.9575 },
  "Vautha": { lat: 22.7500, lng: 72.5000 },
  "Ambaji": { lat: 24.3333, lng: 72.8500 },
  "Dang": { lat: 20.8000, lng: 73.7000 },
  "Sabarkantha": { lat: 23.6000, lng: 73.0000 },

  // Punjab
  "Amritsar": { lat: 31.6340, lng: 74.8723 },
  "Kapurthala": { lat: 31.3800, lng: 75.3800 },
  "Patiala": { lat: 30.3398, lng: 76.3869 },
  "Jalandhar": { lat: 31.3260, lng: 75.5762 },
  "Bathinda": { lat: 30.2110, lng: 74.9455 },
  "Faridkot": { lat: 30.6769, lng: 74.7583 },
  "Ferozepur": { lat: 30.9237, lng: 74.6065 },
  "Fazilka": { lat: 30.4037, lng: 74.0254 },
  "Hoshiarpur": { lat: 31.5273, lng: 75.9149 },
  "Rupnagar": { lat: 30.9700, lng: 76.5300 },
  "Gurdaspur": { lat: 32.0419, lng: 75.4053 },
  "Sangrur": { lat: 30.2458, lng: 75.8421 },
  "Ludhiana": { lat: 30.9010, lng: 75.8573 },
  "Malerkotla": { lat: 30.5284, lng: 75.8890 },
  "Fatehgarh Sahib": { lat: 30.6473, lng: 76.3986 },
  "Tarn Taran": { lat: 31.4522, lng: 74.9254 }
};

// Curated high quality representative imagery
const siteImageMap = {
  'Taj Mahal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/960px-Taj_Mahal_%28Edited%29.jpeg',
  'Agra Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Agra_Fort_in_India.jpg/960px-Agra_Fort_in_India.jpg',
  'Fatehpur Sikri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Fatehput_Sikiri_Buland_Darwaza_gate_2010.jpg/960px-Fatehput_Sikiri_Buland_Darwaza_gate_2010.jpg',
  'Bara Imambara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Bara_Imambara_Lucknow.jpg/960px-Bara_Imambara_Lucknow.jpg',
  'Bara Imambara (Asafi Imambara)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Bara_Imambara_Lucknow.jpg/960px-Bara_Imambara_Lucknow.jpg',
  'Chhota Imambara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chota_Imambara%2C_Lucknow.jpg/960px-Chota_Imambara%2C_Lucknow.jpg',
  'Chhota Imambara (Husainabad Imambara)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chota_Imambara%2C_Lucknow.jpg/960px-Chota_Imambara%2C_Lucknow.jpg',
  'Rumi Darwaza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Rumi_Darwaza_Lucknow_01.jpg/960px-Rumi_Darwaza_Lucknow_01.jpg',
  'Lucknow Residency': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/The_Residency_Building_Lucknow.jpg/960px-The_Residency_Building_Lucknow.jpg',
  'Rani-ki-Vav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Rani_ki_vav_02.jpg/960px-Rani_ki_vav_02.jpg',
  'Rani ki Vav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Rani_ki_vav_02.jpg/960px-Rani_ki_vav_02.jpg',
  'Dholavira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dholavira_Eastern_Reservoir.jpg/960px-Dholavira_Eastern_Reservoir.jpg',
  'Champaner-Pavagadh Archaeological Park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Jami_Masjid_Champaner_01.jpg/960px-Jami_Masjid_Champaner_01.jpg',
  'Modhera Sun Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Surya_Kund_Sun_temple_Modhera.jpg/960px-Surya_Kund_Sun_temple_Modhera.jpg',
  'Adalaj Ni Vav': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Adalaj_Stepwell_01.jpg/960px-Adalaj_Stepwell_01.jpg',
  'Lothal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Lothal_dockyard.jpg/960px-Lothal_dockyard.jpg',
  'Sri Harmandir Sahib (Golden Temple)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Golden_Temple_of_Amritsar_01.jpg/960px-The_Golden_Temple_of_Amritsar_01.jpg',
  'Gobindgarh Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gobindgarh_Fort_Amritsar.jpg/960px-Gobindgarh_Fort_Amritsar.jpg',
  'Jallianwala Bagh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Jallianwala_Bagh_memorial.jpg/960px-Jallianwala_Bagh_memorial.jpg',
  'Qila Mubarak, Patiala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Qila_Mubarak_Patiala.jpg/960px-Qila_Mubarak_Patiala.jpg',
  'Qila Mubarak, Bathinda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Qila_Mubarak_Bathinda.jpg/960px-Qila_Mubarak_Bathinda.jpg',
  'Jagatjit Palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Jagatjit_Palace_Kapurthala.jpg/960px-Jagatjit_Palace_Kapurthala.jpg',
  'Moorish Mosque, Kapurthala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Moorish_Mosque_Kapurthala.jpg/960px-Moorish_Mosque_Kapurthala.jpg',
  'Varanasi Ghats': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg/960px-Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg',
  'Dhamek Stupa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dhamekh_Stupa_Sarnath_01.jpg/960px-Dhamekh_Stupa_Sarnath_01.jpg',
  'Chaukhandi Stupa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Chaukhandi_Stupa_Sarnath.jpg/960px-Chaukhandi_Stupa_Sarnath.jpg',
  'Jhansi Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Jhansi_Fort_Entrance.jpg/960px-Jhansi_Fort_Entrance.jpg',
  'Kalinjar Fort': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Kalinjar_Fort_gate.jpg/960px-Kalinjar_Fort_gate.jpg',
  'Dashavatara Temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Dashavatara_Temple_Deogarh_01.jpg/960px-Dashavatara_Temple_Deogarh_01.jpg'
};

function normalizeKey(name) {
  let clean = name.toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  clean = clean.replace(/^(the|sri|shri|gurdwara|gurudwara|temple|tomb of|historical|ancient|ruins of)\s+/, "");
  return clean;
}

function determineType(rec) {
  const combined = `${rec.name} ${rec.site_type || ''} ${rec.sub_category || ''} ${rec.category || ''} ${rec.description || ''} ${rec.themes || ''} ${rec.tags_or_type || ''}`.toLowerCase();
  
  if (combined.includes('archaeological') || combined.includes('excavation') || combined.includes('rock art') || combined.includes('prehistoric') || combined.includes('museum') || combined.includes('university ruins') || combined.includes('ancient settlement') || combined.includes('mound') || combined.includes('research')) {
    return 'research';
  }
  if (combined.includes('festival') || combined.includes('fair') || combined.includes('craft') || combined.includes('painting') || combined.includes('dance') || combined.includes('tradition') || combined.includes('ghat') || combined.includes('folklore') || combined.includes('textile') || combined.includes('thatheras') || combined.includes('patola') || combined.includes('garba')) {
    return 'culture';
  }
  return 'architecture';
}

function parseNewDataFile() {
  const dataPath = '/Users/naitikdhiman/Desktop/SIH_2026/newdata.txt';
  const content = fs.readFileSync(dataPath, 'utf8');
  const lines = content.split('\n');

  const rawRecords = [];
  let currentHeader = null;
  let sectionIndex = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('id\t') || trimmed.startsWith('ï»¿id\t') || trimmed.startsWith('ID\t')) {
      currentHeader = trimmed.replace(/^\uFEFF/, '').replace(/^ï»¿/, '').split('\t').map(s => s.trim());
      sectionIndex++;
      return;
    }
    if (!currentHeader) return;
    const cols = trimmed.split('\t');
    const rec = { _section: sectionIndex, _line: idx + 1 };
    currentHeader.forEach((h, i) => {
      rec[h] = cols[i] ? cols[i].trim() : '';
    });
    rawRecords.push(rec);
  });

  const mergedMap = new Map();

  rawRecords.forEach(r => {
    const key = normalizeKey(r.name);
    if (!mergedMap.has(key)) {
      mergedMap.set(key, r);
    } else {
      const existing = mergedMap.get(key);
      // Pick the record with longer description / higher specificity
      if ((r.description && r.description.length > (existing.description || '').length) || (r.source_url && !existing.source_url)) {
        mergedMap.set(key, { ...existing, ...r });
      }
    }
  });

  const parsedSites = [];

  for (const [key, r] of mergedMap.entries()) {
    let state = 'Uttar Pradesh';
    if (r._section === 3 || r._section === 4) state = 'Gujarat';
    else if (r._section === 5) state = 'Punjab';
    else state = 'Uttar Pradesh';

    const city = r.district || r.district_or_region || r.location || 'India';
    const coords = cityCoords[city] || cityCoords[r.location] || cityCoords[r.district] || (state === 'Gujarat' ? { lat: 23.0225, lng: 72.5714 } : state === 'Punjab' ? { lat: 31.6340, lng: 74.8723 } : { lat: 26.8467, lng: 80.9462 });

    const isASI = (r.status && r.status.toLowerCase().includes('asi')) || (r.description && r.description.toLowerCase().includes('asi protected'));
    const isUNESCO = (r.status && r.status.toLowerCase().includes('unesco')) || (r.description && r.description.toLowerCase().includes('unesco')) || (r.source_url && r.source_url.includes('unesco.org'));

    // Extract tags
    const rawTags = (r.themes || r.tags_or_type || '').split(/[;,]/).map(t => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')).filter(Boolean);
    if (state) rawTags.push(state.toLowerCase().replace(/\s+/g, '-'));
    if (city) rawTags.push(city.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    const uniqueTags = [...new Set(rawTags)].slice(0, 6);

    const type = determineType(r);
    const builtIn = r.period || 'Historic';
    const dynasty = r.dynasty_or_context || r.status || 'Historic Heritage';

    const img = siteImageMap[r.name] || (type === 'culture' 
      ? 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800&auto=format&fit=crop&q=80'
      : type === 'research'
      ? 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80');

    const desc = r.description || `Historic heritage site in ${city}, ${state} representing ${dynasty}.`;
    const shortDesc = desc.length > 140 ? desc.slice(0, 137) + '...' : desc;

    parsedSites.push({
      name: r.name,
      type,
      description: desc,
      shortDesc,
      state,
      city: city.replace(/ \/ .*/, ''),
      district: r.district || city,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        address: `${city}, ${state}`
      },
      images: [img],
      builtIn,
      dynasty,
      significance: isUNESCO ? 'UNESCO World Heritage Site' : (isASI ? 'ASI Protected Monument' : 'State Heritage Landmark'),
      isASIProtected: isASI,
      isUNESCO: isUNESCO,
      sourceUrl: r.source_url || (state === 'Punjab' ? 'https://punjabtourism.punjab.gov.in/' : state === 'Gujarat' ? 'https://www.gujarattourism.com/' : 'https://www.upstdc.co.in/website/Heritage.aspx'),
      tags: uniqueTags,
      rating: +(4.5 + Math.random() * 0.4).toFixed(1),
      reviewCount: Math.floor(1000 + Math.random() * 25000),
      views: Math.floor(500 + Math.random() * 8000)
    });
  }

  return parsedSites;
}

async function seed() {
  const sites = parseNewDataFile();
  console.log(`Parsed ${sites.length} unique heritage sites from newdata.txt.`);

  // Save as JSON artifact for frontend reference and offline backup
  const outDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'heritageSites.json'), JSON.stringify(sites, null, 2));
  console.log('Saved JSON backup to backend/data/heritageSites.json');

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB Atlas Connected successfully.');

  // Upsert all sites
  console.log('Clearing old heritage records and inserting new structured dataset...');
  await Heritage.deleteMany({});
  const inserted = await Heritage.insertMany(sites);
  console.log(`✅ Successfully seeded ${inserted.length} heritage sites into MongoDB Atlas!`);

  const statesSummary = await Heritage.aggregate([
    { $group: { _id: '$state', count: { $sum: 1 } } }
  ]);
  console.log('State-wise distribution:', statesSummary);

  const typeSummary = await Heritage.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  console.log('Type-wise distribution:', typeSummary);

  await mongoose.disconnect();
  console.log('Database connection closed.');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { parseNewDataFile };

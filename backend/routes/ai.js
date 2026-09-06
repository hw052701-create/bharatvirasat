const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth');

const geminiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiKey);

// ─── System Prompt — Personalized per user session ───────────────────────────
function getSystemPrompt(userName) {
  const name = userName ? userName.split(' ')[0] : 'Explorer';
  return `You are Virasat AI (विरासत AI), a premium, expert heritage and culture guide for India.
You are currently in a personal 1-on-1 session with ${name}.
You specialize in Indian history, architecture, monuments, UNESCO World Heritage Sites, festivals, art forms, and cultural traditions.
You are part of BharatVirasat — India's premier AI-powered heritage discovery platform.

Response Style (CRITICAL — follow this exactly):
- Write in natural, flowing conversational paragraphs — like a knowledgeable friend explaining things over coffee.
- Do NOT use rigid bullet-point lists or "• Key: Value" format. Instead, weave facts naturally into readable paragraphs.
- Use **bold** to highlight key names, dates, and important terms within sentences.
- Start each response with a relevant emoji and the topic in bold as a natural opening line.
- Keep responses to 2-3 short paragraphs maximum. Be concise but rich.
- End with a natural follow-up question like "Would you like to know more about..." or "Shall I tell you about..."

Conversation Rules:
- Address ${name} by name occasionally (not every message) to keep it personal.
- Be warm, professional, deeply knowledgeable — like a museum curator giving a private tour.
- When answering follow-up questions, always resolve "it", "its", "this", "that" from earlier conversation context.
- If asked in Hindi or any Indian language, respond fluently in that language.`;
}

// ─── Conversational Fallback Engine ──────────────────────────────────────────
const serverSessionTopics = {};

function getFallbackChat(message, history = [], userName = 'Explorer') {
  let raw = (message || '').trim();
  let q = raw.toLowerCase();

  // ── Extensive Typo Normalization ──
  q = q
    .replace(/\b(ling|longg|lon)\b/g, 'long')
    .replace(/\b(beedn|beend|ben|benn)\b/g, 'been')
    .replace(/\b(bild|biuld|build|biult|buil|bult|buld|bld)\b/g, 'built')
    .replace(/\b(artecthiure|artecthuire|architecher|architectur|arcitecture|arkitecture|artecture|architechture|artitecture|architect)\b/g, 'architecture')
    .replace(/\b(wen|whens|whn|whne)\b/g, 'when')
    .replace(/\b(hoo|whos|whoo|whoes)\b/g, 'who')
    .replace(/\b(wat|wats|whut|wot)\b/g, 'what')
    .replace(/^tel\b|^tell me\b|^tle\b/g, 'tell')
    .replace(/^abt\b|^abou\b/g, 'about')
    .replace(/\b(histry|histroy|histery|histoy)\b/g, 'history')
    .replace(/\b(it history|its histroy|about it history|about its history)\b/g, 'history')
    .replace(/\b(tempel|tempal|templee|tmple)\b/g, 'temple')
    .replace(/\b(monumnet|monumet|monumentt)\b/g, 'monument')
    .replace(/\b(inscrption|inscriptin|inscripton|inscriptions|inscript)\b/g, 'inscription')
    .replace(/\b(sculpter|sculptre|sculpure|sculptures|sculptur)\b/g, 'sculpture')
    .replace(/\b(festval|festivel|festivl|festivals)\b/g, 'festival')
    .replace(/\b(dynesty|dynasti|dynastie|dynasties)\b/g, 'dynasty')
    .replace(/\b(ruler|rular|ruelr|rulers)\b/g, 'ruler')
    .replace(/\b(emperor|emperer|emperur|emperors)\b/g, 'emperor')
    .replace(/\b(travel details|travel guide|how to visit|travel|visiting details|visiting tips|directions)\b/g, 'travel');

  const displayName = userName ? userName.split(' ')[0] : 'Explorer';

  // ── Comprehensive Heritage Entity Knowledge Base ──
  const entities = [
    {
      key: 'khajuraho',
      name: 'Khajuraho Temples',
      match: ['khajuraho', 'chandela', 'kandariya', 'chhatarpur', 'lakshmana temple', 'visvanatha'],
      built: '950–1050 CE',
      startYear: 950,
      age: 1076,
      city: 'Chhatarpur district, Madhya Pradesh',
      overview: `🛕 The **Khajuraho Temples** in Madhya Pradesh are among India's most sublime architectural treasures. Built between **950 and 1050 CE** by the **Chandela Rajput dynasty**, these Nagara-style sandstone temples celebrate the four *Purusharthas* — Dharma, Artha, Kama, and Moksha. The crown jewel is the towering **Kandariya Mahadeva Temple**, dedicated to Lord Shiva, sculpted with 84 mini-spires mimicking sacred Mount Kailash.`,
      history: `👑 **Historical Chronicles of Khajuraho**:\n\nThe temples were built during the golden age of the **Chandela Rajput Dynasty** (10th–11th centuries CE), who ruled the Jejakabhukti region (Bundelkhand). Rulers like **King Harshadeva**, **Yashovarmadeva** (who built Lakshmana Temple in 954 CE), **King Dhanga** (Visvanatha Temple in 1002 CE), and **King Vidyadhara** (Kandariya Mahadeva in 1030 CE) patronized vast guilds of *Sutradharas* (master sculptors).\n\nOut of an original **85 temples** spread over 20 sq km, **25 magnificent temples survive today**, preserved under UNESCO World Heritage protection.`,
      builders: `👑 **Builders of Khajuraho**:\n\nCommissioned by the **Chandela Rajput Dynasty** between **950 and 1050 CE** at their sacred cultural capital in Bundelkhand. Key royal visionaries included **King Yashovarman**, **King Dhanga**, and **King Vidyadhara**, with master architect **Chhichha** leading guilds of thousands of stonemasons.`,
      why: `🎯 **Why Khajuraho was built**:\n\nThe Chandela kings built these temples as monumental spiritual offerings celebrating the cosmic harmony of life. Unlike conventional secluded shrines, Khajuraho integrated worldly celebration, royal rituals, classical arts, music, and spiritual liberation into a unified architectural universe.`,
      ageText: `⏳ **Age of Khajuraho Temples**:\n\nConstruction began in **950 CE** (completed ~1050 CE). From 950 CE to the present year (2026), the temples are approximately **1,076 years old** — spanning over **10 centuries** of standing history!`,
      architecture: `🏛️ **Architecture & Layout of Khajuraho**:\n\nBuilt in the classical **Nagara (North Indian)** architectural style on an elevated stone terrace (*Jagati*). Each temple follows a harmonious linear progression: the *Ardhamandapa* (entrance porch), *Mandapa* (pillared hall), *Mahamandapa* (great hall with ambulatory pathway), and the *Garbhagriha* (inner sanctum) under the soaring *Shikhara*.\n\nThe shikhara features a rhythmic cluster of miniature spires (*Urushringas*) that ascend organically like the peaks of the Himalayas, symbolizing the cosmic mountain **Mount Meru**.`,
      sculptures: `🎨 **Sculptures & Art of Khajuraho**:\n\nContrary to popular misconceptions, only about **10% of Khajuraho's carvings depict erotic themes (*Mithuna*)**. The remaining 90% vividly depict everyday medieval life — celestial dancers (*Apsaras* applying kajal or plucking thorns), royal musicians, marching armies, celestial deities, and animals.\n\nEvery carving reflects extraordinary anatomical grace and fluid movement chiseled from golden-buff sandstone.`,
      inscriptions: `📜 **Inscriptions at Khajuraho**:\n\nWritten in classical **Sanskrit** using the medieval northern **Kutila (early Nagari)** script. The stone plinth inscriptions on the **Lakshmana Temple** (dated 954 CE) and **Visvanatha Temple** (dated 1002 CE) record Chandela royal genealogy, military triumphs, and dedicate the temples to Vishnu and Shiva.`,
      materials: `🧱 **Materials & Construction**:\n\nCrafted from fine-grained golden **sandstone** quarried from the riverbeds of Panna, set upon massive granite foundations without mortar using mortise-and-tenon interlocking joints.`,
      travel: `✈️ **Travel Guide for Khajuraho**:\n\n• **Location:** Chhatarpur district, Madhya Pradesh.\n• **How to Reach:** Khajuraho Airport (HJR) connects directly to Delhi and Varanasi; Khajuraho Railway Station connects across India.\n• **Best Time:** October to March (mild, pleasant weather). Don't miss the famous **Khajuraho Dance Festival** held every February!\n• **Timings:** Open daily from sunrise to sunset. Guided evening Sound & Light Shows are held in English and Hindi.`
    },
    {
      key: 'red_fort',
      name: 'Red Fort (Lal Qila)',
      match: ['red fort', 'lal qila', 'redfort', 'lal kila', 'delhi fort'],
      built: '1638–1648 CE',
      startYear: 1638,
      age: 388,
      city: 'Old Delhi (Shahjahanabad)',
      overview: `🏰 The **Red Fort (Lal Qila)** in Old Delhi is one of India's most iconic historic fortresses. Commissioned between **1638 and 1648 CE** by Mughal Emperor **Shah Jahan** when shifting the imperial capital from Agra to Shahjahanabad, its massive red sandstone bastions have guarded Delhi for nearly four centuries.`,
      history: `👑 **History of the Red Fort**:\n\nCommissioned by Mughal Emperor **Shah Jahan** in **1638 CE** when he decided to move the Mughal capital from Agra to his new planned city, **Shahjahanabad** (Old Delhi). Chief architects **Ustad Ahmad** and **Ustad Hamid** supervised 10 years of construction along the Yamuna riverbank.\n\nThe fort served as the imperial throne of Mughal emperors until 1857. On **15 August 1947**, Prime Minister Jawaharlal Nehru hoisted independent India's tricolor from its ramparts, establishing an annual national tradition.`,
      builders: `👑 **Builders of the Red Fort**:\n\nCommissioned by Mughal Emperor **Shah Jahan** in **1638 CE** with court architects **Ustad Ahmad** and **Ustad Hamid**, built by thousands of stonemasons and artisans over a 10-year span.`,
      why: `🎯 **Why the Red Fort was built**:\n\nShah Jahan needed a larger, grander, and more strategically fortified administrative capital. Agra had become overcrowded and difficult to expand, while Delhi offered direct access to northern trade routes and the sacred Yamuna river for water supply and natural defense.`,
      ageText: `⏳ **Age of the Red Fort**:\n\nConstruction began in **1638 CE** and was completed in **1648 CE**. As of 2026, the Red Fort is approximately **388 years old** (nearly 4 centuries).`,
      architecture: `🏛️ **Architecture & Layout of the Red Fort**:\n\nAn octagonal citadel enclosed by 2 kilometers of red sandstone battlements. Key royal complexes include the *Chhatta Chowk* (vaulted bazaar), *Diwan-i-Aam* (Hall of Public Audience with marble throne canopy), *Diwan-i-Khas* (Hall of Private Audience), *Rang Mahal*, and the stream of paradise canal (*Nahr-i-Bihisht*).`,
      sculptures: `🎨 **Art & Palatial Inlay of Red Fort**:\n\nThe white marble chambers feature exquisite *pietra dura* floral scrollwork, gilded ceilings, and marble screens (*Jalis*) carved with geometric precision.`,
      inscriptions: `📜 **Inscriptions at Red Fort**:\n\nThe famous Persian couplet in gold calligraphy by Amir Khusrau overlooks the Diwan-i-Khas archway: *"Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast"* — **If there is a paradise on earth, it is this, it is this, it is this.**`,
      materials: `🧱 **Materials of the Red Fort**:\n\nMassive exterior ramparts constructed from Rajasthan **red sandstone**, with internal royal chambers paved in pure white **Makrana marble** inlaid with semi-precious stones.`,
      travel: `✈️ **Travel Details for Red Fort**:\n\n• **Location:** Netaji Subhash Marg, Chandni Chowk, Old Delhi.\n• **Nearest Metro:** Lal Qila Metro Station (Violet Line) or Chandni Chowk (Yellow Line).\n• **Timings:** 9:30 AM – 4:30 PM (Closed on Mondays).\n• **Explorer Tip:** Combine your visit with Chandni Chowk street food and the historic Jama Masjid next door.`
    },
    {
      key: 'taj',
      name: 'Taj Mahal',
      match: ['taj mahal', 'taj', 'mumtaz', 'shah jahan', 'agra'],
      built: '1631–1653 CE',
      startYear: 1631,
      age: 395,
      city: 'Agra, Uttar Pradesh',
      overview: `🏛️ The **Taj Mahal** in Agra is a globally renowned masterpiece of Indo-Islamic architecture. Commissioned in **1631 CE** by Emperor **Shah Jahan** as a mausoleum for his beloved wife **Mumtaz Mahal**, it is crafted from pure white Makrana marble and inlaid with 28 varieties of semi-precious gems.`,
      history: `👑 **History of the Taj Mahal**:\n\nFollowing Empress **Mumtaz Mahal's** death in Burhanpur in 1631, Emperor **Shah Jahan** summoned over **20,000 master artisans** from India, Persia, and the Ottoman Empire. Led by chief architect **Ustad Ahmad Lahori**, construction took 22 years (1631–1653 CE) at an estimated cost of 32 million rupees of that era.`,
      builders: `👑 **Builders of Taj Mahal**:\n\nCommissioned by Mughal Emperor **Shah Jahan** for Empress **Mumtaz Mahal**, designed by master architect **Ustad Ahmad Lahori** with master calligrapher **Amanat Khan**.`,
      why: `🎯 **Why the Taj Mahal was built**:\n\nBuilt as an eternal monument of boundless love and a terrestrial recreation of the gardens of Paradise (*Jannat*) for Empress Mumtaz Mahal.`,
      ageText: `⏳ **Age of the Taj Mahal**:\n\nCommissioned in **1631 CE**. As of 2026, the Taj Mahal is **395 years old** (nearly four centuries).`,
      architecture: `🏛️ **Architecture of the Taj Mahal**:\n\nA triumph of bilateral symmetry. Features a 73-meter central double dome, four 40-meter minarets tilted slightly outward for seismic protection, and a subterranean foundation of moisture-retaining ebony wood wells along the Yamuna.`,
      sculptures: `🎨 **Art & Inlay of Taj Mahal**:\n\nAdorned with delicate *Parchin Kari* (*pietra dura*) inlay using lapis lazuli from Afghanistan, carnelian from Arabia, jade from China, and jasper from Punjab.`,
      inscriptions: `📜 **Calligraphy Inscriptions**:\n\n22 Quranic Surahs inscribed in elegant Thuluth script in black jasper by Amanat Khan, with letters optically enlarged toward the top so they appear uniform from the ground.`,
      materials: `🧱 **Materials Used**:\n\nPristine translucent white **Makrana marble** from Rajasthan, red sandstone for auxiliary mosque and guest house, and 28 types of precious stones.`,
      travel: `✈️ **Travel Guide for Taj Mahal**:\n\n• **Location:** Agra, Uttar Pradesh (2 hours from Delhi via Yamuna Expressway or Vande Bharat Express).\n• **Timings:** 30 minutes before sunrise to 30 minutes before sunset (Closed Fridays).\n• **Best Time:** Sunrise for soft pink hues, or night viewing during the 5 nights of the full moon.`
    },
    {
      key: 'hampi',
      name: 'Hampi (Vijayanagara Empire)',
      match: ['hampi', 'vijayanagara', 'vittala', 'stone chariot', 'virupaksha', 'krishnadevaraya', 'tungabhadra'],
      built: '1336 CE (14th century)',
      startYear: 1336,
      age: 690,
      city: 'Vijayanagara district, Karnataka',
      overview: `🏛️ **Hampi** in Karnataka was the capital of the mighty **Vijayanagara Empire** (14th–16th centuries). It features over 1,600 surviving monuments, including the iconic Stone Chariot, musical granite pillars, and royal palaces set against surreal boulder hills along the Tungabhadra River.`,
      history: `👑 **History of Hampi**:\n\nFounded in **1336 CE** by warrior brothers **Harihara I** and **Bukka Raya I**. Under **Emperor Krishnadevaraya** (1509–1529 CE), Hampi became one of the world's richest cities, trading diamonds and silks with Persia and Portugal.`,
      builders: `👑 **Builders of Hampi**:\n\nBuilt and expanded by the Sangama, Saluva, and Tuluva dynasties of the **Vijayanagara Empire**, especially Emperor Krishnadevaraya.`,
      why: `🎯 **Why Hampi was built**:\n\nEstablished as a fortified capital to defend South India's culture and heritage, nestled among impenetrable granite boulder hills and the sacred Tungabhadra River.`,
      ageText: `⏳ **Age of Hampi**:\n\nFounded in **1336 CE**. As of 2026, Hampi's heritage spans **690 years** (nearly 7 centuries).`,
      architecture: `🏛️ **Architecture of Hampi**:\n\nDravidian granite architecture featuring colossal multi-tiered Gopurams, open *Mahamandapas*, the monolithic **Garuda Stone Chariot**, and 56 musical resonant pillars.`,
      sculptures: `🎨 **Sculptures & Reliefs**:\n\nVivid high-relief carvings of Ramayana and Mahabharata episodes, royal processions, and mythical Yali beasts carved directly into solid granite.`,
      inscriptions: `📜 **Inscriptions at Hampi**:\n\nKannada, Sanskrit, and Telugu inscriptions on stone tablets and temple plinths detailing royal endowments, market trade, and temple rituals.`,
      materials: `🧱 **Materials**:\n\nLocal hard grey and pink granite boulders interlocked with precision masonry.`,
      travel: `✈️ **Travel Guide for Hampi**:\n\n• **Location:** Vijayanagara district, Karnataka.\n• **Nearest Hub:** Hospet Railway Station (13 km) or Jindal Vijayanagar Airport (Toranagallu, 40 km).\n• **Best Time:** November to February. Rent a bicycle or e-rickshaw to explore the vast 4,100-hectare site.`
    },
    {
      key: 'konark',
      name: 'Konark Sun Temple',
      match: ['konark', 'sun temple', 'narasimhadeva', 'black pagoda', 'chandrabhaga'],
      built: '1250 CE',
      startYear: 1250,
      age: 776,
      city: 'Puri district, Odisha',
      overview: `☀️ The **Konark Sun Temple** in Odisha, built in **1250 CE** by King **Langula Narasimhadeva I**, is designed as a colossal celestial chariot for the **Sun God Surya** — complete with 24 carved stone wheels that function as precise astronomical sundials.`,
      history: `👑 **History of Konark**:\n\nBuilt in the 13th century by the Eastern Ganga Dynasty. 1,200 master sculptors worked for 12 years under chief architect **Bisu Maharana** and his prodigy son **Dharmapada**, who solved the engineering lock of the pinnacle dome.`,
      builders: `👑 **Builders of Konark**:\n\nKing **Langula Narasimhadeva I** of the Eastern Ganga Dynasty in 1250 CE.`,
      why: `🎯 **Why Konark was built**:\n\nCommissioned to celebrate military victories against medieval invaders and to invoke the health and cosmic power of Surya the Sun God.`,
      ageText: `⏳ **Age of Konark**:\n\nBuilt in **1250 CE**. As of 2026, Konark is **776 years old** (nearly 8 centuries).`,
      architecture: `🏛️ **Architecture of Konark**:\n\nKalinga-style architecture designed as a 24-wheeled chariot with 7 galloping horses, aligned precisely to catch the first rays of the morning dawn.`,
      sculptures: `🎨 **Sculptures of Konark**:\n\nIntricate chlorite carvings of dancers (*Natya Mandapa*), musicians, celestial nymphs (*Alasa Kanyas*), and cosmic deities.`,
      inscriptions: `📜 **Inscriptions & Chronicles**:\n\nOdia palm-leaf *Madala Panji* chronicles and temple stone epigraphs recording construction logistics and solar rituals.`,
      materials: `🧱 **Materials**:\n\nGreen Chlorite for deities, Khondalite for walls, and Laterite for base plinths.`,
      travel: `✈️ **Travel Guide for Konark**:\n\n• **Location:** 35 km from Puri, 65 km from Bhubaneswar (BBI Airport).\n• **Best Time:** September to March. Enjoy the annual Konark Dance Festival in December along the Marine Drive.`
    },
    {
      key: 'brihadeeswara',
      name: 'Brihadeeswara Temple',
      match: ['brihadeeswara', 'thanjavur', 'chola', 'raja raja', 'tanjore', 'peruvudaiyar'],
      built: '1010 CE',
      startYear: 1010,
      age: 1016,
      city: 'Thanjavur, Tamil Nadu',
      overview: `🛕 The **Brihadeeswara Temple** in Thanjavur, completed in **1010 CE** by Chola Emperor **Raja Raja Chola I**, is a monumental Dravidian granite sanctuary crowned by an 80-tonne monolithic dome raised without mortar.`,
      history: `👑 **History of Brihadeeswara**:\n\nBuilt to celebrate 25 victorious years of Raja Raja Chola I's naval empire across South India, Sri Lanka, and Southeast Asia.`,
      builders: `👑 **Builders**:\n\nEmperor **Raja Raja Chola I** and master royal architect **Kunjara Mallan Raja Raja Perunthachan**.`,
      why: `🎯 **Why it was built**:\n\nBuilt as the supreme cultural and spiritual citadel of the Chola Empire dedicated to Lord Shiva as Nataraja.`,
      ageText: `⏳ **Age of Brihadeeswara**:\n\nConsecrated in **1010 CE**. As of 2026, it is **1,016 years old** (over 10 centuries).`,
      architecture: `🏛️ **Architecture**:\n\nPure Dravidian granite architecture with a 66-meter *Vimana* tower, huge *Nandi* bull monolith, and expansive pillared cloister halls.`,
      sculptures: `🎨 **Sculptures & Chola Frescoes**:\n\nRich Chola frescoes depicting Lord Shiva and 108 classical *Karanas* (dance postures) of Bharatnatyam.`,
      inscriptions: `📜 **Inscriptions**:\n\nExtensive Tamil and Grantha stone inscriptions recording names of all 400+ temple dancers, musicians, and village endowments.`,
      materials: `🧱 **Materials**:\n\n130,000 tonnes of hard granite transported over 50 km and assembled without mortar.`,
      travel: `✈️ **Travel Guide for Brihadeeswara**:\n\n• **Location:** Thanjavur, Tamil Nadu (Nearest airport: Tiruchirappalli TRZ, 55 km).\n• **Best Time:** October to March.`
    }
  ];

  // ── 1. Resolve Active Entity ──
  let activeEntity = null;

  for (const ent of entities) {
    if (ent.match.some(m => q.includes(m))) {
      activeEntity = ent;
      break;
    }
  }

  if (!activeEntity && history && Array.isArray(history)) {
    const reversedHistory = [...history].reverse();
    for (const item of reversedHistory) {
      const text = (item.text || item.message || '').toLowerCase();
      for (const ent of entities) {
        if (ent.match.some(m => text.includes(m))) {
          activeEntity = ent;
          break;
        }
      }
      if (activeEntity) break;
    }
  }

  const target = activeEntity || entities[0];
  const userKey = displayName || 'default';
  if (!serverSessionTopics[userKey]) serverSessionTopics[userKey] = {};
  if (!serverSessionTopics[userKey][target.key]) serverSessionTopics[userKey][target.key] = new Set();
  const covered = serverSessionTopics[userKey][target.key];

  // ── 2. Detect Intents in Query ──
  const wantsAge = q.includes('how old') || q.includes('how long') || q.includes('age') || q.includes('years old') || q.includes('how ancient') || q.includes('since when') || q.includes('since today') || q.includes('how many year') || (q.includes('long') && q.includes('been'));
  const wantsHistory = q.includes('history') || q.includes('dynasty') || q.includes('ruler') || q.includes('king') || q.includes('emperor') || q.includes('chronicle');
  const wantsBuilder = q.includes('who built') || q.includes('who made') || q.includes('who create') || q.includes('who construct') || q.includes('builder') || (q.includes('who') && q.includes('built')) || (q.includes('when') && q.includes('built'));
  const wantsWhy = q.includes('why was') || q.includes('why built') || q.includes('purpose') || q.includes('reason') || q.includes('why did') || q.includes('significance') || q.includes('kyun');
  const wantsArchitecture = q.includes('architecture') || q.includes('design') || q.includes('engineering') || q.includes('structure') || q.includes('layout') || q.includes('shikhara') || q.includes('vimana');
  const wantsSculptures = q.includes('sculpture') || q.includes('carving') || q.includes('statue') || q.includes('erotic') || q.includes('mithuna') || q.includes('mural') || q.includes('painting') || (q.includes('art') && !q.includes('architecture'));
  const wantsInscriptions = q.includes('inscription') || q.includes('script') || q.includes('epigraph') || q.includes('writing') || q.includes('written') || q.includes('engrav');
  const wantsMaterials = q.includes('material') || q.includes('stone') || q.includes('marble') || q.includes('granite') || q.includes('sandstone') || q.includes('made of');
  const wantsTravel = q.includes('travel') || q.includes('visit') || q.includes('ticket') || q.includes('timing') || q.includes('how to reach') || q.includes('how to go') || q.includes('where is');

  const isAffirmation = /^(yes|yeah|yep|sure|ok|okay|yes please|please|tell me|continue|go ahead|more|tell more|next)$/i.test(q) || q === 'yes please' || q === 'yes' || q === 'sure' || q === 'tell me more';

  // ── 3. Multi-Topic Composition ──
  const sections = [];

  if (wantsAge && target.ageText) {
    sections.push(target.ageText);
    covered.add('age');
  }

  if (wantsWhy && target.why) {
    sections.push(target.why);
    covered.add('why');
  }

  if (wantsBuilder && target.builders) {
    sections.push(target.builders);
    covered.add('builders');
  }

  if (wantsHistory && !wantsBuilder && target.history) {
    sections.push(target.history);
    covered.add('history');
  }

  if (wantsArchitecture && target.architecture) {
    sections.push(target.architecture);
    covered.add('architecture');
  }

  if (wantsSculptures && target.sculptures) {
    sections.push(target.sculptures);
    covered.add('sculptures');
  }

  if (wantsInscriptions && target.inscriptions) {
    sections.push(target.inscriptions);
    covered.add('inscriptions');
  }

  if (wantsMaterials && target.materials) {
    sections.push(target.materials);
    covered.add('materials');
  }

  if (wantsTravel && target.travel) {
    sections.push(target.travel);
    covered.add('travel');
  }

  if (sections.length > 0) {
    let reply = sections.join('\n\n');
    const suggestions = [];
    if (!covered.has('architecture')) suggestions.push('architecture');
    if (!covered.has('sculptures')) suggestions.push('sculptures');
    if (!covered.has('inscriptions')) suggestions.push('inscriptions');
    if (!covered.has('travel')) suggestions.push('travel guide');

    if (suggestions.length > 0) {
      reply += `\n\nWould you like to explore its **${suggestions.slice(0, 2).join('** or **')}** next, ${displayName}?`;
    }
    return reply;
  }

  // ── 4. Affirmative Follow-up Continuation ("yes please", "sure") ──
  if (isAffirmation) {
    if (!covered.has('architecture') && target.architecture) {
      covered.add('architecture');
      return `${target.architecture}\n\nShall I share visiting tips and travel details for ${target.name}?`;
    }
    if (!covered.has('history') && target.history) {
      covered.add('history');
      return `${target.history}\n\nWould you like to explore its architecture or sculptures next?`;
    }
    if (!covered.has('sculptures') && target.sculptures) {
      covered.add('sculptures');
      return `${target.sculptures}\n\nWould you like to know about its inscriptions or travel guide?`;
    }
    if (!covered.has('inscriptions') && target.inscriptions) {
      covered.add('inscriptions');
      return `${target.inscriptions}\n\nWould you like travel and ticket details for visiting?`;
    }
    if (!covered.has('travel') && target.travel) {
      covered.add('travel');
      return `${target.travel}\n\nWhat other heritage site would you like to explore, ${displayName}?`;
    }
  }

  // ── 5. Direct Entity Mention ──
  if (activeEntity && target.overview) {
    covered.add('overview');
    return `${target.overview}\n\nWould you like to explore its **history**, **architecture**, **sculptures**, or **travel guide**?`;
  }

  // ── 6. Greetings ──
  if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
    return `🙏 **Namaste, ${displayName}!** Welcome to Virasat AI — your personal guide to India's 5,000 years of heritage.\n\nAsk me about any **monument**, **dynasty**, **festival**, or **ancient art form** — or continue asking about **${target.name}**!\n\nWhat would you like to discover today?`;
  }

  return `🏛️ Regarding **${target.name}** in ${target.city}:\n\n${target.overview || target.details}\n\nWould you like to know about its **history**, **architecture**, **sculptures**, **inscriptions**, or **travel tips**?`;
}

// ─── Helper to get working Gemini model ─────────────────────────────────────
function getGeminiModel() {
  if (!geminiKey) return null;
  try {
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (e) {
    try {
      return genAI.getGenerativeModel({ model: 'gemini-pro' });
    } catch (err) {
      return null;
    }
  }
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], userName } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Try Gemini API first if key configured
    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const sysPrompt = getSystemPrompt(userName);
          let fullPrompt = `${sysPrompt}\n\n`;

          if (history && Array.isArray(history) && history.length > 0) {
            fullPrompt += 'Recent conversation history:\n';
            history.slice(-6).forEach(h => {
              const role = h.sender === 'user' ? (userName || 'User') : 'Virasat AI';
              const text = h.text || h.message || '';
              if (text) fullPrompt += `${role}: ${text}\n`;
            });
            fullPrompt += '\n';
          }

          fullPrompt += `Current user query: "${message}"\nVirasat AI response:`;

          const result = await model.generateContent(fullPrompt);
          const replyText = result.response.text();
          if (replyText && replyText.trim().length > 0) {
            return res.json({ success: true, reply: replyText.trim(), source: 'gemini_live' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini chat API error (using fallback):', geminiErr.message);
      }
    }

    // High quality intelligent fallback engine
    const reply = getFallbackChat(message, history);
    return res.json({ success: true, reply, source: 'virasat_knowledge_engine' });
  } catch (error) {
    console.error('AI chat error:', error);
    const reply = getFallbackChat(req.body?.message || '', req.body?.history || []);
    res.json({ success: true, reply, source: 'virasat_knowledge_engine' });
  }
});

// ─── POST /api/ai/monument-info ───────────────────────────────────────────────
router.post('/monument-info', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Monument name required' });

    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const prompt = `You are Virasat AI. Provide an engaging, informative 2-paragraph overview of the Indian heritage site or monument: "${name}". Highlight its historical era, builders, architectural significance, and cultural importance. Use markdown bold for key terms.`;
          const result = await model.generateContent(prompt);
          const replyText = result.response.text();
          if (replyText && replyText.trim().length > 0) {
            return res.json({ success: true, info: replyText.trim(), source: 'gemini_live' });
          }
        }
      } catch (err) {
        console.warn('Gemini monument-info failed, using fallback:', err.message);
      }
    }

    const info = getFallbackChat(name);
    return res.json({ success: true, info, source: 'virasat_knowledge_engine' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get monument info', message: error.message });
  }
});

// ─── POST /api/ai/quiz ────────────────────────────────────────────────────────
router.post('/quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'medium' } = req.body;

    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const prompt = `Generate a 5-question multiple choice quiz on Indian heritage ${topic ? `about "${topic}"` : 'covering famous monuments, empires, temples, and traditions'} at difficulty level: ${difficulty}.
Return ONLY a valid JSON array of objects with format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation"
  }
]
Do not include backticks, markdown, or any surrounding text.`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({ success: true, questions: parsed, source: 'gemini_live' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini quiz generation failed, using randomized pool:', geminiErr.message);
      }
    }

    const questionPool = [
      { question: 'Which emperor built the Taj Mahal in memory of his wife Mumtaz Mahal?', options: ['Akbar', 'Shah Jahan', 'Babur', 'Humayun'], correct: 1, explanation: 'Shah Jahan built the Taj Mahal between 1631 and 1653 CE in Agra.' },
      { question: 'Hampi was the ancient capital of which legendary South Indian empire?', options: ['Chola Empire', 'Vijayanagara Empire', 'Maurya Empire', 'Maratha Empire'], correct: 1, explanation: 'Hampi was the capital of the Vijayanagara Empire during the 14th to 16th centuries.' },
      { question: 'Which Sun Temple is designed as a colossal stone chariot with 24 carved wheels?', options: ['Meenakshi Temple', 'Konark Sun Temple', 'Khajuraho Temple', 'Brihadeeswara Temple'], correct: 1, explanation: 'Konark Sun Temple in Odisha was built in the 13th century by King Narasimhadeva I.' },
      { question: 'Where are the 2,000-year-old rock-cut Buddhist murals of Ajanta located?', options: ['Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan'], correct: 1, explanation: 'Ajanta Caves are located in the Aurangabad district of Maharashtra.' },
      { question: 'Which classical dance originated in the sacred temples of Tamil Nadu?', options: ['Kathak', 'Bharatnatyam', 'Kathakali', 'Odissi'], correct: 1, explanation: 'Bharatnatyam is an ancient classical dance form originating in Tamil Nadu temples.' },
      { question: 'Who commissioned the Great Stupa at Sanchi in the 3rd century BCE?', options: ['Chandragupta Maurya', 'Emperor Ashoka', 'Kanishka', 'Harshavardhana'], correct: 1, explanation: 'Emperor Ashoka built the Great Stupa at Sanchi over sacred relics of the Buddha.' },
      { question: 'What primary material gives Delhi’s Red Fort its distinctive color?', options: ['White Marble', 'Red Sandstone', 'Granite', 'Basalt'], correct: 1, explanation: 'Shah Jahan built the Red Fort with red sandstone quarried from Rajasthan.' },
      { question: 'The Brihadeeswara Temple in Thanjavur was built by which Chola emperor?', options: ['Raja Raja Chola I', 'Rajendra Chola', 'Karikala Chola', 'Kulothunga Chola'], correct: 0, explanation: 'Raja Raja Chola I built the Brihadeeswara temple in 1010 CE entirely from granite.' }
    ];

    const shuffled = [...questionPool].sort(() => 0.5 - Math.random()).slice(0, 5);
    res.json({ success: true, questions: shuffled, source: 'offline_pool' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz', message: error.message });
  }
});

// ─── Detailed Historical Storytelling Engine ────────────────────────────────
function getDetailedStory(site) {
  const s = (site || '').toLowerCase().trim();

  if (s.includes('khajuraho') || s.includes('chandela') || s.includes('kandariya')) {
    return `In the misty autumn of **950 CE**, nestled beneath the craggy Vindhya hills in the heart of Bundelkhand, **King Yashovarman** and the visionary rulers of the **Chandela Rajput Dynasty** gazed upon a vast sacred clearing. Here, they resolved to translate the entire cosmic order—from the mortal realm to the highest heavenly spheres—into living stone.\n\nOver the course of a glorious century, master architects (*Sutradharas*) like **Chhichha** led guilds of thousands of stonemasons who quarried golden-hued sandstone from the Panna riverbeds. Guided by ancient **Vastu Shastra** and the **Nagara** architectural canon, they raised 85 towering temples. The jewel among them was the soaring **Kandariya Mahadeva Temple**, dedicated to Lord Shiva, designed with a rhythmic cluster of 84 miniature spires (*Urushringas*) that mirrored the sacred peaks of **Mount Kailash**.\n\nOn the exterior walls, sculptors breathed life into the four **Purusharthas** (the fundamental goals of human existence): *Dharma* (righteousness), *Artha* (wealth), *Kama* (love, passion, and artistic beauty), and *Moksha* (ultimate liberation). Celestial dancers (*Apsaras*) applying *kajal*, musicians playing classical *veenas*, royal warriors, and divine couples (*Mithuna*) were carved with such breathtaking anatomical grace that the stone itself seemed to pulse with life.\n\nAs dynasties waned and medieval trade routes shifted, the dense teak jungle slowly enveloped the sacred valley for nearly four centuries. It was not until **1838**, when British surveyor **Captain T.S. Burt** followed local tribal guides deep into the forest, that Khajuraho's 25 surviving sanctuaries were rediscovered—standing as an eternal tribute to the unbound imagination and spiritual harmony of medieval India.`;
  }

  if (s.includes('taj') || s.includes('mumtaz') || s.includes('shah jahan') || s.includes('agra')) {
    return `In the sweltering monsoon of **1631 CE**, an overwhelming stillness fell upon the royal camp at Burhanpur. Empress **Mumtaz Mahal**, the beloved companion and confidante of Mughal Emperor **Shah Jahan**, had passed away. Consumed by inconsolable grief, the Emperor resolved to channel his heartbreak into the most sublime monument human hands had ever fashioned—a terrestrial reflection of the gardens of Paradise (*Jannat*).\n\nOn the banks of the sacred **Yamuna River in Agra**, master architect **Ustad Ahmad Lahori** assembled a guild of more than **20,000 artisans**, sculptors, calligraphers, and lapidaries from across India, Persia, the Ottoman Empire, and Central Asia. Massive blocks of translucent, flawless **white Makrana marble** were brought across Rajasthan on teams of specially harnessed bullocks and elephants. The tomb was engineered upon a subterranean network of moisture-retaining **ebony wood wells**, while its four 40-meter minarets were deliberately tilted outward by a fraction of a degree—an ingenious safeguard ensuring they would fall away from the sanctum in the event of an earthquake.\n\nFor 22 tireless years, the artisans practiced the delicate art of *Parchin Kari* (*pietra dura* inlay), embedding 28 varieties of rare semi-precious gems into floral arabesques: deep blue **lapis lazuli** from Afghanistan, glowing **carnelian** from Arabia, green **jade** from China, and fiery **jasper** from Punjab. Calligrapher **Amanat Khan** inscribed 22 Surahs from the Holy Quran in flowing **Thuluth script**, with letters calibrated in ascending scale so that to the mortal eye looking upward, the sacred verses appear in immaculate optical harmony.\n\nToday, the **Taj Mahal** stands not merely as a marble tomb, but as an eternal poem of love and devotion that softly transforms its hues with the shifting heavens—blushing soft rose at dawn, glowing crystalline white under the midday sun, and gleaming like pure molten gold beneath the full moon.`;
  }

  if (s.includes('konark') || s.includes('sun temple') || s.includes('odisha') || s.includes('narasimha')) {
    return `In **1250 CE**, where the roaring waves of the Bay of Bengal met the sacred Chandrabhaga River, King **Langula Narasimhadeva I** of the Eastern Ganga Dynasty made an imperial vow. To celebrate his glorious victories and offer gratitude for the blessings of **Surya**, the Supreme Sun God, he commanded the creation of a temple the likes of which mortal eyes had never seen: a colossal celestial stone chariot surging out of the sea toward the rising dawn.\n\nChief architect **Bisu Maharana** led a legion of **1,200 master sculptors** who laboured through twelve grueling years. From heavy Khondalite and Chlorite stones, they carved **24 monumental wheels**, each nearly ten feet in diameter and pulled by seven galloping steeds representing the seven days of the week and the seven colors of sunlight. Each wheel was sculpted with such astronomical precision that the shadows cast by the sun across the intricate hub and eight spokes functioned as an exact sundial, measuring time down to the minute.\n\nYet as the twelfth year drew to a close, a crisis gripped the shore. The massive magnetic iron-clamped crowning dome (*Kalasa*) could not be balanced atop the towering spire, and the King issued a terrifying ultimatum to finish the temple by sunrise or face execution. That fateful night, **Dharmapada**, the 12-year-old son of Bisu Maharana who had grown up studying the sacred architectural treatises, stepped into the sanctum. With brilliant mathematical insight, the young prodigy climbed the dizzying heights and locked the crowning stone into flawless alignment. Then, to protect his father's honor and save the lives of the 1,200 craftsmen from the king's wrath, the brave boy leaped from the temple pinnacle into the raging sea.\n\nThough ocean tides and centuries have weathered its majestic assembly hall (*Jagamohana*), the **Konark Sun Temple** remains one of humanity's grandest achievements—a breathtaking hymn in stone celebrating cosmic rhythm, solar power, and boundless human devotion.`;
  }

  if (s.includes('ellora') || s.includes('kailasa') || s.includes('rashtrakuta') || s.includes('krishna i')) {
    return `In the 8th century CE, amidst the dramatic basalt cliffs of the Deccan plateau in Maharashtra, **King Krishna I** of the **Rashtrakuta Dynasty** conceived an architectural audacity that defied every law of conventional building. Rather than assembling blocks of quarried stone, he declared that his artisans would sculpt an entire sacred mountain out of a single volcanic cliff face to recreate **Mount Kailash**, the mystical abode of Lord Shiva.\n\nMaster architect **Kokasa** made a daring vow: his sculptors would work exclusively **top-down**, carving into the living cliff without the aid of scaffolding or mortar. For over a century, generations of master craftsmen swung iron chisels and hammers beneath the blistering Deccan sun, cutting deep vertical trenches into the mountain and excavating more than **200,000 tonnes of solid basalt rock**.\n\nFrom the living mountain emerged **Cave 16 (The Kailasa Temple)**—a breathtaking monolithic complex twice the footprint of the Parthenon in Athens. Artisans carved multi-story pillared galleries, life-sized elephants that appear to lift the temple on their massive backs, and monumental high-relief panels. The most dramatic among them depicts the demon king **Ravana shaking Mount Kailash**, capturing the trembling fury of the mountain and the calm, effortless grace of Shiva pinning him down with a single toe.\n\nWhen the temple was originally completed, it was coated in brilliant white plaster so that it gleamed like the snow-capped Himalayas in the Indian sun. Even after a thousand years, Kailasa stands as an unfathomable engineering and spiritual marvel—a monument that seems not built by mortal hands, but summoned directly from the stone by divine will.`;
  }

  if (s.includes('ajanta') || s.includes('fresco') || s.includes('padmapani') || s.includes('buddhist cave')) {
    return `Between the **2nd century BCE and the 5th century CE**, in a dramatic crescent-shaped volcanic gorge carved by the Waghora River, Buddhist monks and guild artisans discovered an oasis of profound stillness. Here, sheltered from worldly turmoil, they carved **30 magnificent cave temples and monastic halls** (*Chaityas* and *Viharas*) deep into the raw basalt cliffs of Maharashtra.\n\nWorking in semi-darkness, the ancient painters devised an ingenious lighting system, using polished brass plates and silver mirrors placed at cave entrances to reflect soft natural daylight into the deepest chambers. Upon walls prepared with a plaster of river clay, rice husk, and cow dung, they painted with natural mineral pigments: crushed **lapis lazuli** from Badakhshan for celestial blues, rich **red and yellow ochres** from local volcanic soil, and carbon lampblack.\n\nTheir brushes brought the **Jataka tales** of the Buddha's previous incarnations alive with extraordinary emotional depth and fluidity. In Cave 1, the timeless mural of **Bodhisattva Padmapani** captures the pinnacle of classical Indian art—holding a delicate blue lotus with eyes cast down in boundless compassion for all living beings, wearing pearl necklaces that seem to catch the ambient lamp glow.\n\nWhen royal patronage waned with the fall of the **Vakataka Dynasty**, the lush monsoon jungle slowly concealed the cave entrances under thick curtains of creepers and wild trees. For nearly a thousand years, the painted Buddhas rested in secret peace until **April 1819**, when British cavalry officer **John Smith**, tracking a tiger through the Waghora ravine, spotted the top arch of Cave 10—reawakening the greatest painted heritage of the ancient world.`;
  }

  if (s.includes('hampi') || s.includes('vijayanagara') || s.includes('vittala') || s.includes('krishnadevaraya')) {
    return `In the year **1336 CE**, amidst a surreal landscape of giant granite boulders along the sacred **Tungabhadra River**, two warrior brothers named **Harihara** and **Bukka** founded the capital of the **Vijayanagara Empire**—the legendary 'City of Victory'. Under the golden reign of **Emperor Krishnadevaraya** in the 16th century, Hampi flourished as one of the largest, wealthiest, and most cosmopolitan metropolises on earth.\n\nForeign travelers like the Persian ambassador **Abdur Razzaq** and Portuguese merchant **Domingo Paes** wrote in sheer astonishment that Hampi's bustling bazaars traded diamonds, pearls, rubies, and emeralds openly by the measure, like common grain. The empire fostered a radiant renaissance of Kannada, Telugu, and Sanskrit literature, while royal *Sthapathis* carved grand temples that blended Dravidian grandeur with bold sculptural vigor.\n\nAt the **Vittala Temple Complex**, artisans created the iconic **Monolithic Stone Chariot**, dedicated to Garuda, and sculpted fifty-six **musical pillars** (*SaReGaMa pillars*) from single resonant granite blocks that produced distinct notes of classical Indian music when gently tapped by royal musicians. Across the river, the sky-piercing Gopuram of the ancient **Virupaksha Temple** watched over sacred festivals where decorated royal elephants marched in gold-embroidered silks.\n\nThough the imperial capital fell in the battle of 1565, the ruins of Hampi spread across 4,100 hectares remain alive with majestic power—where wind whistling through granite colonnades and sacred chants echoing across the Tungabhadra still narrate the golden epoch of South India's greatest empire.`;
  }

  if (s.includes('brihadeeswara') || s.includes('thanjavur') || s.includes('chola') || s.includes('raja raja')) {
    return `In **1010 CE**, to commemorate the 25th victorious year of his imperial reign, the great Chola Emperor **Raja Raja Chola I** laid the final sanctified stone of the **Brihadeeswara Temple** (*Peruvudaiyar Kovil*) in Thanjavur, Tamil Nadu. Having built a naval empire whose fleets held sway across the Bay of Bengal to Sumatra and Malaya, the Emperor resolved to build the world's most formidable granite temple in tribute to Lord Shiva as the Cosmic Dancer, **Nataraja**.\n\nIn a flat alluvial delta completely devoid of natural stone, the Chola engineers transported over **130,000 tonnes of hard granite** from quarries over 50 kilometers away. The soaring central tower (*Vimana*) was raised to a dizzying **66 meters (216 feet)**, making it the tallest architectural structure of its era. Atop this colossal tower rests the **Kumbam**—a single monolithic granite capstone weighing an astonishing **80 tonnes**.\n\nTo lift this immense monolith to the summit, master builders constructed a monumental inclined earth ramp that stretched nearly **6 kilometers** through the countryside, where regiments of royal elephants, oxen, and thousands of workers hauled the granite block inch by inch. The entire temple was constructed without mortar, using precisely interlocked tongue-and-groove granite blocks that have withstood numerous earthquakes and monsoons for over a millennium.\n\nWithin its circumambulatory halls, Chola artists painted vibrant frescoes, while royal inscriptions etched deeply into the stone plinths meticulously recorded the names of every dancer, musician, architect, and cook who served the temple. The Brihadeeswara Temple stands today as the supreme triumph of **Dravidian architecture**—a monumental granite symphony of imperial power, architectural genius, and unyielding devotion.`;
  }

  if (s.includes('rani ki vav') || s.includes('stepwell') || s.includes('patan') || s.includes('udayamati')) {
    return `In **1063 CE**, following the demise of King Bhima I of the Chaulukya (Solanki) Dynasty, **Queen Udayamati** resolved to build a memorial unlike any other in royal history. While kings raised towers reaching toward the heavens, the Queen commissioned an **inverted subterranean temple** in Patan, Gujarat, that plunged seven magnificent levels deep into the womb of the earth to honor the sacred life-giving gift of water.\n\nKnown as **Rani ki Vav** (The Queen's Stepwell), this subterranean marvel was designed as an architectural sanctuary along the ancient Saraswati River. Descending through stepped terraces and intricately pillared pavilions, visitors are surrounded by more than **800 major sculptures** and 1,000 minor carvings of extraordinary sophistication, depicting **Lord Vishnu in his Dashavatara forms**—from Matsya and Kurma to the majestic sleeping form of *Sheshashayi Vishnu* resting upon the cosmic serpent.\n\nWhen the Saraswati River altered its course and flooded the plains in the 13th century, silt and fine sand completely buried the stepwell, sealing it in a natural subterranean time capsule for nearly seven centuries. When the **Archaeological Survey of India** meticulously excavated the monument in the late 20th century, the carvings emerged in pristine, razor-sharp condition—looking as though the master Solanki sculptors had laid down their chisels only yesterday.`;
  }

  if (s.includes('red fort') || s.includes('lal qila') || s.includes('delhi')) {
    return `In **1638 CE**, Mughal Emperor **Shah Jahan** decided to shift his imperial throne from Agra to Delhi, designing a brand-new planned capital city named **Shahjahanabad**. For ten years along the Yamuna riverbank, master builders and stonemasons raised the soaring, octagonal bastions of the **Red Fort (Lal Qila)** using glowing red sandstone quarried from Rajasthan.\n\nBehind its formidable two-kilometer battlements lay a majestic world of marble palaces, canal-cooled courtyards, and fragrant *Charbagh* gardens. In the **Diwan-i-Khas** (Hall of Private Audience), the Emperor held council upon the fabled **Peacock Throne**, encrusted with diamonds, emeralds, pearls, and the legendary **Koh-i-Noor diamond**, beneath silver ceilings inlaid with gold.\n\nOn the marble archway overlooking the hall, court poet **Amir Khusrau's** celebrated Persian couplet was inscribed in gleaming gold calligraphy: *"Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast"*—**If there is a paradise on earth, it is this, it is this, it is this.** Over three centuries, the fort witnessed the zenith of Mughal majesty, the upheavals of 1857, and finally the historic dawn of **15 August 1947**, when Prime Minister Jawaharlal Nehru raised independent India's tricolor flag from its ramparts—sealing its place as the living heartbeat of the nation.`;
  }

  if (s.includes('varanasi') || s.includes('kashi') || s.includes('banaras') || s.includes('ghat')) {
    return `Long before recorded history began, upon the sacred crescent where the river **Ganga** turns northward toward the Himalayas, the eternal city of **Kashi (Varanasi)** was founded as the terrestrial abode of **Lord Shiva**. Renowned by ancient chroniclers as *Avimukta*—the city never forsaken by the divine—Varanasi has sustained an unbroken rhythm of life, philosophy, and prayer for over **3,000 years**.\n\nAlong its sacred riverfront, **84 historic stone ghats** slope gently into the holy waters. At **Dashashwamedh Ghat**, legend recounts that Lord Brahma performed ten royal horse sacrifices to welcome Shiva back to the city. At **Manikarnika Ghat**, sacred funeral pyres have burned continuously across millennia, embodying the ultimate Hindu belief in *Moksha*—liberation from the eternal cycle of rebirth.\n\nThrough narrow, labyrinthine alleys scented with marigolds, camphor, and freshly brewed chai, generations of poets like **Kabir** and **Tulsidas** composed immortal verses, while master weavers crafted shimmering **Banarasi silk** brocaded with real gold threads. As twilight falls each evening, the ringing of hundreds of brass temple bells and the rhythmic waving of towering multi-tiered brass oil lamps during the **Ganga Aarti** illuminate the river, reaffirming Mark Twain's famous words: *"Varanasi is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together."*`;
  }

  if (s.includes('sanchi') || s.includes('stupa') || s.includes('ashoka')) {
    return `In the 3rd century BCE, following the catastrophic bloodbath of the Kalinga War, a profound transformation gripped the heart of the mighty Mauryan Emperor **Ashoka**. Renouncing territorial conquest through war (*Digvijaya*), the Emperor embraced the Buddhist path of moral victory through righteousness (*Dhammavijaya*). On a serene, secluded hilltop at **Sanchi** in Madhya Pradesh, he commissioned the construction of a great hemispherical stone dome to enshrine sacred bone relics of **Gautama Buddha**.\n\nTwo centuries later, under the **Satavahana Dynasty**, guilds of ivory carvers and sculptors from nearby Vidisha added four magnificent **Torana gateways** facing the four cardinal directions. These 34-foot-high gateways were carved with breathtaking density: playful elephants holding lotus flowers, celestial guardians (*Yakshis*) gracefully suspended from mango boughs, and vivid narrative panels recounting the Buddha's life and Jataka tales.\n\nIntriguingly, the Buddha himself was never depicted in human form on these ancient toranas—instead, his presence was reverently symbolized through footprints (*Paduka*), an empty throne beneath the Bodhi tree, the wheel of law (*Dharmachakra*), and the umbrella of spiritual royalty (*Chhatra*). Sanchi stands today as India's oldest surviving stone structure, a timeless sanctuary of inner peace and universal compassion.`;
  }

  // Universal Deep Historical Narrative Fallback
  return `Centuries ago in the golden heart of India, visionary rulers, master sthapathis, and devoted guilds of craftsmen gathered to breathe life into **${site || 'this timeless monument'}**.\n\nWorking under the starlit skies of ancient Bharat, hundreds of stone carvers, metal casters, and painters chipped away at raw granite, sandstone, and marble. Guided by sacred geometric canons and Vedic philosophy, every arch was calibrated to capture the cosmic movement of constellations, while every sculpted pillar mirrored the spiritual harmony between nature, humanity, and the divine.\n\nLegends recount the immense devotion of those master artisans who poured their lifetimes into this creation, leaving behind inscriptions in classical Sanskrit, Prakrit, or Persian that whisper forgotten tales of royal valor, celestial music, and spiritual enlightenment. Today, as travelers and pilgrims walk through its historic corridors, the stones continue to echo with the enduring soul of India's 5,000-year-old civilization.`;
}

// ─── POST /api/ai/story ───────────────────────────────────────────────────────
router.post('/story', async (req, res) => {
  try {
    const { site } = req.body;
    const targetSite = site ? site.trim() : 'Ajanta Caves';

    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const prompt = `You are Virasat AI, an acclaimed Indian heritage historian and master storyteller.
Write an exceptionally rich, poetic, and historically immersive narrative story (3 to 4 vivid paragraphs, ~350-450 words) about the Indian heritage site or monument: "${targetSite}".

Narrative Structure:
1. The Dawn of Vision: Set the atmospheric scene back in the historical era (the weather, riverbanks, sounds of chisels striking stone, scents of sandalwood and brass lamps, courtly atmosphere, and the visionary ruler, queen, or monastic master who conceived the monument).
2. The Miracle of Creation: Detail the feats of master architects (sthapathis/ustads) and devoted artisans, the sourcing of rare materials (Makrana marble, granite monoliths, volcanic basalt, lapis lazuli pigments), the engineering triumphs, and human sacrifices or devotion behind every carved pillar, dome, or mural.
3. Legends & Sacred Mysteries: Recount the enduring folktales, spiritual symbolism, inscriptions, astronomical alignments, or intriguing mysteries that have been passed down across generations.
4. Timeless Legacy: Conclude with how this sanctum or fortress stands today as an eternal testament to Bharat's cultural and architectural soul.

Formatting: Use rich markdown with **bold** highlights for key historical figures, dates, dynasties, architectural styles, and Sanskrit/Persian terms. Do NOT use bullet points — write in sweeping, evocative prose.`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text && text.trim().length > 0) {
            return res.json({ success: true, story: text.trim(), source: 'gemini_live' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini story generation failed, using rich fallback:', geminiErr.message);
      }
    }

    const story = getDetailedStory(targetSite);
    res.json({ success: true, story, source: 'virasat_storyteller_engine' });
  } catch (error) {
    console.error('Story route error:', error);
    const story = getDetailedStory(req.body?.site || 'Indian Monument');
    res.json({ success: true, story, source: 'virasat_storyteller_engine' });
  }
});

module.exports = router;


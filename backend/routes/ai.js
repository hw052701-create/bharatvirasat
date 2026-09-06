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
function getFallbackChat(message, history = []) {
  let q = message.toLowerCase().trim();

  // ── Extensive typo normalization ──
  q = q
    .replace(/\b(bild|biuld|build|biult|buil|bult|buld|bld)\b/g, 'built')
    .replace(/\b(artecthuire|architecher|architectur|arcitecture|arkitecture|artecture|architechture|artitecture)\b/g, 'architecture')
    .replace(/\b(wen|whens|whn|whne)\b/g, 'when')
    .replace(/\b(hoo|whos|whoo|whoes)\b/g, 'who')
    .replace(/\b(wat|wats|whut|wot)\b/g, 'what')
    .replace(/^tel\b|^tell me\b|^tle\b/g, 'tell')
    .replace(/^abt\b|^abou\b/g, 'about')
    .replace(/\b(histry|histroy|histery|histoy)\b/g, 'history')
    .replace(/\b(tempel|tempal|templee|tmple)\b/g, 'temple')
    .replace(/\b(monumnet|monumet|monumentt)\b/g, 'monument')
    .replace(/\b(inscrption|inscriptin|inscripton|inscriptions|inscript)\b/g, 'inscription')
    .replace(/\b(sculpter|sculptre|sculpure|sculptures|sculptur)\b/g, 'sculpture')
    .replace(/\b(festval|festivel|festivl|festivals)\b/g, 'festival')
    .replace(/\b(dynesty|dynasti|dynastie|dynasties)\b/g, 'dynasty')
    .replace(/\b(ruler|rular|ruelr|rulers)\b/g, 'ruler')
    .replace(/\b(emperor|emperer|emperur|emperors)\b/g, 'emperor');

  // ── Entity DB with metadata for age/builder follow-ups ──
  const entities = [
    { key: 'khajuraho', name: 'Khajuraho Temples', match: ['khajuraho', 'chandela', 'kandariya', 'chhatarpur'], built: '950–1050 CE', age: 1000, builders: 'Chandela Rajput Dynasty' },
    { key: 'taj', name: 'Taj Mahal', match: ['taj mahal', 'taj', 'mumtaz', 'shah jahan', 'agra'], built: '1631–1653 CE', age: 373, builders: 'Emperor Shah Jahan' },
    { key: 'red_fort', name: 'Red Fort', match: ['red fort', 'lal qila', 'redfort', 'delhi fort'], built: '1638–1648 CE', age: 378, builders: 'Mughal Emperor Shah Jahan' },
    { key: 'qutub', name: 'Qutub Minar', match: ['qutub', 'qutb', 'iron pillar', 'mehrauli'], built: '1193 CE', age: 833, builders: 'Qutb-ud-din Aibak & Iltutmish' },
    { key: 'hampi', name: 'Hampi', match: ['hampi', 'vijayanagara', 'vittala', 'stone chariot'], built: '14th century CE', age: 650, builders: 'Vijayanagara Empire' },
    { key: 'ajanta', name: 'Ajanta Caves', match: ['ajanta', 'cave 1', 'frescoes', 'padmapani'], built: '2nd century BCE', age: 2200, builders: 'Satavahana & Vakataka dynasties' },
    { key: 'ellora', name: 'Ellora Caves', match: ['ellora', 'kailasa', 'rashtrakuta'], built: '6th–11th century CE', age: 1200, builders: 'Rashtrakuta & Yadava kings' },
    { key: 'konark', name: 'Konark Sun Temple', match: ['konark', 'sun temple', 'narasimhadeva'], built: '1250 CE', age: 776, builders: 'King Narasimhadeva I' },
    { key: 'brihadeeswara', name: 'Brihadeeswara Temple', match: ['brihadeeswara', 'thanjavur', 'chola', 'raja raja'], built: '1010 CE', age: 1016, builders: 'Raja Raja Chola I' },
    { key: 'meenakshi', name: 'Meenakshi Temple', match: ['meenakshi', 'madurai', 'sundareswarar'], built: '6th century CE (rebuilt 17th century)', age: 1400, builders: 'Pandya kings & Nayak rulers' },
    { key: 'sanchi', name: 'Great Stupa at Sanchi', match: ['sanchi', 'stupa', 'ashoka'], built: '3rd century BCE', age: 2300, builders: 'Emperor Ashoka' },
    { key: 'rani_ki_vav', name: 'Rani ki Vav', match: ['rani ki vav', 'stepwell', 'patan'], built: '11th century CE', age: 1000, builders: 'Queen Udayamati' },
    { key: 'nalanda', name: 'Nalanda University', match: ['nalanda', 'ancient university'], built: '5th century CE', age: 1550, builders: 'Gupta Empire' },
    { key: 'mahabalipuram', name: 'Mahabalipuram', match: ['mahabalipuram', 'mamallapuram', 'pallava', 'shore temple'], built: '7th century CE', age: 1350, builders: 'Pallava dynasty' },
    { key: 'fatehpur', name: 'Fatehpur Sikri', match: ['fatehpur', 'buland darwaza', 'akbar'], built: '1571 CE', age: 455, builders: 'Emperor Akbar' },
    { key: 'golden_temple', name: 'Golden Temple', match: ['golden temple', 'harmandir', 'amritsar'], built: '1577 CE', age: 449, builders: 'Guru Ram Das' },
    { key: 'varanasi', name: 'Varanasi', match: ['varanasi', 'kashi', 'banaras', 'ghat'], built: '11th century BCE (legendary)', age: 3000, builders: 'Ancient sacred city' }
  ];

  // ── Entity resolution: current message → then history in reverse order ──
  let activeEntity = null;

  for (const ent of entities) {
    if (ent.match.some(m => q.includes(m))) { activeEntity = ent; break; }
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

  // ══════════════════════════════════════════════════════════════════════════
  //  FOLLOW-UP HANDLERS (checked first so context-aware questions work)
  // ══════════════════════════════════════════════════════════════════════════

  // ── How old / How long / Age / Duration ──
  if (q.includes('how old') || q.includes('how long') || q.includes('age') || q.includes('years old') || q.includes('how ancient') || q.includes('till now') || q.includes('since when') || q.includes('how many year') || (q.includes('long') && q.includes('it'))) {
    if (activeEntity) {
      const centuryStr = activeEntity.age >= 1000 ? `nearly ${Math.round(activeEntity.age / 100)} centuries` : `about ${Math.round(activeEntity.age / 10)} decades`;
      return `⏳ The **${activeEntity.name}** was originally built around **${activeEntity.built}**, which makes it approximately **${activeEntity.age} years old** — that's ${centuryStr} of standing history!\n\nDespite the passage of time, it remains one of India's most treasured heritage sites, carefully preserved by the **Archaeological Survey of India (ASI)** and recognized by **UNESCO**. Thousands of visitors from around the world come every year to witness its timeless beauty.\n\nWould you like to know about who built it, its architecture, or how to visit?`;
    }
    return `⏳ India's heritage spans over **5,000 years** of continuous civilization — from the ancient **Indus Valley (Harappan)** cities of 3300 BCE to the medieval Mughal masterpieces and living temple traditions that thrive today.\n\nCould you tell me which specific site you'd like to know the age of? I can give you exact dates and fascinating historical context!`;
  }

  // ── Who built it / History / Dynasty / When ──
  if (q.includes('who built') || q.includes('who made') || q.includes('who create') || q.includes('who construct') || q.includes('builder') || q.includes('when was') || q.includes('history of') || q.includes('founder') || q.includes('dynasty') || q.includes('ruler') || q.includes('king') || q.includes('emperor') || (q.includes('built') && (q.includes('it') || q.includes('this') || q.includes('when') || q.includes('who')))) {
    if (activeEntity && activeEntity.key === 'red_fort') {
      return `👑 The **Red Fort (Lal Qila)** was commissioned between **1638 and 1648 CE** by Mughal Emperor **Shah Jahan** when he relocated the imperial capital from Agra to the newly planned city of **Shahjahanabad** (Old Delhi).\n\nChief court architects **Ustad Ahmad** and **Ustad Hamid** oversaw the 10-year construction using Rajasthan red sandstone. Within its fortified walls, the Emperor held court in the marble *Diwan-i-Khas*, seated upon the fabled **Peacock Throne**.\n\nWould you like to know about its architecture, famous Persian inscriptions, or how to visit?`;
    }
    if (activeEntity && activeEntity.key === 'taj') {
      return `👑 The **Taj Mahal** was commissioned in **1631 CE** by Mughal Emperor **Shah Jahan** as an eternal monument of love for his beloved wife **Mumtaz Mahal**, who passed away during childbirth. It took about **22 years** and over **20,000 artisans** under chief architect **Ustad Ahmad Lahori** to complete this masterpiece.\n\nThe pristine white Makrana marble was brought from Rajasthan, and semi-precious stones for the *pietra dura* inlay work were sourced from Sri Lanka, Tibet, and Persia.\n\nShall I tell you about its architecture, inscriptions, or the best time to visit?`;
    }
    if (activeEntity && activeEntity.key === 'khajuraho') {
      return `👑 The **Khajuraho Temples** were built by the **Chandela Rajput dynasty** between **950 and 1050 CE**, during a golden century of artistic and spiritual expression in the Bundelkhand region of central India.\n\nThe key rulers behind the construction were **King Yashovarman** (who built the Lakshmana Temple), **King Dhanga** (Visvanatha Temple), and **King Vidyadhara** (the magnificent Kandariya Mahadeva Temple). Out of the original 85 temples spread across 20 square kilometers, **25 have survived to this day**, carefully preserved by ASI and UNESCO.\n\nWould you like to explore their architecture or learn about the famous sculptures?`;
    }
    if (activeEntity && activeEntity.key === 'qutub') {
      return `👑 The **Qutub Minar** was founded in **1193 CE** by **Qutb-ud-din Aibak**, founder of the Delhi Sultanate, and completed by **Shams-ud-din Iltutmish**.\n\nThe complex also houses the famous **1,600-year-old Iron Pillar** erected during the Gupta Empire under Chandragupta II Vikramaditya.\n\nWould you like to know about its inscriptions or architectural design?`;
    }
    if (activeEntity && activeEntity.key === 'brihadeeswara') {
      return `👑 The **Brihadeeswara Temple** was commissioned by the legendary **Raja Raja Chola I** and completed in **1010 CE** to celebrate 25 years of imperial Chola rule. The entire temple is built from **interlocking granite blocks** — the 80-tonne apex dome was hoisted atop the 66-meter tower without mortar, a feat that still amazes modern engineers.\n\nWould you like to know about its inscriptions or the Chola dynasty's maritime empire?`;
    }
    if (activeEntity) {
      return `👑 **${activeEntity.name}** was built around **${activeEntity.built}** by **${activeEntity.builders}**. It has stood for approximately **${activeEntity.age} years**, a remarkable testament to India's architectural genius and civilizational continuity.\n\nWould you like to know more about its architecture, art, or how to visit?`;
    }
  }

  // ── Inscriptions & Epigraphy ──
  if (q.includes('inscription') || q.includes('script') || q.includes('epigraph') || q.includes('writing') || q.includes('written') || q.includes('engrav')) {
    if (activeEntity && activeEntity.key === 'khajuraho') {
      return `📜 The inscriptions at the **Khajuraho Temples** are written in classical **Sanskrit** using the medieval **Kutila (early Nagari)** script. The most significant ones are found on the stone plinths of the **Lakshmana Temple** (dated 954 CE) and the **Visvanatha Temple** (dated 1002 CE).\n\nThese *prashastis* (royal panegyrics) trace the **Chandela dynasty's divine genealogy** back to the Moon God *Chandra*, record their military victories, and credit master architects like *Sutradhara Chhichha*. They also document the installation of sacred icons, establishing Khajuraho as a premier medieval spiritual center.\n\nWould you like to explore the temple sculptures or architecture next?`;
    }
    if (activeEntity && activeEntity.key === 'taj') {
      return `📜 The **Taj Mahal's** calligraphy was inscribed by Persian master **Amanat Khan** in **1639 CE** using the elegant **Thuluth** script. The text is inlaid using **black jasper marble** carefully set into the white Makrana marble panels.\n\nWhat's truly clever is the **optical illusion**: the letter sizes increase progressively as you look higher up the arches, so from the ground they all appear perfectly uniform. The inscriptions contain **22 Surahs** from the Holy Quran, including Surah Ya-Sin and Surah Al-Fajr.\n\nShall I tell you about the architecture or visiting tips?`;
    }
    return `📜 India has over **100,000 recorded historical inscriptions** on stone, pillars, and copper plates. The most famous are **Ashoka's rock and pillar edicts** (3rd century BCE) written in Brahmi script, spreading the message of *Dhamma* and non-violence. Other remarkable examples include the **Allahabad Pillar inscription** of Samudragupta and the detailed **Tamil inscriptions** at Chola temples.\n\nWhich specific monument's inscriptions would you like to know about?`;
  }

  // ── Sculptures, Art, Murals ──
  if (q.includes('sculpture') || q.includes('carving') || q.includes('statue') || q.includes('erotic') || q.includes('mural') || q.includes('mithuna')) {
    if (activeEntity && activeEntity.key === 'khajuraho') {
      return `🎨 Contrary to popular belief, only about **10% of Khajuraho's sculptures are erotic** (*Mithuna*). The remaining 90% beautifully depict everyday medieval life — musicians, celestial maidens (*Apsaras*) removing thorns from their feet, cosmic deities, and royal warriors.\n\nPhilosophically, the sculptures represent the four **Purusharthas** (goals of life): *Dharma*, *Artha*, *Kama*, and *Moksha*. The carving quality is extraordinary — figures seem to emerge from the sandstone with lifelike movement and anatomical grace.\n\nWant to know about the temple architecture or who built them?`;
    }
    if (activeEntity && activeEntity.key === 'ajanta') {
      return `🎨 The **Ajanta Cave murals** are considered the pinnacle of ancient Indian painting. The most iconic is the **Bodhisattva Padmapani** in Cave 1 — a serene, lotus-bearing figure that has become a symbol of timeless compassion. The murals vividly narrate **Jataka tales** of the Buddha's previous lives.\n\nArtists used natural mineral pigments like lapislazuli for blue and red ochre for warm tones, applied over mud-plastered rock using a *tempera fresco* technique.\n\nShall I tell you about the cave architecture or the nearby Ellora Caves?`;
    }
  }

  // ── Architecture & Engineering ──
  if (q.includes('architecture') || q.includes('design') || q.includes('engineering') || q.includes('how was it built') || q.includes('material') || q.includes('style') || q.includes('height') || q.includes('structure')) {
    if (activeEntity && activeEntity.key === 'khajuraho') {
      return `🏛️ The Khajuraho Temples follow the **Nagara (North Indian)** style of architecture, featuring a distinctive **Panchayatana layout** — a central shrine surrounded by four subsidiary shrines, all elevated on a high stone terrace called a *Jagati*.\n\nThe most striking feature is the **Shikhara (tower)** design: clusters of miniature spires called *Urushringas* rise rhythmically like a mountain range, symbolizing **Mount Meru** — the cosmic axis in Hindu cosmology. Inside, each temple flows through the *Ardhamandapa* (entrance porch), *Mandapa* (hall), *Mahamandapa* (great hall), and finally the *Garbhagriha* (inner sanctum) housing the deity.\n\nWould you like to learn about the sculptures or plan a visit?`;
    }
    if (activeEntity && activeEntity.key === 'taj') {
      return `🏛️ The **Taj Mahal** is a masterclass in **bilateral symmetry** — everything on one side is perfectly mirrored on the other along the central water canal. It features an ingenious **double dome**: an outer bulbous dome rising 73 meters for visual grandeur, and an inner dome for acoustic resonance of sacred prayers.\n\nThe four **40-meter minarets** tilt slightly outward — a deliberate earthquake safety measure so they'd fall away from the tomb in case of a tremor. The entire structure rests on a foundation of **ebony wood wells** kept moist by the Yamuna river.\n\nWant to know about the inscriptions or best time to visit?`;
    }
  }

  // ── Travel / Visit / Timings ──
  if (q.includes('how to reach') || q.includes('visit') || q.includes('ticket') || q.includes('timing') || q.includes('best time') || q.includes('where is') || q.includes('how to go') || q.includes('travel')) {
    if (activeEntity && activeEntity.key === 'khajuraho') {
      return `✈️ **Khajuraho** is in the Chhatarpur district of **Madhya Pradesh**. You can fly into **Khajuraho Airport (HJR)** with connections to Delhi and Varanasi, or take a train to Khajuraho Railway Station.\n\nThe **best time to visit** is October to March when the weather is pleasant. Don't miss the famous **Khajuraho Dance Festival** every February, where India's finest classical dancers perform against the illuminated temples. The site is open sunrise to sunset, and there's an excellent **Sound & Light Show** in the evenings.\n\nWould you like to know about the temple sculptures or history?`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  GREETINGS
  // ══════════════════════════════════════════════════════════════════════════
  if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
    return `🙏 **Namaste!** Welcome to Virasat AI — your personal guide to India's extraordinary heritage.\n\nI can tell you about **any monument**, from the Taj Mahal to the Khajuraho Temples. Ask about **royal dynasties** like the Mughals, Cholas, or Mauryas, or explore **classical dance forms**, **ancient festivals**, and **temple architecture**. You can also ask follow-up questions like "who built it?" or "how old is it?" — I'll remember what we were discussing.\n\nWhat would you like to explore?`;
  }

  if (q.includes('kaise ho') || q.includes('how are you')) {
    return `🙏 I'm doing great, thanks for asking! I've been brushing up on India's **5,000 years of heritage** — so I'm ready to guide you. What would you like to discover today? A monument, a dynasty, a festival, or something else entirely?`;
  }

  if (q.includes('who are you') || q.includes('kya ho') || q.includes('kya kar sakte ho') || q.includes('help')) {
    return `🙏 I'm **Virasat AI**, your AI-powered cultural guide built for BharatVirasat. Think of me as a knowledgeable friend who can explain any Indian heritage topic — from the **Harappan civilization** to **Mughal architecture**, from **Bharatnatyam dance** to **Diwali traditions**. I can also generate heritage quizzes, tell ancient stories, and provide travel tips. Just ask away!`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRIMARY MONUMENT RESPONSES (Conversational Paragraphs)
  // ══════════════════════════════════════════════════════════════════════════
  if (q.includes('taj') || q.includes('agra')) {
    return `🏛️ The **Taj Mahal** in Agra is one of the most breathtaking monuments ever built. Commissioned between **1631 and 1653 CE** by Mughal Emperor **Shah Jahan** in memory of his beloved wife **Mumtaz Mahal**, it's a masterpiece of Indo-Islamic architecture crafted from pristine white **Makrana marble** inlaid with semi-precious gems.\n\nRecognized as a **UNESCO World Heritage Site** and one of the **New 7 Wonders of the World**, it's best experienced at sunrise when the marble seems to glow golden along the Yamuna river.\n\nWould you like to know about its architecture, inscriptions, or who built it?`;
  }

  if (q.includes('red fort') || q.includes('lal qila')) {
    return `🏰 The **Red Fort (Lal Qila)** in Delhi was built between **1638 and 1648 CE** by Emperor **Shah Jahan** when he moved the Mughal capital to Shahjahanabad. Built entirely from **red sandstone**, it features stunning halls like the *Diwan-i-Khas* with its famous inscription: "If there is paradise on earth, it is this."\n\nToday it holds deep national significance — every **15 August (Independence Day)**, the Prime Minister hoists the tricolor and addresses the nation from its ramparts.\n\nWant to learn about its history or architecture?`;
  }

  if (q.includes('qutub minar') || q.includes('qutb')) {
    return `🗼 The **Qutub Minar** in Delhi is the world's tallest brick minaret at **72.5 meters**, with five beautifully tapered storeys of fluted red sandstone. Built starting **1193 CE** under **Qutb-ud-din Aibak** and completed by **Iltutmish**, it marks the beginning of Islamic rule in India.\n\nThe complex also houses the remarkable **1,600-year-old Iron Pillar** — a metallurgical marvel that has resisted rust for over a millennium, baffling scientists to this day.\n\nWould you like to know more about its inscriptions or the Iron Pillar?`;
  }

  if (q.includes('fatehpur') || q.includes('buland darwaza')) {
    return `🚪 **Fatehpur Sikri** was founded in **1571 CE** by Emperor **Akbar** as his imperial capital, but was mysteriously abandoned after just 14 years — possibly due to water scarcity. The complex is home to the **Buland Darwaza**, a 54-meter triumphal archway celebrating Akbar's victory over Gujarat.\n\nInside lies the exquisite white marble **Tomb of Sheikh Salim Chishti**, a Sufi saint whose blessing Akbar believed gave him an heir.\n\nShall I tell you more about Akbar or Mughal architecture?`;
  }

  if (q.includes('varanasi') || q.includes('kashi') || q.includes('banaras') || q.includes('ghat')) {
    return `🪔 **Varanasi (Kashi)** is one of the oldest continuously inhabited cities in the world, nestled along the sacred **Ganges** in Uttar Pradesh. It has been a living spiritual center for over **3,000 years**, revered as the abode of Lord Shiva.\n\nThe city is famous for its **84 historic ghats** — especially *Dashashwamedh Ghat* (known for the mesmerizing evening Ganga Aarti) and *Manikarnika Ghat*. It's also the birthplace of **Banarasi silk weaving** and a cradle of **Hindustani classical music**.\n\nWant to know about the Kashi Vishwanath Temple or the Ganga Aarti?`;
  }

  if (q.includes('golden temple') || q.includes('harmandir') || q.includes('amritsar')) {
    return `✨ The **Golden Temple (Sri Harmandir Sahib)** in Amritsar is the spiritual heart of Sikhism. Founded in **1577 CE by Guru Ram Das**, its marble sanctuary was later overlaid with **pure 24-karat gold** by Maharaja Ranjit Singh in 1830.\n\nIt has **four entrances** symbolizing that people of every caste and creed are welcome. Its community kitchen (*Langar*) serves **free meals to over 100,000 people every single day** — the largest in the world.\n\nWould you like to know about its history or architecture?`;
  }

  if (q.includes('ajanta')) {
    return `🎨 The **Ajanta Caves** in Maharashtra are **30 rock-cut Buddhist caves** dating from the **2nd century BCE to 5th century CE**, carved into a horseshoe-shaped cliff along the Waghora River. They contain what are widely considered the **finest surviving examples of ancient Indian painting**.\n\nThe caves were forgotten for over a thousand years, hidden by jungle, until a British officer rediscovered them in 1819 during a tiger hunt. The **Jataka tale murals** inside are breathtaking.\n\nWould you like to know about the paintings, or the nearby Ellora Caves?`;
  }

  if (q.includes('ellora') || q.includes('kailasa')) {
    return `⛰️ The **Ellora Caves** in Maharashtra represent **three religions** — Buddhism, Hinduism, and Jainism — side by side in perfect harmony. The undisputed highlight is the **Kailasa Temple (Cave 16)**, the largest single monolithic rock excavation in the world.\n\nArtisans carved the entire temple **top-down from a cliff face**, removing over **200,000 tonnes of rock** without scaffolding. It's essentially a mountain sculpted into a temple — and it took over 100 years to complete.\n\nShall I tell you more about the sculptures or engineering?`;
  }

  if (q.includes('khajuraho') || q.includes('chandela')) {
    return `🛕 The **Khajuraho Temples** in Madhya Pradesh are among India's most extraordinary architectural treasures. Built between **950 and 1050 CE** by the **Chandela dynasty**, these sublime **Nagara-style sandstone temples** feature thousands of intricate sculptures celebrating spiritual devotion, cosmic deities, music, dance, and the full spectrum of human experience.\n\nThe crown jewel is the towering **Kandariya Mahadeva Temple**, dedicated to Lord Shiva — widely regarded as the finest example of North Indian temple architecture ever created.\n\nWould you like to know about their famous sculptures, who built them, or how to visit?`;
  }

  if (q.includes('sanchi') || q.includes('stupa')) {
    return `☸️ The **Great Stupa at Sanchi** in Madhya Pradesh is the **oldest surviving stone structure in India**, originally commissioned in the **3rd century BCE by Emperor Ashoka** over sacred relics of the Buddha. Its four magnificent carved gateways (*Toranas*) depict scenes from the Buddha's life with extraordinary artistic detail.\n\nSanchi was a living Buddhist center for over a millennium before being forgotten and rediscovered in 1818.\n\nWould you like to know about Ashoka's edicts or the gateway carvings?`;
  }

  if (q.includes('rani ki vav') || q.includes('patan') || q.includes('stepwell')) {
    return `💧 **Rani ki Vav** in Patan, Gujarat, is an inverted underground temple built in the **11th century CE** by **Queen Udayamati** in memory of her husband King Bhima I. It descends through **7 terraced levels** adorned with over 500 exquisite sculptures of Lord Vishnu's *Dashavatara*.\n\nIt's so beautifully crafted that the Reserve Bank of India featured it on the **₹100 note**.\n\nWant to know about Gujarat's other heritage sites?`;
  }

  if (q.includes('jaipur') || q.includes('amer') || q.includes('hawa mahal') || q.includes('rajasthan')) {
    return `👑 **Jaipur**, the Pink City, is a **UNESCO World Heritage city** founded in **1727** by astronomer-king **Maharaja Sawai Jai Singh II**. The iconic **Hawa Mahal (Palace of Winds)** with its 953 honeycomb windows allowed royal women to observe street life without being seen.\n\nRajasthan's heritage extends far beyond Jaipur — the state's six **Hill Forts** (Amer, Kumbhalgarh, Chittorgarh, Mehrangarh, Jaisalmer, and Ranthambore) are collectively a UNESCO World Heritage Site.\n\nWant to explore a specific fort or Rajasthan's folk art traditions?`;
  }

  if (q.includes('hampi') || q.includes('vijayanagara')) {
    return `🏛️ **Hampi** in Karnataka was once the glorious capital of the **Vijayanagara Empire** (14th–16th centuries). Medieval Portuguese and Persian travelers described it as one of the **wealthiest cities in the entire world**.\n\nThe UNESCO site features over **1,600 surviving monuments**, including the iconic **Stone Chariot** and the musical pillars of the *Vittala Temple*, the ancient *Virupaksha Temple*, and royal elephant stables — all set against a surreal boulder landscape along the **Tungabhadra River**.\n\nWant to know about its architecture, dynasty, or the famous Stone Chariot?`;
  }

  if (q.includes('brihadeeswara') || q.includes('thanjavur') || q.includes('tanjore') || q.includes('chola')) {
    return `🛕 The **Brihadeeswara Temple** in Thanjavur, built in **1010 CE** by **Raja Raja Chola I**, is an engineering marvel. The entire structure is built from **interlocking granite** — the 80-tonne apex dome was hoisted to the top of the **66-meter tower without mortar**.\n\nIt served as the cultural epicenter of the **Chola Empire**, nurturing classical **Bharatnatyam dance** and the art of **lost-wax bronze casting** — including the iconic Nataraja.\n\nWant to explore the Chola dynasty or the temple's inscriptions?`;
  }

  if (q.includes('meenakshi') || q.includes('madurai')) {
    return `🌸 The **Meenakshi Amman Temple** in Madurai is a breathtaking jewel of **Dravidian architecture**, dedicated to Goddess **Meenakshi (Parvati)** and **Sundareswarar (Shiva)**. Its **14 towering Gopurams** are adorned with thousands of hand-painted mythological statues, creating a visual feast.\n\nThe complex includes the famous **Hall of 1,000 Pillars** and represents **2,500 years** of living Tamil heritage.\n\nWould you like to know about Dravidian architecture or Tamil festivals?`;
  }

  if (q.includes('mahabalipuram') || q.includes('mamallapuram') || q.includes('pallava') || q.includes('shore temple')) {
    return `🌊 **Mahabalipuram** in Tamil Nadu is a stunning **7th-century Pallava dynasty** coastal heritage site. Its monuments include the **Pancha Rathas** — five monolithic chariots carved from single granite boulders, the **Shore Temple** braving the Bay of Bengal waves, and the massive "**Arjuna's Penance**" rock relief.\n\nWant to learn about the Pallava dynasty or Dravidian sculpture?`;
  }

  if (q.includes('mysore') || q.includes('mysuru')) {
    return `🏰 The **Mysore Palace** in Karnataka is one of India's most visited landmarks. Redesigned in **Indo-Saracenic** grandeur by Henry Irwin in 1912 for the **Wadiyar dynasty**, it features stained glass ceilings, Belgian chandeliers, and a peacock-themed audience hall.\n\nDuring the **Mysuru Dasara** festival, the palace illuminates with **100,000 light bulbs** — a truly magical sight.\n\nWant to know about the Wadiyar dynasty or Karnataka heritage?`;
  }

  if (q.includes('konark') || q.includes('sun temple') || q.includes('odisha')) {
    return `☀️ The **Konark Sun Temple** in Odisha, built in **1250 CE** by King **Narasimhadeva I**, is designed as a colossal stone chariot for the **Sun God Surya** — complete with **24 intricately carved wheels** pulled by 7 galloping horses.\n\nThe most fascinating detail? Those wheels actually function as **precise sundials** — you can calculate the exact time of day to the minute by reading the shadows on the wheel spokes.\n\nWant to know about its sculptures or how to visit?`;
  }

  if (q.includes('nalanda') || q.includes('bihar')) {
    return `📚 **Nalanda** in Bihar was the ancient world's greatest university — founded in the **5th century CE** under the Gupta Empire. At its peak, it hosted **10,000 students and 2,000 teachers** from across Asia including China, Korea, Japan, and Tibet.\n\nFamous intellectuals like **Aryabhata** and **Nagarjuna** taught here. Its vast library *Dharmaganja* was so large that it reportedly burned for months when invaders set it ablaze.\n\nShall I tell you about ancient Indian education or the Gupta dynasty?`;
  }

  // ── Arts & Culture ──
  if (q.includes('dance') || q.includes('nritya') || q.includes('bharatnatyam') || q.includes('kathak') || q.includes('kathakali') || q.includes('odissi')) {
    return `💃 India has **eight recognized classical dance forms**, each with roots going back thousands of years. **Bharatnatyam** from Tamil Nadu originated in temple rituals and is known for geometric precision. **Kathak** from North India is a storytelling tradition with lightning-fast spins. **Kathakali** from Kerala is a dramatic spectacle with elaborate face makeup. **Odissi** from Odisha features the beautiful *Tribhanga* posture inspired by temple sculptures.\n\nOther forms include **Kuchipudi**, **Manipuri**, **Mohiniyattam**, and **Sattriya**.\n\nWould you like to dive deeper into any specific dance form?`;
  }

  if (q.includes('painting') || q.includes('madhubani') || q.includes('warli') || q.includes('art')) {
    return `🎨 India's folk art traditions are incredibly diverse. **Madhubani** from Bihar uses geometric patterns painted with natural pigments. **Warli** from Maharashtra features minimalist stick figures depicting village life. **Tanjore painting** from Tamil Nadu is famous for its **gold leaf overlay**. **Pattachitra** from Odisha and Bengal are narrative scroll paintings of epics.\n\nEach art form has been passed down through generations and is still practiced as a living tradition today.\n\nWant to explore a specific art form in detail?`;
  }

  // ── Festivals ──
  if (q.includes('diwali') || q.includes('deepavali')) {
    return `🪔 **Diwali** (the Festival of Lights) is India's most celebrated festival, marking the victory of light over darkness. It commemorates **Lord Rama's return to Ayodhya** after 14 years of exile and his defeat of the demon king Ravana.\n\nFamilies light earthen *diyas*, create colorful *rangoli*, perform **Lakshmi Puja** for prosperity, and celebrate together with sweets and fireworks. In South India, it also marks Krishna's victory over Narakasura.\n\nWant to know about other festivals or the Ramayana story?`;
  }

  if (q.includes('holi')) {
    return `🎨 **Holi** is the vibrant Festival of Colors celebrating spring and the divine love of **Radha and Krishna** in Braj. The night before, **Holika Dahan** bonfires symbolize the triumph of devotion through the story of Bhakta Prahlada.\n\nThe next morning, people joyfully drench each other in colored powders — it's one of the most inclusive celebrations in Indian culture, where social barriers dissolve entirely.\n\nShall I tell you about Mathura's famous Lathmar Holi?`;
  }

  if (q.includes('festival') || q.includes('navratri') || q.includes('durga puja') || q.includes('pongal') || q.includes('onam')) {
    return `🎉 India's festivals are as diverse as its culture! **Durga Puja** in Bengal is UNESCO-recognized with grand artistic *pandals*. **Navratri** in Gujarat features nine nights of colorful **Garba** dancing. **Onam** in Kerala celebrates King Mahabali with flower carpets and snake boat races. **Pongal** in Tamil Nadu honors the Sun God with harvested rice.\n\nEach festival carries centuries of stories and community spirit.\n\nWhich festival would you like to explore in depth?`;
  }

  // ── Dynasties ──
  if (q.includes('mughal') || q.includes('babur') || q.includes('akbar') || q.includes('shah jahan')) {
    return `👑 The **Mughal Dynasty** ruled India from **1526 to 1857 CE**, founded by **Babur** after the First Battle of Panipat. The empire reached its cultural zenith under **Akbar the Great**, who championed religious harmony, and **Shah Jahan**, whose patronage gave us the Taj Mahal, Red Fort, and Jama Masjid.\n\nMughal architecture is instantly recognizable — bulbous domes, symmetrical *Charbagh* gardens, red sandstone with white marble inlay.\n\nWant to explore a specific Mughal monument or ruler?`;
  }

  if (q.includes('maurya') || q.includes('ashoka') || q.includes('chandragupta') || q.includes('chanakya')) {
    return `🦁 The **Mauryan Empire (322–185 BCE)** was India's first great unified empire, established by **Chandragupta Maurya** with guidance from **Chanakya**, author of the *Arthashastra*. Its most transformative ruler was **Emperor Ashoka**, who after the devastating Kalinga War, embraced Buddhism and spread *Ahimsa* (non-violence) through edicts across the subcontinent.\n\nThe **Lion Capital of Ashoka** at Sarnath became India's national emblem.\n\nWant to know about Ashoka's edicts or the Sanchi Stupa?`;
  }

  if (q.includes('chola') || q.includes('raja raja')) {
    return `⚓ The **Chola Dynasty (848–1279 CE)** built one of the most powerful maritime empires in Asian history. From Tamil Nadu, they launched **naval expeditions** reaching Sri Lanka, Malaysia, Indonesia, and Cambodia — spreading Indian culture across Southeast Asia.\n\nTheir legacy lives through monumental **Dravidian temples** and the art of **lost-wax bronze casting** — most famously the iconic **Nataraja**.\n\nShall I tell you about the Brihadeeswara Temple or Chola maritime trade?`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SMART CONTEXTUAL FALLBACK
  // ══════════════════════════════════════════════════════════════════════════
  if (activeEntity) {
    return `I see you're asking about **${activeEntity.name}** — a fascinating site built around **${activeEntity.built}** by **${activeEntity.builders}**.\n\nI can tell you about its **architecture**, **sculptures**, **inscriptions**, **history**, or share **travel tips** for visiting. Just let me know what interests you most, or ask something specific like "how old is it?" or "tell me about the carvings."\n\nWhat would you like to explore?`;
  }

  return `That's an interesting question! I'd love to help you explore it. Could you mention a specific **monument** (like Taj Mahal, Khajuraho, Hampi), **dynasty** (Mughal, Chola, Maurya), **festival** (Diwali, Holi), or **art form** (Bharatnatyam, Madhubani)?\n\nYou can also try questions like "Tell me about the Konark Sun Temple" or "Who built the Red Fort?" — I'll walk you through everything in detail!`;
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


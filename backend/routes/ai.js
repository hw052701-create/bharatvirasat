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
function getFallbackChat(message, history = [], userName = 'Explorer') {
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

  // ── Comprehensive Heritage Entity Knowledge Base ──
  const entities = [
    {
      key: 'red_fort',
      name: 'Red Fort (Lal Qila)',
      match: ['red fort', 'lal qila', 'redfort', 'lal kila', 'delhi fort'],
      built: '1638–1648 CE',
      age: 378,
      builders: 'Mughal Emperor Shah Jahan (with architects Ustad Ahmad and Ustad Hamid)',
      city: 'Old Delhi (Shahjahanabad)',
      details: 'Built from red sandstone, featuring the Lahori Gate, Diwan-i-Aam, and the marble Diwan-i-Khas which once held the fabled Peacock Throne.',
      inscriptions: 'The famous golden Persian couplet by Amir Khusrau on the Diwan-i-Khas marble archway: "If there is paradise on earth, it is this, it is this, it is this."',
      architecture: 'Indo-Islamic octagonal fortress with 2-kilometer red sandstone battlements, water-cooled marble palaces, and Charbagh gardens along the Yamuna.'
    },
    {
      key: 'taj',
      name: 'Taj Mahal',
      match: ['taj mahal', 'taj', 'mumtaz', 'shah jahan', 'agra'],
      built: '1631–1653 CE',
      age: 373,
      builders: 'Mughal Emperor Shah Jahan (with master architect Ustad Ahmad Lahori)',
      city: 'Agra, Uttar Pradesh',
      details: 'Commissioned as a mausoleum of eternal love for Empress Mumtaz Mahal, crafted by over 20,000 artisans from white Makrana marble and 28 varieties of semi-precious gems.',
      inscriptions: '22 Quranic Surahs inscribed in Thuluth calligraphy by Amanat Khan in black jasper, optically scaled so the script looks uniform from the ground.',
      architecture: 'Masterpiece of bilateral symmetry with a 73m double dome, 4 outward-tilting minarets, and moisture-retaining ebony wood well foundations.'
    },
    {
      key: 'khajuraho',
      name: 'Khajuraho Temples',
      match: ['khajuraho', 'chandela', 'kandariya', 'chhatarpur', 'lakshmana temple', 'visvanatha'],
      built: '950–1050 CE',
      age: 1000,
      builders: 'Chandela Rajput Dynasty (Kings Yashovarman, Dhanga, and Vidyadhara)',
      city: 'Chhatarpur, Madhya Pradesh',
      details: 'Sublime Nagara-style sandstone temples celebrating the four Purusharthas (Dharma, Artha, Kama, Moksha), with the towering Kandariya Mahadeva as the crown jewel.',
      inscriptions: 'Sanskrit inscriptions in northern Kutila (early Nagari) script on Lakshmana (954 CE) and Visvanatha (1002 CE) temple plinths detailing Chandela genealogy.',
      architecture: 'Panchayatana layout elevated on a high Jagati terrace with rhythmic clusters of mini-spires (Urushringas) symbolizing Mount Meru.'
    },
    {
      key: 'qutub',
      name: 'Qutub Minar Complex',
      match: ['qutub', 'qutb', 'iron pillar', 'mehrauli'],
      built: '1193 CE',
      age: 833,
      builders: 'Qutb-ud-din Aibak & Shams-ud-din Iltutmish',
      city: 'Mehrauli, New Delhi',
      details: 'The world\'s tallest brick minaret at 72.5 meters with five tapered fluted storeys, alongside the 1,600-year-old rust-resistant Iron Pillar.',
      inscriptions: 'Arabic and Nagari inscriptions on minaret bands, and a 4th-century Gupta Brahmi Sanskrit eulogy to King Chandra on the Iron Pillar.',
      architecture: 'Fluted red sandstone and white marble storeys with stalactite-bracketed balconies and Indo-Islamic geometric carvings.'
    },
    {
      key: 'hampi',
      name: 'Hampi (Vijayanagara Empire)',
      match: ['hampi', 'vijayanagara', 'vittala', 'stone chariot', 'virupaksha', 'krishnadevaraya', 'tungabhadra'],
      built: '1336 CE (14th century)',
      age: 650,
      builders: 'Vijayanagara Empire (Brothers Harihara & Bukka, Emperor Krishnadevaraya)',
      city: 'Vijayanagara district, Karnataka',
      details: 'Capital of South India\'s wealthiest empire, featuring over 1,600 monuments, the iconic Stone Chariot, and open-air diamond and gem bazaars.',
      inscriptions: 'Kannada, Telugu, and Sanskrit inscriptions across temple basements recording royal endowments and international maritime trade.',
      architecture: 'Dravidian granite architecture with 56 musical SaReGaMa resonant pillars and majestic multi-tiered Gopurams along the Tungabhadra river.'
    },
    {
      key: 'ajanta',
      name: 'Ajanta Caves',
      match: ['ajanta', 'cave 1', 'padmapani', 'frescoes', 'waghora'],
      built: '2nd century BCE to 5th century CE',
      age: 2200,
      builders: 'Satavahana & Vakataka dynasties (Buddhist monks & guild artists)',
      city: 'Aurangabad district, Maharashtra',
      details: '30 rock-cut Buddhist chaityas and viharas inside a horseshoe canyon, containing ancient India\'s greatest surviving mural paintings.',
      inscriptions: 'Brahmi and Sanskrit donor inscriptions recording offerings by royal patrons, monks, and merchants.',
      architecture: 'Rock-cut basalt prayer halls with arched Chaitya windows, ribbed ceilings, and natural tempera murals illuminated by mirrored daylight.'
    },
    {
      key: 'ellora',
      name: 'Ellora Caves & Kailasa Temple',
      match: ['ellora', 'kailasa', 'rashtrakuta', 'cave 16', 'krishna i'],
      built: '8th century CE',
      age: 1250,
      builders: 'Rashtrakuta Dynasty (King Krishna I and master architect Kokasa)',
      city: 'Aurangabad district, Maharashtra',
      details: '34 rock-cut temples uniting Hindu, Buddhist, and Jain traditions. Cave 16 (Kailasa) is the world\'s largest monolithic excavation from a single volcanic cliff.',
      inscriptions: 'Rashtrakuta and Yadava inscriptions commemorating royal lineage and the dedication of sacred Shiva sanctums.',
      architecture: 'Top-down monolithic excavation of 200,000 tonnes of solid basalt rock, featuring multi-story pillared courtyards and life-sized carved elephants.'
    },
    {
      key: 'konark',
      name: 'Konark Sun Temple',
      match: ['konark', 'sun temple', 'narasimhadeva', 'black pagoda', 'chandrabhaga'],
      built: '1250 CE',
      age: 776,
      builders: 'King Langula Narasimhadeva I of the Eastern Ganga Dynasty',
      city: 'Puri district, Odisha',
      details: 'Designed as a colossal chariot for Surya the Sun God, with 24 carved stone wheels that function as precise astronomical sundials.',
      inscriptions: 'Odia and Sanskrit palm-leaf chronicles (Madala Panji) and temple plinth inscriptions detailing 12 years of construction under Bisu Maharana.',
      architecture: 'Kalinga-style architecture crafted from Chlorite and Khondalite stone, with 24 sundial wheels and 7 galloping horses.'
    },
    {
      key: 'brihadeeswara',
      name: 'Brihadeeswara Temple',
      match: ['brihadeeswara', 'thanjavur', 'chola', 'raja raja', 'tanjore', 'peruvudaiyar'],
      built: '1010 CE',
      age: 1016,
      builders: 'Emperor Raja Raja Chola I of the Chola Empire',
      city: 'Thanjavur, Tamil Nadu',
      details: 'A towering 66-meter granite sanctuary topped with an 80-tonne monolithic dome raised without mortar, celebrating imperial Chola naval supremacy.',
      inscriptions: 'Extensive Tamil and Grantha inscriptions covering the granite plinths, meticulously recording 400+ temple dancers, musicians, and village endowments.',
      architecture: 'Interlocking Dravidian granite masonry, square sanctum, and massive Vimana tower that has stood for over a millennium.'
    },
    {
      key: 'meenakshi',
      name: 'Meenakshi Amman Temple',
      match: ['meenakshi', 'madurai', 'sundareswarar'],
      built: '6th century CE (rebuilt 17th century)',
      age: 1400,
      builders: 'Pandya Dynasty kings & Nayak rulers (Thirumalai Nayak)',
      city: 'Madurai, Tamil Nadu',
      details: 'Sacred center of Tamil heritage dedicated to Goddess Meenakshi and Lord Sundareswarar, with 14 multi-colored towering Gopurams and the Hall of 1,000 Pillars.',
      inscriptions: 'Ancient Tamil inscriptions chronicling royal Pandya and Nayak benefactions, festivals, and sacred poetic traditions.',
      architecture: 'Dravidian temple city layout with concentric rectangular walls, polychrome sculpted towers, and the sacred Golden Lotus tank (Porthamarai Kulam).'
    },
    {
      key: 'sanchi',
      name: 'Great Stupa at Sanchi',
      match: ['sanchi', 'stupa', 'ashoka', 'torana'],
      built: '3rd century BCE',
      age: 2300,
      builders: 'Mauryan Emperor Ashoka the Great',
      city: 'Raisen district, Madhya Pradesh',
      details: 'Oldest stone structure in India enshrining Buddha\'s relics, flanked by four ornate Torana gateways carved with Jataka tales by ivory guilds.',
      inscriptions: 'Early Brahmi Prakrit edicts of Emperor Ashoka and over 600 donor inscriptions from ordinary citizens and ancient craft guilds.',
      architecture: 'Hemispherical stone dome (Anda) crowned by a triple umbrella (Chhatra) symbolizing the Three Jewels of Buddhism, surrounded by carved Toranas.'
    },
    {
      key: 'rani_ki_vav',
      name: 'Rani ki Vav (Queen\'s Stepwell)',
      match: ['rani ki vav', 'stepwell', 'patan', 'udayamati'],
      built: '1063 CE',
      age: 963,
      builders: 'Queen Udayamati (Chaulukya / Solanki Dynasty)',
      city: 'Patan, Gujarat',
      details: 'An inverted underground stepped temple descending seven levels into the earth, adorned with over 800 exquisite sculptures of Lord Vishnu\'s Dashavatara.',
      inscriptions: 'Mentioned in Merutunga\'s 1304 chronicle *Prabandha Chintamani* commemorating Queen Udayamati\'s memorial for King Bhima I.',
      architecture: 'Maru-Gurjara style subterranean stepped architecture with pillared pavilions, deep wells, and finely carved niche panels.'
    },
    {
      key: 'fatehpur',
      name: 'Fatehpur Sikri',
      match: ['fatehpur', 'buland darwaza', 'akbar', 'salim chishti'],
      built: '1571 CE',
      age: 455,
      builders: 'Mughal Emperor Akbar the Great',
      city: 'Agra district, Uttar Pradesh',
      details: 'Akbar\'s planned imperial capital featuring the 54-meter Buland Darwaza ("Gate of Magnificence") and the serene white marble tomb of Sufi saint Salim Chishti.',
      inscriptions: 'Quranic calligraphy and Persian inscriptions on the Buland Darwaza proclaiming: "The world is a bridge, pass over it, but build no houses upon it."',
      architecture: 'Red sandstone architectural synthesis blending Mughal, Persian, Gujarati, and Rajasthani palace traditions.'
    },
    {
      key: 'golden_temple',
      name: 'Golden Temple (Sri Harmandir Sahib)',
      match: ['golden temple', 'harmandir', 'amritsar', 'darbar sahib'],
      built: '1577 CE',
      age: 449,
      builders: 'Guru Ram Das & Maharaja Ranjit Singh',
      city: 'Amritsar, Punjab',
      details: 'Spiritual center of Sikhism surrounded by the holy Amrit Sarovar, with 4 open doors welcoming all humanity and the world\'s largest free langar kitchen.',
      inscriptions: 'Gurmukhi inscriptions from the Guru Granth Sahib carved in gold leaf along the marble arches and sanctum panels.',
      architecture: 'Harmonious blend of Indo-Islamic and Hindu architectural elements, overlaid with 24-karat pure gold foil.'
    },
    {
      key: 'varanasi',
      name: 'Varanasi (Kashi)',
      match: ['varanasi', 'kashi', 'banaras', 'ghat', 'ganga aarti'],
      built: 'Over 3,000 years ago (11th century BCE)',
      age: 3000,
      builders: 'Ancient sacred civilization & abode of Lord Shiva',
      city: 'Varanasi, Uttar Pradesh',
      details: 'The world\'s oldest living city, famed for its 84 historic stone ghats (Dashashwamedh, Manikarnika), Banarasi silk weaving, and evening Ganga Aarti.',
      inscriptions: 'Ancient stone pillar inscriptions and temple epigraphs recording centuries of pilgrimages, royal grants, and philosophical discourses.',
      architecture: 'Riverfront stone steps, tiered temple shikhars, narrow historic gallis, and sacred ghats hugging the sacred northern bend of the Ganges.'
    }
  ];

  // ── Context Resolution: current query → reverse history lookup ──
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

  // ══════════════════════════════════════════════════════════════════════════
  //  FOLLOW-UP HANDLERS (Context-Aware)
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. How Old / Age / Duration ──
  if (q.includes('how old') || q.includes('how long') || q.includes('age') || q.includes('years old') || q.includes('how ancient') || q.includes('till now') || q.includes('since when') || q.includes('how many year') || (q.includes('long') && q.includes('it'))) {
    if (activeEntity) {
      const centuryStr = activeEntity.age >= 1000 ? `nearly ${Math.round(activeEntity.age / 100)} centuries` : `about ${Math.round(activeEntity.age / 10)} decades`;
      return `⏳ The **${activeEntity.name}** was originally built around **${activeEntity.built}**, which makes it approximately **${activeEntity.age} years old** — that's ${centuryStr} of standing history in ${activeEntity.city}!\n\nDespite the passage of centuries, it remains one of India's most treasured landmarks, protected by the **Archaeological Survey of India (ASI)** and visited by travelers worldwide.\n\nWould you like to know who built it, explore its architecture, or learn about its inscriptions?`;
    }
    return `⏳ India's cultural heritage spans over **5,000 years** of continuous civilization — from the ancient **Indus Valley cities of Harappa and Mohenjo-daro** (3300 BCE) to medieval temple marvels and royal palaces.\n\nWhich specific monument would you like to know the age of? I can share exact dates, builders, and historical context!`;
  }

  // ── 2. Why Was It Built / Purpose / Significance ──
  if (q.includes('why was') || q.includes('why built') || q.includes('purpose') || q.includes('reason') || q.includes('why did') || q.includes('significance') || q.includes('kyun')) {
    if (activeEntity) {
      if (activeEntity.key === 'red_fort') {
        return `🎯 **Why the Red Fort was built**: Mughal Emperor **Shah Jahan** commissioned the Red Fort in **1638 CE** to serve as the fortified residence and political headquarters for his new imperial capital, **Shahjahanabad** (Old Delhi). Agra was deemed too congested and hot, and Delhi offered strategic access to the Yamuna river and imperial trade routes. The fortress was designed to project royal invincibility while housing administrative diwans, royal residences, and garrison troops.`;
      }
      if (activeEntity.key === 'taj') {
        return `🎯 **Why the Taj Mahal was built**: The Taj Mahal was commissioned by Emperor **Shah Jahan** in **1631 CE** as an eternal resting place for his beloved empress **Mumtaz Mahal**, who passed away during the birth of their fourteenth child. Shah Jahan wanted to create a terrestrial representation of the celestial paradise (*Jannat*), where her memory would shine untouched by time.`;
      }
      if (activeEntity.key === 'konark') {
        return `🎯 **Why the Konark Sun Temple was built**: King **Langula Narasimhadeva I** commissioned Konark in **1250 CE** to celebrate his major military victories against medieval invaders and to invoke the cosmic blessings of **Surya, the Sun God**, whose rays were believed to bring health, spiritual vigor, and royal prosperity.`;
      }
      if (activeEntity.key === 'khajuraho') {
        return `🎯 **Why the Khajuraho Temples were built**: The Chandela kings built these temples between **950 and 1050 CE** as grand royal offerings celebrating the four **Purusharthas** (Dharma, Artha, Kama, Moksha). They integrated worldly celebration, royal ceremonies, and spiritual enlightenment into one cohesive architectural universe.`;
      }
      if (activeEntity.key === 'brihadeeswara') {
        return `🎯 **Why the Brihadeeswara Temple was built**: Emperor **Raja Raja Chola I** commissioned it in **1010 CE** to commemorate 25 years of imperial victories, demonstrating the supreme naval, military, and artistic supremacy of the Chola Empire while creating a spiritual home for Lord Shiva as Nataraja.`;
      }
      if (activeEntity.key === 'sanchi') {
        return `🎯 **Why Sanchi Stupa was built**: Following the devastating Kalinga War, Emperor **Ashoka** renounced armed conquest and embraced Buddhism. He built the Great Stupa in the **3rd century BCE** to enshrine sacred relics of **Gautama Buddha** and inspire generations toward non-violence (*Ahimsa*) and moral righteousness (*Dhamma*).`;
      }
      return `🎯 **Why ${activeEntity.name} was built**: ${activeEntity.name} was conceived around **${activeEntity.built}** by **${activeEntity.builders}** as a grand spiritual, royal, and architectural statement, embodying the cultural ideals and engineering triumphs of its era in ${activeEntity.city}.`;
    }
  }

  // ── 3. Who Built It / When Was It Built / History / Dynasties / Founders ──
  if (q.includes('who built') || q.includes('who made') || q.includes('who create') || q.includes('who construct') || q.includes('builder') || q.includes('when was') || q.includes('when is it') || q.includes('history of') || q.includes('founder') || q.includes('dynasty') || q.includes('ruler') || q.includes('king') || q.includes('emperor') || (q.includes('built') && (q.includes('it') || q.includes('this') || q.includes('when') || q.includes('who')))) {
    if (activeEntity) {
      if (activeEntity.key === 'red_fort') {
        return `👑 The **Red Fort (Lal Qila)** was commissioned between **1638 and 1648 CE** by Mughal Emperor **Shah Jahan** when he relocated the imperial capital from Agra to the newly planned city of **Shahjahanabad** (Old Delhi).\n\nChief court architects **Ustad Ahmad** and **Ustad Hamid** oversaw the 10-year construction using Rajasthan red sandstone. Within its fortified walls, the Emperor held court in the marble *Diwan-i-Khas*, seated upon the fabled **Peacock Throne**.\n\nWould you like to know about its architecture, famous Persian inscriptions, or how to visit?`;
      }
      if (activeEntity.key === 'taj') {
        return `👑 The **Taj Mahal** was commissioned in **1631 CE** by Mughal Emperor **Shah Jahan** as a mausoleum of eternal devotion for his beloved empress **Mumtaz Mahal**.\n\nIt took approximately **22 years** (completed in 1653 CE) and more than **20,000 master artisans** under chief architect **Ustad Ahmad Lahori** to create this white Makrana marble masterpiece.\n\nShall I tell you about its optical calligraphy inscriptions, architecture, or visiting tips?`;
      }
      if (activeEntity.key === 'khajuraho') {
        return `👑 The **Khajuraho Temples** were built by the **Chandela Rajput Dynasty** between **950 and 1050 CE** at their sacred religious capital in Bundelkhand.\n\nKey royal patrons included **King Yashovarman** (who built Lakshmana Temple), **King Dhanga** (Visvanatha Temple), and **King Vidyadhara** (the monumental Kandariya Mahadeva Temple). Of the original 85 temples, **25 survive today**.\n\nWould you like to explore their sculptures or architecture?`;
      }
      if (activeEntity.key === 'qutub') {
        return `👑 The **Qutub Minar** was founded in **1193 CE** by **Qutb-ud-din Aibak**, founder of the Delhi Sultanate, and expanded by his successor **Shams-ud-din Iltutmish** who completed the top storeys.\n\nLater repairs and additions were made by Sultan Firoz Shah Tughlaq and Sikandar Lodi. The complex also houses the **1,600-year-old Iron Pillar** erected during the reign of Chandragupta II Vikramaditya.\n\nWould you like to know about its inscriptions or architectural design?`;
      }
      if (activeEntity.key === 'brihadeeswara') {
        return `👑 The **Brihadeeswara Temple** was built in **1010 CE** by the great Emperor **Raja Raja Chola I** to mark 25 victorious years of imperial Chola rule across South India and the seas.\n\nEngineers hauled an **80-tonne granite dome** to the top of the 66-meter tower using an inclined earth ramp stretching nearly 6 kilometers, constructing the entire temple without mortar.\n\nShall I tell you about its Tamil inscriptions or Chola bronze art?`;
      }
      return `👑 **${activeEntity.name}** was built around **${activeEntity.built}** by **${activeEntity.builders}** in **${activeEntity.city}**.\n\nIt has stood for approximately **${activeEntity.age} years** as an enduring testament to India's extraordinary architectural and cultural genius.\n\nWould you like to know more about its architecture, inscriptions, or history?`;
    }
    return `👑 India's historic monuments were built by legendary dynasties — from the **Mauryas** (Emperor Ashoka) and **Guptas**, to the **Cholas**, **Chandelas**, **Rashtrakutas**, **Vijayanagara Emperors**, and the **Mughals**.\n\nWhich specific monument or ruler would you like to explore?`;
  }

  // ── 4. Materials / Stones / Construction ──
  if (q.includes('material') || q.includes('stone') || q.includes('marble') || q.includes('granite') || q.includes('sandstone') || q.includes('what is it made') || q.includes('made of') || q.includes('kisse bana')) {
    if (activeEntity) {
      if (activeEntity.key === 'red_fort') {
        return `🧱 **Materials of the Red Fort**: The massive outer walls and main pavilions are built from rich red **sandstone** quarried from Rajasthan. Key royal chambers like the *Diwan-i-Khas*, *Khas Mahal*, and *Rang Mahal* feature pure white **Makrana marble** floors, pillars, and arches, originally decorated with gilded ceilings and floral inlay.`;
      }
      if (activeEntity.key === 'taj') {
        return `🧱 **Materials of the Taj Mahal**: The mausoleum is constructed of pristine white **Makrana marble** from Rajasthan that reflects sunlight and moonlight. It is inlaid with **28 varieties of semi-precious stones** (lapis lazuli, carnelian, jade, jasper, crystal) using the delicate *pietra dura* (*Parchin Kari*) technique, set upon a foundation of subterranean ebony wood wells.`;
      }
      if (activeEntity.key === 'brihadeeswara') {
        return `🧱 **Materials of Brihadeeswara Temple**: The entire temple is made of **130,000 tonnes of granite**, quarried over 50 km away. Granite is one of the hardest stones to carve, yet Chola sculptors cut and interlocked every block without mortar, hoisting a single **80-tonne granite dome** to the apex.`;
      }
      if (activeEntity.key === 'ellora' || activeEntity.key === 'kailasa') {
        return `🧱 **Materials of Kailasa Temple**: Kailasa is not constructed with stone blocks — it is carved directly out of **solid volcanic basalt rock** (Deccan Trap). Over **200,000 tonnes of basalt** were excavated top-to-bottom from a single mountain cliff face.`;
      }
      if (activeEntity.key === 'konark') {
        return `🧱 **Materials of Konark Sun Temple**: Built using three distinct stones: green **Chlorite stone** for the sanctum doorframes and deities, **Khondalite** for the massive structural walls and 24 chariot wheels, and heavy **Laterite** for the base plinths.`;
      }
      if (activeEntity.key === 'khajuraho') {
        return `🧱 **Materials of Khajuraho**: Crafted from warm, golden-buff **sandstone** brought from the quarries of Panna. The fine-grained sandstone allowed master artisans to carve extraordinarily intricate, lifelike anatomical details.`;
      }
      return `🧱 **Materials used for ${activeEntity.name}**: ${activeEntity.name} was constructed using specialized regional stone, masonry, and architectural techniques suited to its ${activeEntity.architecture}.`;
    }
  }

  // ── 5. Gates / Entrances / Halls / Inside Layout ──
  if (q.includes('gate') || q.includes('entrance') || q.includes('darwaza') || q.includes('gopuram') || q.includes('inside') || q.includes('hall') || q.includes('room') || q.includes('layout') || q.includes('mandapa')) {
    if (activeEntity) {
      if (activeEntity.key === 'red_fort') {
        return `🚪 **Gates & Layout of the Red Fort**:\n\n• **Lahori Gate:** The grand primary western entrance, facing Chandni Chowk, where the Prime Minister addresses the nation on Independence Day.\n• **Delhi Gate:** The southern public entrance decorated with stone elephants.\n• **Inside Halls:** The *Chhatta Chowk* (covered bazaar), *Naubat Khana* (drum house), *Diwan-i-Aam* (Hall of Public Audience with marble canopy), *Diwan-i-Khas* (Hall of Private Audience where the Peacock Throne stood), and the *Nahr-i-Bihisht* (water canal of paradise).`;
      }
      if (activeEntity.key === 'taj') {
        return `🚪 **Gates & Layout of the Taj Mahal**:\n\n• **Darwaza-i-Rauza (Great Gate):** The monumental red sandstone entrance with 11 chhatris and Quranic calligraphy.\n• **Charbagh Garden:** Symmetrical quadripartite garden divided into 16 flowerbeds with central marble water channels.\n• **The Central Tomb:** Octagonal inner chamber holding the cenotaphs of Mumtaz Mahal and Shah Jahan, flanked by an operational red sandstone **Mosque** on the west and an identical **Jawab** (assembly hall) on the east.`;
      }
      if (activeEntity.key === 'sanchi') {
        return `🚪 **Gates of Sanchi Stupa**: The Stupa is enclosed by a stone railing (*Vedika*) punctuated by **four magnificent carved Torana gateways** facing North, South, East, and West. Each 34-foot gateway features three horizontal architraves depicting Buddha's life, Jataka tales, elephants, and Yakshis.`;
      }
      if (activeEntity.key === 'golden_temple') {
        return `🚪 **Entrances of the Golden Temple**: Uniquely designed with **four open entrances** facing the four cardinal directions, demonstrating the core Sikh philosophy that all human beings—regardless of caste, religion, or background—are equally welcome.`;
      }
      return `🚪 **Entrances & Layout of ${activeEntity.name}**: ${activeEntity.name} features an organized layout designed in the classical traditions of its era in ${activeEntity.city}.`;
    }
  }

  // ── 6. Throne / Peacock Throne / Koh-i-Noor ──
  if (q.includes('throne') || q.includes('peacock') || q.includes('kohinoor') || q.includes('koh-i-noor') || q.includes('takht')) {
    return `👑 **The Legendary Peacock Throne (*Takht-i-Taus*)**:\n\nCommissioned by Mughal Emperor **Shah Jahan** in **1635 CE**, the Peacock Throne was one of the most lavish royal seats in world history. Housed inside the Red Fort's marble *Diwan-i-Khas*, it was crafted from solid gold, supported by golden pillars, and encrusted with hundreds of rubies, emeralds, pearls, and the legendary **Koh-i-Noor diamond**.\n\nIn **1739 CE**, Persian emperor **Nadir Shah** invaded Delhi, sacked the city, and took the Peacock Throne and the Koh-i-Noor diamond back to Persia.`;
  }

  // ── 7. Inscriptions & Epigraphy ──
  if (q.includes('inscription') || q.includes('script') || q.includes('epigraph') || q.includes('writing') || q.includes('written') || q.includes('language') || q.includes('engrav')) {
    if (activeEntity) {
      return `📜 The inscriptions of **${activeEntity.name}** hold great historical significance:\n\n${activeEntity.inscriptions}\n\nThese epigraphs offer a direct window into the royal courts, spiritual philosophy, and artistic dedication of ancient India.\n\nWould you like to know about who built it, its architecture, or folklore?`;
    }
    return `📜 India is home to over **100,000 historical inscriptions** on stone plinths, pillars, and copper plates (*Tamrapatra*) — including the 3rd-century BCE **Ashokan Edicts** in Brahmi and Kharosthi, royal Chola Tamil chronicles, and exquisite Mughal Thuluth calligraphy.\n\nWhich monument's inscriptions would you like to dive into?`;
  }

  // ── 8. Sculptures, Murals & Art ──
  if (q.includes('sculpture') || q.includes('carving') || q.includes('statue') || q.includes('erotic') || q.includes('mural') || q.includes('painting') || q.includes('mithuna') || q.includes('art')) {
    if (activeEntity && activeEntity.key === 'khajuraho') {
      return `🎨 Contrary to common belief, only about **10% of Khajuraho's sculptures are erotic** (*Mithuna*). The remaining 90% vividly depict medieval daily life — musicians, warriors, cosmic deities, and celestial maidens (*Apsaras*) applying makeup or removing thorns from their feet.\n\nPhilosophically, they embody the four **Purusharthas** (goals of life): *Dharma*, *Artha*, *Kama*, and *Moksha*, carved with lifelike anatomical grace from golden sandstone.\n\nWould you like to know who built them or explore the temple architecture?`;
    }
    if (activeEntity && activeEntity.key === 'ajanta') {
      return `🎨 The **Ajanta Cave murals** represent the golden age of ancient Indian painting. The most famous is the **Bodhisattva Padmapani** in Cave 1 — depicting a serene, lotus-bearing figure whose compassionate gaze has captivated the world for over 1,500 years.\n\nMonk artists used natural mineral pigments like crushed lapis lazuli and red ochre, painting on mud-plastered rock using a *tempera fresco* technique.\n\nShall I tell you about the rock-cut architecture or the Ellora Caves?`;
    }
    if (activeEntity) {
      return `🎨 The artwork at **${activeEntity.name}** is a masterclass in craftsmanship: ${activeEntity.details}\n\nEvery carved stone and fresco was designed according to sacred proportion and cosmic balance.\n\nWould you like to know about its history, builders, or visiting guide?`;
    }
  }

  // ── 9. Architecture & Engineering Styles ──
  if (q.includes('nagara') || q.includes('dravidian') || q.includes('vesara') || q.includes('indo-islamic') || q.includes('architecture style')) {
    return `🏛️ **Major Indian Architectural Styles**:\n\n• **Nagara Style (North India):** Characterized by beehive-curved spires called *Shikharas*, cruciform layouts, and elevated stone terraces (*Jagati*), seen in Khajuraho, Konark, and Dilwara.\n• **Dravidian Style (South India):** Features monumental multi-tiered gateway towers (*Gopurams*), square-stepped sanctums (*Vimanas*), and pillared *Mandapa* halls, seen in Brihadeeswara and Meenakshi.\n• **Vesara Style (Central/Deccan):** A harmonious hybrid blending Nagara spires with Dravidian layouts, developed by the Chalukyas and Hoysalas.\n• **Indo-Islamic Style:** Combines Islamic symmetry, arches, and bulbous double domes with Indian sandstone craftsmanship and intricate jali stonework, seen in the Taj Mahal and Red Fort.`;
  }

  if (q.includes('architecture') || q.includes('design') || q.includes('engineering') || q.includes('how was it built') || q.includes('style') || q.includes('height') || q.includes('structure')) {
    if (activeEntity) {
      return `🏛️ **${activeEntity.name}** is renowned for its architectural excellence:\n\n${activeEntity.architecture}\n\nBuilt around **${activeEntity.built}**, its structural harmony and enduring resilience continue to astonish modern architects and engineers.\n\nWould you like to know who built it, explore its inscriptions, or learn travel tips?`;
    }
    return `🏛️ India features diverse architectural traditions — from the soaring shikharas of **Nagara style** in the North, to the massive granite gopurams of **Dravidian style** in the South, and the symmetrical domes of **Indo-Islamic architecture**.\n\nWhich monument's architecture would you like to discover?`;
  }

  // ── 10. Ancient Civilizations & Eras ──
  if (q.includes('indus valley') || q.includes('harappa') || q.includes('mohenjo')) {
    return `🏺 **The Indus Valley (Harappan) Civilization (3300–1300 BCE)**:\n\nOne of the ancient world's three earliest cradles of civilization alongside Egypt and Mesopotamia. Notable for:\n• **Urban Planning:** Grid-pattern streets, multi-story brick houses, and sophisticated covered drainage networks.\n• **Key Sites:** Harappa, Mohenjo-daro (The Great Bath), Dholavira (water harvesting reservoirs), and Lothal (the world's earliest known tidal dockyard).\n• **Art & Craft:** Steatite seals, terracotta toys, and the iconic lost-wax **Bronze Dancing Girl**.`;
  }

  if (q.includes('gupta') || q.includes('golden age')) {
    return `🌟 **The Gupta Empire (320–550 CE) — The Golden Age of India**:\n\nA transformative era of classical achievements in science, mathematics, astronomy, and literature:\n• **Mathematics & Astronomy:** Aryabhata calculated the value of Pi (π), planetary orbits, and the concept of zero (*Shunya*).\n• **Literature & Art:** Sanskrit poet Kalidasa (*Shakuntala*, *Meghaduta*), Ajanta cave murals, and the rust-free Iron Pillar of Delhi.`;
  }

  if (q.includes('stepwell') || q.includes('baoli') || q.includes('vav')) {
    return `💧 **Ancient Indian Stepwells (Baolis & Vavs)**:\n\nStepwells are extraordinary subterranean architectural marvels developed across Gujarat and Rajasthan to preserve precious water in arid climates. They served as public cooling pavilions, traveler sanctuaries, and sacred temples. Famous examples include **Rani ki Vav** in Patan (UNESCO Site) and **Chand Baori** in Abhaneri.`;
  }

  // ── 11. Travel / Visit / Timings ──
  if (q.includes('how to reach') || q.includes('visit') || q.includes('ticket') || q.includes('timing') || q.includes('best time') || q.includes('where is') || q.includes('how to go') || q.includes('travel')) {
    if (activeEntity) {
      return `✈️ **${activeEntity.name}** is located in **${activeEntity.city}**.\n\n• **Best Time to Visit:** October to March when the weather is pleasant.\n• **Preservation:** Maintained by the **Archaeological Survey of India (ASI)**, open generally from sunrise to sunset.\n• **Explorer Tip:** Visit during early morning or late afternoon for the best golden-hour lighting and photography.\n\nWould you like to hear a detailed historical legend about ${activeEntity.name}?`;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  GREETINGS & GENERAL INTRO
  // ══════════════════════════════════════════════════════════════════════════
  if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
    return `🙏 **Namaste, ${userName}!** Welcome to Virasat AI — your personal guide to India's 5,000 years of heritage.\n\nI can guide you through **UNESCO World Heritage Sites**, famous **monuments & temples**, royal **dynasties**, classical **dance & music**, and vibrant **festivals**. You can also ask follow-up questions like "when was it built?" or "tell me about its inscriptions" — I'll remember what we're discussing.\n\nWhat would you like to explore today?`;
  }

  if (q.includes('kaise ho') || q.includes('how are you')) {
    return `🙏 I'm doing great, ${userName}, immersed in India's glorious history! What would you like to discover today — a monument, dynasty, festival, or ancient story?`;
  }

  if (q.includes('who are you') || q.includes('kya ho') || q.includes('kya kar sakte ho') || q.includes('help')) {
    return `🙏 I'm **Virasat AI**, your AI cultural guide on BharatVirasat. I can share in-depth historical knowledge, architectural insights, artisan legends, travel tips, and generate interactive quizzes on any Indian heritage topic!`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRIMARY MONUMENTS (Rich Conversational Paragraphs)
  // ══════════════════════════════════════════════════════════════════════════
  if (q.includes('red fort') || q.includes('lal qila')) {
    return `🏰 The **Red Fort (Lal Qila)** in Old Delhi is one of India's most iconic historic fortresses. Commissioned between **1638 and 1648 CE** by Mughal Emperor **Shah Jahan** when shifting the imperial capital from Agra to Shahjahanabad, its massive red sandstone bastions have guarded Delhi for nearly four centuries.\n\nInside its fortified walls lie exquisite royal halls like the *Diwan-i-Aam* and the marble *Diwan-i-Khas*, which once housed the legendary Peacock Throne. Every year on **15 August (Independence Day)**, the Prime Minister hoists the national tricolor flag from its ramparts.\n\nWould you like to know about who built it, its architecture, or famous Persian inscriptions?`;
  }

  if (q.includes('taj') || q.includes('agra')) {
    return `🏛️ The **Taj Mahal** in Agra is one of the most breathtaking monuments ever created. Commissioned between **1631 and 1653 CE** by Mughal Emperor **Shah Jahan** in memory of his beloved wife **Mumtaz Mahal**, it is a masterpiece of Indo-Islamic symmetry crafted from pristine white **Makrana marble** and inlaid with 28 varieties of semi-precious gems.\n\nRecognized as a **UNESCO World Heritage Site** and one of the New 7 Wonders of the World, it transforms its hues with the heavens — glowing soft rose at dawn and shimmering gold beneath the full moon.\n\nWould you like to know about its optical calligraphy inscriptions, architecture, or who built it?`;
  }

  if (q.includes('khajuraho') || q.includes('chandela')) {
    return `🛕 The **Khajuraho Temples** in Madhya Pradesh are among India's finest architectural treasures. Built between **950 and 1050 CE** by the **Chandela Rajput dynasty**, these sublime **Nagara-style sandstone temples** feature thousands of intricate sculptures celebrating spiritual devotion, cosmic deities, music, dance, and human passion.\n\nThe crown jewel is the towering **Kandariya Mahadeva Temple**, dedicated to Lord Shiva, designed with 84 mini-spires mimicking sacred Mount Kailash.\n\nWould you like to explore their famous sculptures, inscriptions, or history?`;
  }

  if (q.includes('qutub') || q.includes('qutb')) {
    return `🗼 The **Qutub Minar** in Delhi is the world's tallest brick minaret at **72.5 meters**, featuring five fluted red sandstone storeys. Built starting **1193 CE** under **Qutb-ud-din Aibak** and completed by **Iltutmish**, it stands as a landmark of medieval Indo-Islamic architecture.\n\nThe complex also houses the famous **1,600-year-old Iron Pillar** — an ancient metallurgical marvel that has resisted rust for over sixteen centuries.\n\nWould you like to know about its inscriptions or history?`;
  }

  if (q.includes('hampi') || q.includes('vijayanagara')) {
    return `🏛️ **Hampi** in Karnataka was the glorious capital of the **Vijayanagara Empire** (14th–16th centuries). Medieval European and Persian travelers described it as one of the **wealthiest metropolises in the world**, where diamonds and rubies were traded openly in street bazaars.\n\nThe UNESCO site features over **1,600 surviving monuments**, including the iconic **Monolithic Stone Chariot**, the 56 musical resonance pillars of Vittala Temple, and the ancient Virupaksha Temple.\n\nWant to know about who built Hampi, its architecture, or the Vijayanagara dynasty?`;
  }

  if (q.includes('ajanta')) {
    return `🎨 The **Ajanta Caves** in Maharashtra are **30 rock-cut Buddhist temples** dating from the **2nd century BCE to 5th century CE**, carved into a volcanic cliff along the Waghora River. They preserve ancient India's **greatest surviving mural paintings**, including the world-famous *Bodhisattva Padmapani*.\n\nForgotten for centuries under dense forest, they were rediscovered in 1819 by British officer John Smith during a tiger hunt.\n\nWould you like to know about the murals or the nearby Ellora Caves?`;
  }

  if (q.includes('ellora') || q.includes('kailasa')) {
    return `⛰️ The **Ellora Caves** in Maharashtra represent Buddhist, Hindu, and Jain traditions side by side. The undisputed highlight is the **Kailasa Temple (Cave 16)**, the world's largest monolithic rock excavation.\n\nMaster architect Kokasa and Rashtrakuta artisans carved the entire temple **top-down from a basalt cliff**, removing over **200,000 tonnes of solid rock** without scaffolding!\n\nShall I tell you about the Rashtrakuta dynasty or the temple's engineering feats?`;
  }

  if (q.includes('konark') || q.includes('sun temple')) {
    return `☀️ The **Konark Sun Temple** in Odisha, built in **1250 CE** by King **Langula Narasimhadeva I**, is designed as a colossal celestial chariot for the **Sun God Surya** — complete with **24 carved wheels** pulled by 7 galloping horses.\n\nThe wheel spokes function as **precise astronomical sundials** calculating exact time by the sun's shadow down to the minute.\n\nWould you like to hear the legend of child architect Dharmapada or learn about its carvings?`;
  }

  if (q.includes('brihadeeswara') || q.includes('thanjavur') || q.includes('chola')) {
    return `🛕 The **Brihadeeswara Temple** in Thanjavur, built in **1010 CE** by **Raja Raja Chola I**, is an engineering triumph. Built entirely of **interlocking granite without mortar**, its 66-meter Vimana tower is crowned by a single **80-tonne granite dome** hoisted via a 6 km inclined ramp.\n\nIt nurtured classical **Bharatnatyam dance** and Chola lost-wax bronze casting (Nataraja).\n\nWant to explore its Tamil inscriptions or the Chola maritime empire?`;
  }

  if (q.includes('meenakshi') || q.includes('madurai')) {
    return `🌸 The **Meenakshi Amman Temple** in Madurai is a jewel of **Dravidian architecture**, dedicated to Goddess **Meenakshi (Parvati)** and **Sundareswarar (Shiva)**. Its **14 towering Gopurams** are adorned with thousands of hand-painted mythological statues, representing 2,500 years of living Tamil heritage.\n\nWould you like to know about Dravidian architecture or Tamil festivals?`;
  }

  if (q.includes('sanchi') || q.includes('stupa')) {
    return `☸️ The **Great Stupa at Sanchi** in Madhya Pradesh is the **oldest stone structure in India**, commissioned in the **3rd century BCE by Emperor Ashoka** over Buddha's sacred relics. Its four magnificent carved gateways (*Toranas*) depict Jataka tales with astonishing artistic detail.\n\nWould you like to know about Ashoka's Brahmi edicts or the gateway carvings?`;
  }

  if (q.includes('rani ki vav') || q.includes('stepwell')) {
    return `💧 **Rani ki Vav** in Patan, Gujarat, is an inverted underground temple built in **1063 CE** by **Queen Udayamati** in memory of King Bhima I. It descends through **7 terraced levels** adorned with over 800 sculptures of Lord Vishnu's *Dashavatara*.\n\nIt is so celebrated that it is featured on the Indian **₹100 banknote**.\n\nWant to explore Gujarat's other heritage sites?`;
  }

  if (q.includes('varanasi') || q.includes('kashi')) {
    return `🪔 **Varanasi (Kashi)** is one of the world's oldest continuously inhabited cities, nestled along the holy **Ganga** in Uttar Pradesh for over **3,000 years** as the abode of Lord Shiva.\n\nFamous for its **84 historic ghats** (Dashashwamedh, Manikarnika), the evening **Ganga Aarti**, Banarasi silk weaving, and classical music heritage, it is the spiritual heart of India.\n\nWant to know about Kashi Vishwanath Temple or the Ganga Aarti?`;
  }

  // ── Arts, Festivals & Dynasties ──
  if (q.includes('dance') || q.includes('bharatnatyam') || q.includes('kathak')) {
    return `💃 India features **eight classical dance traditions**: **Bharatnatyam** (Tamil Nadu), **Kathak** (North India), **Kathakali** (Kerala), **Odissi** (Odisha), **Kuchipudi** (Andhra), **Manipuri**, **Mohiniyattam**, and **Sattriya** (Assam).\n\nEach dance form weaves ancient Natya Shastra traditions of rhythm, mudras, and divine storytelling.\n\nWould you like to explore a specific dance form in detail?`;
  }

  if (q.includes('festival') || q.includes('diwali') || q.includes('holi')) {
    return `🎉 India's festivals are joyous celebrations of history and devotion! **Diwali** celebrates the victory of light over darkness and Lord Rama's return to Ayodhya. **Holi** marks spring and the divine love of Radha-Krishna. **Durga Puja** in Bengal and **Navratri** in Gujarat celebrate the divine feminine with art and dance.\n\nWhich festival would you like to explore?`;
  }

  if (q.includes('mughal') || q.includes('chola') || q.includes('maurya')) {
    return `👑 India's great empires shaped world history: the **Mauryan Empire** (Ashoka's Ahimsa and Dhamma), the **Chola Empire** (naval expeditions across Southeast Asia and granite temples), and the **Mughal Empire** (Akbar's synthesis and Shah Jahan's marble monuments).\n\nWhich dynasty would you like to dive into?`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SMART CONTEXTUAL FALLBACK (Direct and Helpful, Never Canned)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeEntity) {
    return `🏛️ Regarding **${activeEntity.name}** in ${activeEntity.city}:\n\n${activeEntity.details}\n\nIt was built in **${activeEntity.built}** under **${activeEntity.builders}** and reflects ${activeEntity.architecture}.\n\nWould you like to know more about its history, architectural layout, inscriptions, or travel details?`;
  }

  return `🏛️ That is an interesting query, ${userName}! In Indian heritage and civilization, this relates to the rich tapestry of ancient architecture, royal chronicles, and cultural traditions.\n\nCould you mention which specific monument (like Red Fort, Taj Mahal, Khajuraho, Hampi), dynasty, temple, or festival you have in mind? I'll be glad to give you in-depth historical facts!`;
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


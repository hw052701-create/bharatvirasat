const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth');

const geminiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiKey);

// System prompt for heritage guide context
const SYSTEM_PROMPT = `You are Virasat AI, an expert heritage and culture guide for India. 
You specialize in Indian history, architecture, monuments, festivals, art forms, and cultural traditions.
You are part of BharatVirasat, a platform to help Indians discover and appreciate their heritage.
Respond in a friendly, engaging, and educational way. Keep responses concise (2-3 paragraphs max).
If asked in Hindi or any Indian language, respond in that language.`;

// ─── Built-in Knowledge Base for Instant & Offline/Fallback AI ───────────────────
const HERITAGE_KB = {
  'taj mahal': {
    title: 'Taj Mahal, Agra (Uttar Pradesh)',
    text: `The Taj Mahal is an ivory-white marble mausoleum on the south bank of the Yamuna river in Agra. Commissioned in 1631 by Mughal emperor Shah Jahan to house the tomb of his favorite wife Mumtaz Mahal, it was completed around 1653 with the efforts of over 20,000 artisans.\n\nRegarded as the greatest architectural achievement in the whole range of Indo-Islamic architecture, it represents universal admiration as a UNESCO World Heritage Site. Best time to visit is from October to March during sunrise or under the full moon.`
  },
  'red fort': {
    title: 'Red Fort (Lal Qila), Delhi',
    text: `The Red Fort was commissioned by Emperor Shah Jahan in 1638 when he decided to shift his capital from Agra to Delhi. Built of red sandstone, it represents the zenith in Mughal creativity and architecture under Shah Jahan.\n\nEvery year on India's Independence Day (15 August), the Prime Minister hoists the national flag and addresses the nation from the ramparts of the Lahori Gate.`
  },
  'hampi': {
    title: 'Hampi, Karnataka',
    text: `Hampi was the capital of the Vijayanagara Empire in the 14th century. Located in northern Karnataka along the Tungabhadra River, it was one of the world's richest cities in its golden age, visited by Persian and Portuguese traders.\n\nThe UNESCO World Heritage complex features over 1,600 monuments, including the iconic Stone Chariot at the Vijaya Vittala Temple, Virupaksha Temple, and giant monolithic statues.`
  },
  'ajanta': {
    title: 'Ajanta Caves, Maharashtra',
    text: `The Ajanta Caves are approximately 30 rock-cut Buddhist cave monuments dating from the 2nd century BCE to about 480 CE in Aurangabad, Maharashtra. The caves include paintings and rock-cut sculptures described as among the finest surviving examples of ancient Indian art.\n\nThey depict Buddhist deities, Jataka tales, and scenes of courtly life, created under the patronage of the Satavahana and Vakataka dynasties.`
  },
  'ellora': {
    title: 'Ellora Caves, Maharashtra',
    text: `Ellora features 100 caves excavated out of the vertical basalt cliffs of the Charanandri hills, representing Buddhist, Hindu, and Jain traditions living in harmony. Cave 16 houses the legendary Kailasa Temple—the largest single monolithic rock excavation in the world, carved top-down from a single rock face.`
  },
  'konark': {
    title: 'Konark Sun Temple, Odisha',
    text: `Built in 1250 CE by King Narasimhadeva I of the Eastern Ganga Dynasty, the Konark Sun Temple is designed as a colossal chariot for the Sun God Surya, complete with 24 intricately carved stone wheels drawn by 7 horses. The wheels function as precise sundials calculating time to the minute.`
  }
};

function getFallbackChat(message) {
  const q = message.toLowerCase().trim();

  // 1. Greetings & System Capabilities
  if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
    return `🙏 **Namaste! I am Virasat AI (विरासत AI)**, your expert companion for Indian heritage, culture, and history.\n\nI can help you discover:\n• **42+ UNESCO World Heritage Sites** & ASI protected monuments across India\n• **Royal Dynasties** (Mughal, Chola, Maurya, Gupta, Vijayanagara, Maratha)\n• **Classical Dance & Music** (Bharatnatyam, Kathak, Carnatic, Hindustani)\n• **Living Festivals** (Diwali, Holi, Navratri, Durga Puja, Pongal, Onam)\n• **Ancient Temple Architecture** (Nagara, Dravidian, Vesara styles)\n\nWhat would you like to explore today?`;
  }

  if (q.includes('kaise ho') || q.includes('how are you')) {
    return `🙏 **Namaste! I am doing wonderful**, immersed in India's timeless heritage. How can I guide your journey into India's history or culture today?`;
  }

  if (q.includes('who are you') || q.includes('kya ho') || q.includes('kya kar sakte ho') || q.includes('help')) {
    return `🙏 **I am Virasat AI**, an AI cultural guide developed for BharatVirasat. I can answer historical queries, summarize monuments, generate ancient legends, provide travel tips, and host interactive quizzes on any Indian heritage topic!`;
  }

  // 2. Iconic Monuments (North India)
  if (q.includes('taj') || q.includes('agra')) {
    return `🏛️ **Taj Mahal, Agra (Uttar Pradesh)**\n\n• **Commissioned:** 1631–1653 CE by Emperor Shah Jahan in memory of his favorite empress, Mumtaz Mahal.\n• **Architecture:** Masterpiece of Indo-Islamic symmetry built using pristine white Makrana marble from Rajasthan, inlaid with semi-precious pietra dura gems.\n• **Significance:** UNESCO World Heritage Site and one of the New 7 Wonders of the World.\n• **Visiting Tip:** Sunrise or full-moon nights offer breathtaking golden and pearl-white reflections along the Yamuna river.`;
  }

  if (q.includes('red fort') || q.includes('lal qila')) {
    return `🏰 **Red Fort (Lal Qila), Delhi**\n\n• **Commissioned:** 1638–1648 CE by Emperor Shah Jahan when shifting the Mughal capital to Shahjahanabad (Old Delhi).\n• **Highlights:** Built of red sandstone featuring the Lahori Gate, Diwan-i-Aam (Hall of Public Audience), and the exquisite marble Diwan-i-Khas.\n• **National Symbol:** Every year on 15 August (Independence Day), the Prime Minister of India hoists the tricolor flag and addresses the nation from its ramparts.`;
  }

  if (q.includes('qutub minar') || q.includes('qutb')) {
    return `🗼 **Qutub Minar Complex, Delhi**\n\n• **Built:** Started in 1193 CE by Qutb-ud-din Aibak and completed by Shams-ud-din Iltutmish.\n• **Architecture:** World's tallest brick minaret at 72.5 meters (238 feet), with five distinct tapering storeys of fluted red sandstone.\n• **Wonder:** The complex houses the 1,600-year-old **Iron Pillar of Delhi**, famed worldwide for its ancient rust-resistant metallurgy.`;
  }

  if (q.includes('fatehpur') || q.includes('buland darwaza')) {
    return `🚪 **Fatehpur Sikri & Buland Darwaza, Uttar Pradesh**\n\n• **Built:** Founded in 1571 CE by Emperor Akbar as his capital city.\n• **Buland Darwaza:** The 54-meter high "Gate of Magnificence" erected in 1601 to celebrate Akbar's military victory over Gujarat.\n• **Sanctuary:** Houses the serene white marble Tomb of Sufi saint Sheikh Salim Chishti.`;
  }

  if (q.includes('varanasi') || q.includes('kashi') || q.includes('banaras') || q.includes('ghat')) {
    return `🪔 **Varanasi (Kashi), Uttar Pradesh**\n\n• **Heritage:** One of the oldest continuously inhabited sacred cities in world history, nestled along the holy Ganges.\n• **Highlights:** Over 84 historic ghats including Dashashwamedh Ghat (famous for the evening Ganga Aarti) and Manikarnika Ghat.\n• **Culture:** Spiritual heart of Shaivism (Kashi Vishwanath Temple), world-renowned Banarasi silk weaving, and Hindustani classical music traditions.`;
  }

  if (q.includes('golden temple') || q.includes('harmandir') || q.includes('amritsar')) {
    return `✨ **Golden Temple (Sri Harmandir Sahib), Amritsar**\n\n• **Founded:** 1577 CE by Guru Ram Das, the fourth Sikh Guru; marble sanctum overlaid with pure 24-karat gold foil by Maharaja Ranjit Singh in 1830.\n• **Architecture:** Features four open entrances symbolizing universal welcoming for all castes and creeds.\n• **Langar:** Serves free nutritious meals to over 100,000 pilgrims every single day in the world's largest community kitchen.`;
  }

  // 3. West & Central India
  if (q.includes('ajanta')) {
    return `🎨 **Ajanta Caves, Maharashtra**\n\n• **Era:** 2nd century BCE to 5th century CE, carved into a horseshoe cliff along the Waghora River.\n• **Artistry:** 30 rock-cut Buddhist prayer halls (Chaityas) and monasteries (Viharas) containing ancient masterpiece mural frescoes depicting the Jataka tales.\n• **Significance:** Ancient Indian painting pinnacle preserved for over two millennia.`;
  }

  if (q.includes('ellora') || q.includes('kailasa')) {
    return `⛰️ **Ellora Caves & Kailasa Temple, Maharashtra**\n\n• **Harmony:** 100 rock-cut caves carved by Rashtrakuta and Yadava kings representing Buddhist, Hindu, and Jain traditions side by side.\n• **Kailasa Temple (Cave 16):** The world's largest single monolithic rock excavation, carved top-to-bottom from a basalt cliff without scaffolding, removing over 200,000 tonnes of rock!`;
  }

  if (q.includes('khajuraho') || q.includes('chandela')) {
    return `🛕 **Khajuraho Temples, Madhya Pradesh**\n\n• **Built:** 950–1050 CE under the Chandela dynasty.\n• **Architecture:** Sublime Nagara-style sandstone temples featuring intricate sculptures celebrating spiritual devotion, cosmic deities, music, dance, and human passion.\n• **Crown Jewel:** The towering Kandariya Mahadeva Temple dedicated to Lord Shiva.`;
  }

  if (q.includes('sanchi') || q.includes('stupa')) {
    return `☸️ **Great Stupa at Sanchi, Madhya Pradesh**\n\n• **Commissioned:** 3rd century BCE by Emperor Ashoka the Great over the holy relics of the Buddha.\n• **Toranas:** Four intricately sculpted ornamental gateways oriented to the cardinal directions depicting Buddha's life and enlightenment.\n• **Significance:** The oldest stone structure in India and a supreme milestone of Buddhist art.`;
  }

  if (q.includes('rani ki vav') || q.includes('patan') || q.includes('stepwell')) {
    return `💧 **Rani ki Vav (Queen's Stepwell), Patan (Gujarat)**\n\n• **Built:** 11th century CE by Queen Udayamati in memory of King Bhima I of the Chaulukya dynasty.\n• **Design:** An inverted underground subterranean temple with 7 terraced levels featuring more than 500 principal sculptures dedicated to Lord Vishnu in his Dashavatara forms.`;
  }

  if (q.includes('jaipur') || q.includes('amer') || q.includes('hawa mahal') || q.includes('rajasthan')) {
    return `👑 **Rajasthan Heritage & Royal Forts**\n\n• **Jaipur (Pink City):** UNESCO World Heritage city founded in 1727 by Maharaja Sawai Jai Singh II with grid planning and Hawa Mahal (Palace of Winds).\n• **Hill Forts of Rajasthan:** Amer, Kumbhalgarh (world's 2nd longest wall), Chittorgarh, Mehrangarh, and Jaisalmer Fort.\n• **Living Heritage:** Famed for vibrant block-print textiles, puppet kathputli arts, Rajput hospitality, and desert music.`;
  }

  // 4. South India
  if (q.includes('hampi') || q.includes('vijayanagara')) {
    return `🏛️ **Hampi & Vijayanagara Empire, Karnataka**\n\n• **Golden Age:** Capital of the Vijayanagara Empire (14th–16th century CE), described by medieval Portuguese and Persian travelers as one of the world's wealthiest capitals.\n• **Monuments:** Vittala Temple with the iconic monolithic **Stone Chariot** and musical pillars, Virupaksha Temple, and royal elephant stables.\n• **Landscape:** Surreal boulder-strewn terrain flanking the holy Tungabhadra river.`;
  }

  if (q.includes('brihadeeswara') || q.includes('thanjavur') || q.includes('tanjore') || q.includes('chola')) {
    return `🛕 **Brihadeeswara Temple (Peruvudaiyar Kovil), Thanjavur**\n\n• **Built:** 1010 CE by Emperor Raja Raja Chola I to mark Chola imperial supremacy.\n• **Engineering Marvel:** Built entirely of interlocking granite. The apex dome (Kumbam) weighs over 80 tonnes, hoisted atop a 66-meter towering Vimana tower without mortar.\n• **Chola Legacy:** Center of classical Bharatnatyam dance and bronze casting.`;
  }

  if (q.includes('meenakshi') || q.includes('madurai')) {
    return `🌸 **Meenakshi Amman Temple, Madurai (Tamil Nadu)**\n\n• **Dedication:** Goddess Meenakshi (Parvati) and Sundareswarar (Shiva).\n• **Architecture:** Classic Dravidian jewel with 14 towering, multi-colored Gopurams adorned with thousands of hand-painted mythological statues.\n• **Heritage:** Famous for the Hall of 1,000 Pillars and 2,500 years of living Tamil heritage.`;
  }

  if (q.includes('mahabalipuram') || q.includes('mamallapuram') || q.includes('pallava') || q.includes('shore temple')) {
    return `🌊 **Mahabalipuram Shore Temples, Tamil Nadu**\n\n• **Era:** 7th–8th century CE under the Pallava maritime empire.\n• **Monuments:** Pancha Rathas (five monolithic rock chariots), the dramatic Shore Temple braving the ocean waves, and "Arjuna's Penance" (Descent of the Ganges) rock relief.`;
  }

  if (q.includes('mysore') || q.includes('mysuru')) {
    return `🏰 **Mysore Palace (Amba Vilas), Karnataka**\n\n• **Royal Seat:** Historic residence of the Wadiyar dynasty, redesigned in Indo-Saracenic grandeur by Henry Irwin in 1912.\n• **Splendor:** Features stained glass ceilings, Belgian chandeliers, peacock pavilions, and illuminates with nearly 100,000 incandescent light bulbs during Mysore Dasara.`;
  }

  // 5. East & North-East India
  if (q.includes('konark') || q.includes('sun temple') || q.includes('odisha')) {
    return `☀️ **Konark Sun Temple, Odisha**\n\n• **Built:** 1250 CE by King Narasimhadeva I of the Eastern Ganga Dynasty on the Bay of Bengal coast.\n• **Design:** Conceived as a colossal chariot for the Sun God Surya, complete with 24 carved stone wheels pulled by 7 galloping horses.\n• **Sundial Clock:** The wheel spokes function as astronomical sundials calculating exact time to the minute using sunlight shadows.`;
  }

  if (q.includes('nalanda') || q.includes('bihar')) {
    return `📚 **Nalanda Mahavihara, Bihar**\n\n• **Historic University:** Founded in the 5th century CE under the Gupta Empire; ancient world's greatest residential university hosting 10,000 students and 2,000 teachers from China, Korea, Japan, and Tibet.\n• **Legacy:** Famous scholars like Aryabhata and Nagarjuna taught here; vast library *Dharmaganja* held centuries of sacred manuscripts.`;
  }

  // 6. Classical Dances & Art Forms
  if (q.includes('dance') || q.includes('nritya') || q.includes('bharatnatyam') || q.includes('kathak') || q.includes('kathakali') || q.includes('odissi')) {
    return `💃 **Indian Classical Dances (Natya Shastra Heritage)**\n\n• **Bharatnatyam (Tamil Nadu):** Temple origins, geometric precision, striking footwork, and expressive Abhinaya.\n• **Kathak (North India):** Storytelling tradition of court and temple with lightning-fast spins (chakkars) and rhythmic ghungroo footwork.\n• **Kathakali (Kerala):** Grand dance-drama with stylized face makeup, elaborate headgear, and heroic mudra gestures.\n• **Odissi (Odisha):** Sculpturesque postures based on the *Tribhanga* (three-bend) stance mirroring temple statues.\n• **Others:** Kuchipudi (Andhra Pradesh), Manipuri (Manipur), Mohiniyattam (Kerala), and Sattriya (Assam).`;
  }

  if (q.includes('painting') || q.includes('madhubani') || q.includes('warli') || q.includes('tanjore') || q.includes('art')) {
    return `🎨 **Traditional Indian Folk Arts & Paintings**\n\n• **Madhubani (Mithila, Bihar):** Geometric motifs of nature and deities painted with natural mineral pigments and twigs.\n• **Warli Art (Maharashtra):** Minimalist tribal stick figures painted in white rice paste depicting village harvest and communal dances.\n• **Tanjore Painting (Tamil Nadu):** Rich gold leaf foil overlay, glass beads, and vibrant depictions of divine childhood forms.\n• **Pattachitra (Odisha & Bengal):** Cloth scroll paintings depicting epics with natural plant dyes and fine line work.`;
  }

  // 7. Indian Festivals & Traditions
  if (q.includes('diwali') || q.includes('deepavali')) {
    return `🪔 **Diwali (The Festival of Lights)**\n\n• **Significance:** Celebrates the victory of light over darkness and good over evil, commemorating Lord Rama's triumphant return to Ayodhya after 14 years of exile.\n• **Traditions:** Lighting earthen clay diyas, rangoli floor artworks, Lakshmi Puja for prosperity, sharing festive sweets, and family reunions.`;
  }

  if (q.includes('holi')) {
    return `🎨 **Holi (The Festival of Colors & Spring)**\n\n• **Heritage:** Celebrates the arrival of spring (*Vasant Ritu*) and the eternal divine love of Radha-Krishna in Braj (Mathura/Vrindavan).\n• **Significance:** Symbolizes the burning of evil (Holika Dahan) and the triumph of devotion represented by Bhakta Prahlada.`;
  }

  if (q.includes('festival') || q.includes('navratri') || q.includes('durga puja') || q.includes('pongal') || q.includes('onam')) {
    return `🎉 **Living Festivals of India**\n\n• **Durga Puja (Bengal):** UNESCO Intangible Cultural Heritage celebrating Goddess Durga with grand artistic pandals and dhunuchi dance.\n• **Navratri & Garba (Gujarat):** 9 nights of devotion with colorful circular community dance.\n• **Onam (Kerala):** Harvest festival celebrating King Mahabali with Pookkalam flower carpets and Vallam Kali snake boat races.\n• **Pongal & Makar Sankranti:** Solar harvest celebrations honoring Surya the Sun God with freshly harvested rice and sugarcane.`;
  }

  // 8. Dynasties & History
  if (q.includes('mughal') || q.includes('babur') || q.includes('akbar') || q.includes('shah jahan')) {
    return `👑 **The Mughal Dynasty (1526–1857 CE)**\n\n• **Founder:** Babur in 1526 following the First Battle of Panipat.\n• **Golden Age:** Akbar the Great championed religious harmony (*Sulh-i-Kul*) and imperial synthesis; Shah Jahan brought Mughal architecture to its zenith with the Taj Mahal and Red Fort.\n• **Architecture:** Characterized by bulbous domes, four-quartered *Charbagh* gardens, red sandstone, and white marble inlay.`;
  }

  if (q.includes('maurya') || q.includes('ashoka') || q.includes('chandragupta') || q.includes('chanakya')) {
    return `🦁 **The Mauryan Empire (322–185 BCE)**\n\n• **Founding:** United most of the Indian subcontinent under Chandragupta Maurya with strategic guidance from Chanakya (Kautilya), author of the *Arthashastra*.\n• **Emperor Ashoka:** Following the Kalinga War, embraced Buddhism and propagated Ahimsa (non-violence) through rock and pillar edicts across India.\n• **National Emblem:** The Lion Capital of Ashoka at Sarnath is the official Emblem of India.`;
  }

  if (q.includes('chola') || q.includes('raja raja')) {
    return `⚓ **The Imperial Chola Dynasty (848–1279 CE)**\n\n• **Maritime Empire:** Ruled South India with strong naval expeditions extending influence to Sri Lanka, Malaysia, Indonesia, and Southeast Asia.\n• **Living Heritage:** Built monumental granite Dravidian temples (Brihadeeswara at Thanjavur & Gangaikonda Cholapuram) and perfected lost-wax bronze casting (Nataraja).`;
  }

  // 9. Intelligent Contextual Fallback for all other heritage queries
  const cleanWord = message.replace(/[?.,!]/g, '').trim();
  return `🏛️ **Indian Heritage Insights: "${cleanWord}"**\n\nIndia preserves over 5,000 years of civilization with **42 UNESCO World Heritage Sites**, thousands of ASI protected monuments, and rich intangible traditions.\n\n• **Discover Monuments:** Use the **Explore** tab to browse architectural masterpieces and historical dynasties.\n• **Earn Badges:** Visit sites with GPS in **GeoHunt** to unlock explorer achievements.\n• **Ask Virasat AI:** Ask about specific rulers (Ashoka, Akbar, Cholas), temples (Konark, Meenakshi), caves (Ajanta, Ellora), or festivals!\n\nWould you like a detailed historical legend, travel guide, or quiz about this?`;
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAIInstance.getGenerativeModel({
          model: 'gemini-3.6-flash',
          systemInstruction: SYSTEM_PROMPT
        });
        const result = await model.generateContent(message);
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return res.json({ success: true, reply: text, source: 'gemini_live' });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using knowledge engine fallback:', geminiErr.message);
      }
    }

    const reply = getFallbackChat(message);
    return res.json({ success: true, reply, source: 'virasat_knowledge_engine' });
  } catch (error) {
    res.status(500).json({ error: 'AI service unavailable', message: error.message });
  }
});

// ─── POST /api/ai/monument-info ───────────────────────────────────────────────
router.post('/monument-info', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Monument name required' });

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }, { apiVersion: 'v1beta' });
      const prompt = `Tell me about the heritage site or monument: "${name}" in India. Keep it engaging and under 200 words.`;
      const result = await model.generateContent(prompt);
      return res.json({ success: true, info: result.response.text() });
    } catch (err) {
      const info = getFallbackChat(name);
      return res.json({ success: true, info });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get monument info', message: error.message });
  }
});

// ─── POST /api/ai/quiz ────────────────────────────────────────────────────────
router.post('/quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'medium' } = req.body;

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAIInstance.getGenerativeModel({ model: 'gemini-3.6-flash' });
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
      } catch (geminiErr) {
        console.warn('Gemini quiz generation failed, using randomized pool:', geminiErr.message);
      }
    }

    const questionPool = [
      { question: 'Which emperor built the Taj Mahal in memory of his wife?', options: ['Akbar', 'Shah Jahan', 'Babur', 'Humayun'], correct: 1, explanation: 'Shah Jahan built the Taj Mahal between 1631 and 1653.' },
      { question: 'Hampi was the ancient capital of which empire?', options: ['Chola', 'Vijayanagara', 'Maurya', 'Maratha'], correct: 1, explanation: 'Hampi was the capital of the Vijayanagara Empire in the 14th century.' },
      { question: 'Which temple is designed as a colossal chariot of the Sun God with 24 wheels?', options: ['Meenakshi Temple', 'Konark Sun Temple', 'Khajuraho', 'Brihadeeswara'], correct: 1, explanation: 'Konark Sun Temple in Odisha was built in the 13th century.' },
      { question: 'Where are the rock-cut cave paintings of Ajanta located?', options: ['Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan'], correct: 1, explanation: 'Ajanta Caves are located in the Aurangabad district of Maharashtra.' },
      { question: 'Which dance form originated in the temples of Tamil Nadu?', options: ['Kathak', 'Bharatnatyam', 'Kathakali', 'Odissi'], correct: 1, explanation: 'Bharatnatyam is an ancient classical dance from Tamil Nadu.' },
      { question: 'Who commissioned the Great Stupa at Sanchi in the 3rd century BCE?', options: ['Chandragupta Maurya', 'Emperor Ashoka', 'Kanishka', 'Harsha'], correct: 1, explanation: 'Emperor Ashoka built the Great Stupa at Sanchi.' },
      { question: 'What primary material gives Delhi’s Red Fort its distinctive color?', options: ['White Marble', 'Red Sandstone', 'Granite', 'Basalt'], correct: 1, explanation: 'Shah Jahan built the Red Fort with red sandstone quarried from Rajasthan.' },
      { question: 'The Brihadeeswara Temple in Thanjavur was built by which emperor?', options: ['Raja Raja Chola I', 'Rajendra Chola', 'Karikala', 'Kulothunga'], correct: 0, explanation: 'Raja Raja Chola I built the Brihadeeswara temple in 1010 CE.' }
    ];

    const shuffled = [...questionPool].sort(() => 0.5 - Math.random()).slice(0, 5);
    res.json({ success: true, questions: shuffled, source: 'offline_pool' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz', message: error.message });
  }
});

// ─── POST /api/ai/story ───────────────────────────────────────────────────────
router.post('/story', async (req, res) => {
  try {
    const { site } = req.body;

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAIInstance.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const prompt = `Write an engaging, poetic, and historically rich short story (under 200 words) about the Indian heritage site: "${site || 'an ancient Indian monument'}". Bring its history, artisans, and legends alive.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return res.json({ success: true, story: text, source: 'gemini_live' });
        }
      } catch (geminiErr) {
        console.warn('Gemini story generation failed, using fallback:', geminiErr.message);
      }
    }

    const story = `Centuries ago in the golden heart of India, master architects and thousands of devoted artisans gathered to create ${site || 'this timeless monument'}. Every stone was carved with devotion, echoing legends of royal splendor, divine inspiration, and architectural genius that continues to leave travelers spellbound to this day.`;
    res.json({ success: true, story, source: 'knowledge_engine' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate story', message: error.message });
  }
});

module.exports = router;


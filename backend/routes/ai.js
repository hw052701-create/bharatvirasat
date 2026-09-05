const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth');

const geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyDTAEun8A5aaioCZz2roIxX4WAkU3s5gn4';
const genAI = new GoogleGenerativeAI(geminiKey);

// System prompt for heritage guide context
const SYSTEM_PROMPT = `You are HeriSense AI, an expert heritage and culture guide for India. 
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
  const lower = message.toLowerCase();
  for (const [key, val] of Object.entries(HERITAGE_KB)) {
    if (lower.includes(key)) {
      return `🙏 Namaste! Here is what you should know about **${val.title}**:\n\n${val.text}\n\nWould you like travel tips, architectural details, or related legends about this site?`;
    }
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste')) {
    return `🙏 **Namaste! I am HeriSense AI**, your personal guide to India's glorious heritage and culture.\n\nYou can ask me about UNESCO World Heritage sites, Mughal & Chola architecture, temple art, traditional festivals like Holi/Diwali, or classical dances like Kathak and Bharatnatyam. Which heritage site would you like to explore today?`;
  }

  return `🙏 **Namaste from HeriSense AI!** India's heritage spans over 5,000 years with 42 UNESCO World Heritage Sites, thousands of ASI protected monuments, and rich intangible cultural traditions.\n\nRegarding *"${message}"*: India preserves deep roots in architectural marvels, traditional handicrafts, classical arts, and sacred festivals. You can search sites in the **Explore** tab or take on quests in **GeoHunt** to earn explorer points! What specific region or monument would you like to know about?`;
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }, { apiVersion: 'v1beta' });
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: 'Namaste! I am HeriSense AI, your personal heritage guide.' }] }
        ]
      });
      const result = await chat.sendMessage(message);
      const reply = result.response.text();
      return res.json({ success: true, reply });
    } catch (apiErr) {
      console.warn('Gemini API call returned error, using built-in HeriSense AI:', apiErr.message);
      const reply = getFallbackChat(message);
      return res.json({ success: true, reply, source: 'herisense_knowledge_engine' });
    }
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
    const { topic } = req.body;
    const defaultQuiz = [
      { question: 'Which emperor built the Taj Mahal in memory of his wife?', options: ['Akbar', 'Shah Jahan', 'Babur', 'Humayun'], correct: 1, explanation: 'Shah Jahan built the Taj Mahal between 1631 and 1653.' },
      { question: 'Hampi was the ancient capital of which empire?', options: ['Chola', 'Maurya', 'Vijayanagara', 'Maratha'], correct: 2, explanation: 'Hampi was the capital of the Vijayanagara Empire in the 14th century.' },
      { question: 'Which temple is designed as a colossal chariot of the Sun God with 24 wheels?', options: ['Meenakshi Temple', 'Konark Sun Temple', 'Khajuraho', 'Brihadeeswara'], correct: 1, explanation: 'Konark Sun Temple in Odisha was built in the 13th century.' },
      { question: 'Where are the rock-cut cave paintings of Ajanta located?', options: ['Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan'], correct: 1, explanation: 'Ajanta Caves are located in the Aurangabad district of Maharashtra.' },
      { question: 'Which dance form originated in the temples of Tamil Nadu?', options: ['Kathak', 'Bharatnatyam', 'Kathakali', 'Odissi'], correct: 1, explanation: 'Bharatnatyam is an ancient classical dance from Tamil Nadu.' }
    ];

    res.json({ success: true, questions: defaultQuiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz', message: error.message });
  }
});

// ─── POST /api/ai/story ───────────────────────────────────────────────────────
router.post('/story', async (req, res) => {
  try {
    const { site } = req.body;
    const story = `Centuries ago in the golden heart of India, master architects and thousands of devoted artisans gathered to create ${site || 'this timeless monument'}. Every stone was carved with devotion, echoing legends of royal splendor, divine inspiration, and architectural genius that continues to leave travelers spellbound to this day.`;
    res.json({ success: true, story });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate story', message: error.message });
  }
});

module.exports = router;


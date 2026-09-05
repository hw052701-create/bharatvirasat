const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for heritage guide context
const SYSTEM_PROMPT = `You are HeriSense AI, an expert heritage and culture guide for India. 
You specialize in Indian history, architecture, monuments, festivals, art forms, and cultural traditions.
You are part of BharatVirasat, a platform to help Indians discover and appreciate their heritage.
Respond in a friendly, engaging, and educational way. Keep responses concise (2-3 paragraphs max).
If asked about a specific monument or heritage site, provide key facts like: when built, who built it, historical significance, and tips for visitors.
Always encourage users to visit and appreciate India's rich cultural heritage.
If asked in Hindi or any Indian language, respond in that language.`;

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build chat history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'Namaste! I am HeriSense AI, your personal heritage guide. I can help you discover India\'s rich cultural heritage - from ancient monuments to folk traditions. What would you like to explore today?' }]
        },
        ...history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({ success: true, reply: response });
  } catch (error) {
    console.error('Gemini AI Error:', error);
    res.status(500).json({ error: 'AI service unavailable', message: error.message });
  }
});

// ─── POST /api/ai/monument-info ───────────────────────────────────────────────
router.post('/monument-info', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Monument name required' });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Tell me about the heritage site or monument: "${name}" in India. 
    Provide: 1) Brief history (2-3 sentences), 2) Key facts (built by, year, dynasty), 
    3) Why it's important, 4) Best time to visit. Keep it engaging and under 200 words.`;

    const result = await model.generateContent(prompt);
    const info = result.response.text();

    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get monument info', message: error.message });
  }
});

// ─── POST /api/ai/quiz ────────────────────────────────────────────────────────
router.post('/quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'medium' } = req.body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate 5 multiple choice quiz questions about Indian heritage and culture${topic ? ` focused on ${topic}` : ''}.
    Difficulty: ${difficulty}.
    Return as JSON array with this exact format:
    [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}]
    Where correct is the index (0-3) of the correct answer.
    Only return the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const questions = JSON.parse(jsonMatch[0]);
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz', message: error.message });
  }
});

// ─── POST /api/ai/story ───────────────────────────────────────────────────────
router.post('/story', async (req, res) => {
  try {
    const { site, style = 'narrative' } = req.body;
    if (!site) return res.status(400).json({ error: 'Site name required' });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Write a captivating short story (150-200 words) about the Indian heritage site "${site}". 
    Style: ${style}. Make it vivid, historically accurate, and inspiring. 
    It should make the reader want to visit this place.`;

    const result = await model.generateContent(prompt);
    res.json({ success: true, story: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate story', message: error.message });
  }
});

module.exports = router;

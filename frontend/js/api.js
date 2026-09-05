// ── api.js — All backend API calls ──────────────────────────────────────────
// 🌐 Frontend: https://hw052701-create.github.io/bharatvirasat
// 🚂 Backend: Live Railway URL
const API_BASE = 'https://bharatvirasat-production.up.railway.app/api';

const API = {
  // ─── Auth ────────────────────────────────────────────────────────────────
  async register(data) {
    return await API.post('/auth/register', data, false);
  },
  async login(data) {
    return await API.post('/auth/login', data, false);
  },
  async getMe() {
    return await API.get('/auth/me');
  },

  // ─── Heritage ────────────────────────────────────────────────────────────
  async getHeritage(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await API.get(`/heritage${query ? '?' + query : ''}`);
  },
  async getHeritageSite(id) {
    return await API.get(`/heritage/${id}`);
  },
  async getFeatured() {
    return await API.get('/heritage/featured');
  },
  async getNearby(lat, lng) {
    return await API.get(`/heritage/nearby?lat=${lat}&lng=${lng}`);
  },
  async seedHeritage() {
    return await API.post('/heritage/seed/init', {}, false);
  },

  // ─── AI ──────────────────────────────────────────────────────────────────
  async aiChat(message, history = []) {
    try {
      const res = await API.post('/ai/chat', { message, history });
      if (res && res.reply) return res;
    } catch (e) {
      console.warn('API aiChat server fallback:', e.message);
    }
    return {
      success: true,
      reply: (typeof AIGuide !== 'undefined' && AIGuide.getInstantAnswer)
        ? AIGuide.getInstantAnswer(message)
        : `🙏 Namaste! I am HeriSense AI, your personal guide to India's glorious heritage.`
    };
  },
  async monumentInfo(name) {
    try {
      const res = await API.post('/ai/monument-info', { name }, false);
      if (res && res.info) return res;
    } catch (e) {
      console.warn('API monumentInfo server fallback:', e.message);
    }
    return {
      success: true,
      info: (typeof AIGuide !== 'undefined' && AIGuide.getInstantAnswer)
        ? AIGuide.getInstantAnswer(name)
        : `${name} is an iconic Indian heritage site with rich historical, cultural, and architectural significance.`
    };
  },
  async generateQuiz(topic, difficulty = 'medium') {
    try {
      const res = await API.post('/ai/quiz', { topic, difficulty });
      if (res && res.questions && res.questions.length > 0) return res;
    } catch (e) {
      console.warn('API generateQuiz server fallback:', e.message);
    }
    return {
      success: true,
      questions: (typeof AIGuide !== 'undefined' && AIGuide.quizBank)
        ? (AIGuide.quizBank.find(q => topic && topic.toLowerCase().includes(q.topic))?.questions || AIGuide.quizBank[0].questions)
        : [
            { question: 'Which emperor built the Taj Mahal in memory of his beloved wife?', options: ['Akbar', 'Shah Jahan', 'Babur', 'Humayun'], correct: 1 },
            { question: 'Hampi was the ancient capital of which legendary South Indian empire?', options: ['Chola', 'Maurya', 'Vijayanagara', 'Maratha'], correct: 2 },
            { question: 'Which Sun Temple is shaped like a colossal stone chariot with 24 carved wheels?', options: ['Meenakshi Temple', 'Konark Sun Temple', 'Khajuraho', 'Brihadeeswara'], correct: 1 },
            { question: 'Where are the 2,000-year-old rock-cut Buddhist murals of Ajanta located?', options: ['Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan'], correct: 1 },
            { question: 'Which classical dance originated in the sacred temples of Tamil Nadu?', options: ['Kathak', 'Bharatnatyam', 'Kathakali', 'Odissi'], correct: 1 }
          ]
    };
  },
  async generateStory(site) {
    try {
      const res = await API.post('/ai/story', { site });
      if (res && res.story) return res;
    } catch (e) {
      console.warn('API generateStory server fallback:', e.message);
    }
    return {
      success: true,
      story: (typeof AIGuide !== 'undefined' && AIGuide.getStoryFallback)
        ? AIGuide.getStoryFallback(site)
        : `Centuries ago in the golden heart of India, master architects and thousands of devoted artisans gathered to create ${site || 'this timeless monument'}. Every stone was carved with devotion, echoing legends of royal splendor, divine inspiration, and architectural genius that continues to leave travelers spellbound to this day.`
    };
  },

  // ─── Geo Hunt ────────────────────────────────────────────────────────────
  async getMissions(lat, lng) {
    return await API.get(`/geohunt/missions${lat ? `?lat=${lat}&lng=${lng}` : ''}`);
  },
  async checkIn(missionId, lat, lng) {
    return await API.post('/geohunt/checkin', { missionId, lat, lng });
  },
  async submitQuiz(missionId, answers) {
    return await API.post('/geohunt/quiz-submit', { missionId, answers });
  },
  async getLeaderboard() {
    return await API.get('/geohunt/leaderboard');
  },

  // ─── Community ───────────────────────────────────────────────────────────
  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await API.get(`/community${query ? '?' + query : ''}`);
  },
  async createPost(data) {
    return await API.post('/community', data);
  },
  async likePost(id) {
    return await API.post(`/community/${id}/like`, {});
  },
  async commentPost(id, text) {
    return await API.post(`/community/${id}/comment`, { text });
  },

  // ─── User ────────────────────────────────────────────────────────────────
  async getProfile() {
    return await API.get('/user/profile');
  },
  async updateProfile(data) {
    return await API.put('/user/profile', data);
  },
  async saveSite(siteId) {
    return await API.post('/user/save-site', { siteId });
  },

  // ─── Base Methods ─────────────────────────────────────────────────────────
  getToken() {
    return localStorage.getItem('bv_token');
  },

  async get(endpoint) {
    const token = API.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + endpoint, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  async post(endpoint, body, requireAuth = true) {
    const token = API.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (requireAuth && token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + endpoint, {
      method: 'POST', headers, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  async put(endpoint, body) {
    const token = API.getToken();
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const res = await fetch(API_BASE + endpoint, {
      method: 'PUT', headers, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
};

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
    return await API.post('/ai/chat', { message, history });
  },
  async monumentInfo(name) {
    return await API.post('/ai/monument-info', { name }, false);
  },
  async generateQuiz(topic, difficulty = 'medium') {
    return await API.post('/ai/quiz', { topic, difficulty });
  },
  async generateStory(site) {
    return await API.post('/ai/story', { site });
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

# BharatVirasat - भारत विरासत

> 🏛️ AI-Powered Heritage Discovery & Gamification Platform | SIH 2026

[![Live Frontend](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue)](https://hw052701-create.github.io/bharatvirasat)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple)](https://bharatvirasat.up.railway.app)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green)](https://cloud.mongodb.com)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)](https://ai.google.dev)

## 🌟 Features

- 🔍 **Explorer** — Browse 3,691+ Indian heritage sites by Architecture, Culture, Research
- 🗺️ **Geo Hunt** — GPS-based missions at real heritage locations with points & badges
- 🤖 **Virasat AI** — Gemini-powered heritage chatbot, quiz generator, story writer
- 👥 **Community** — Share stories, photos and discoveries with fellow heritage lovers
- 🏅 **Gamification** — Points, levels, badges, leaderboard
- 📱 **PWA** — Installable on Android & iPhone (no App Store needed!)
- 🌐 **Multilingual** — Works in 22 Indian languages via AI

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML + CSS + JS (PWA) |
| Hosting (FE) | GitHub Pages |
| Backend | Node.js + Express.js |
| Hosting (BE) | Railway.app |
| Database | MongoDB Atlas |
| AI | Google Gemini API |
| Maps | Leaflet.js + OpenStreetMap |

## 🚀 Setup

### Backend (Railway)

1. Fork this repository
2. Create account on [Railway.app](https://railway.app)
3. New Project → Deploy from GitHub → Select `bharatvirasat/backend`
4. Add Environment Variables in Railway:
   ```
   MONGODB_URI=your_mongodb_atlas_string
   JWT_SECRET=bharatvirasat_super_secret_jwt_key_2026
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=https://hw052701-create.github.io
   NODE_ENV=production
   ```
5. Railway auto-deploys and gives you a URL

### Frontend (GitHub Pages)

1. Update `frontend/js/api.js` line 4:
   ```js
   const API_BASE = 'https://your-railway-url.up.railway.app/api'; // paste your Railway URL
   ```
2. Go to GitHub repo Settings → Pages → Source: `main branch / frontend folder` (or `/docs`)
3. Done! App live at `https://hw052701-create.github.io/bharatvirasat`

### Seed Database (One Time)

After backend is live, open your app and register → data seeds automatically.
Or hit: `POST https://your-railway-url.up.railway.app/api/heritage/seed/init`

## 📱 Install as App on Phone

- **Android**: Open site in Chrome → Menu → "Add to Home Screen"
- **iPhone**: Open site in Safari → Share → "Add to Home Screen"

## 🌐 Live URLs

- Frontend: `https://hw052701-create.github.io/bharatvirasat`
- Backend: `https://bharatvirasat.up.railway.app` *(update after Railway deploy)*
- API Health: `https://bharatvirasat.up.railway.app/api/health`

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/heritage` | Get all heritage sites |
| GET | `/api/heritage/featured` | Get featured sites |
| GET | `/api/heritage/nearby?lat=&lng=` | Get nearby sites |
| POST | `/api/ai/chat` | Gemini AI chat |
| POST | `/api/ai/quiz` | Generate quiz |
| POST | `/api/ai/story` | Generate story |
| GET | `/api/geohunt/missions` | Get geo missions |
| POST | `/api/geohunt/checkin` | Check in at mission |
| GET | `/api/geohunt/leaderboard` | Leaderboard |
| GET | `/api/community` | Get community posts |
| POST | `/api/community` | Create post |

## 🏆 SIH 2026

Built for **Smart India Hackathon 2026** — Heritage & Culture Domain.

*"BharatVirasat doesn't just show India's past — it makes youth LIVE it."* 🇮🇳

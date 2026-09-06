// ── app.js — Main App Controller ─────────────────────────────────────────────
const App = {
  currentPage: 'home',

  // ─── Initialize App ───────────────────────────────────────────────────────
  async init() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }

    // Show splash, then check auth
    setTimeout(async () => {
      const isLoggedIn = await Auth.init();
      App.hideSplash();
      if (isLoggedIn) {
        App.start();
      } else {
        document.getElementById('auth-screen').classList.remove('hidden');
      }
    }, 2500);
  },

  // ─── Hide Splash ──────────────────────────────────────────────────────────
  hideSplash() {
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => splash.style.display = 'none', 500);
  },

  // ─── Start Main App ───────────────────────────────────────────────────────
  start() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    App.updateUserPoints();
    App.navigate('home');
  },

  // ─── Navigate ─────────────────────────────────────────────────────────────
  navigate(page) {
    App.currentPage = page;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${page}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Destroy map if leaving geohunt
    if (page !== 'geohunt' && GeoHunt.map) {
      GeoHunt.map.remove();
      GeoHunt.map = null;
    }

    // Render page
    switch (page) {
      case 'home':      App.renderHome(); break;
      case 'explorer':  Explorer.render(); break;
      case 'geohunt':   GeoHunt.render(); break;
      case 'ai':        AIGuide.render(); break;
      case 'community': Community.render(); break;
      case 'profile':   App.renderProfile(); break;
      default:          App.renderHome();
    }

    // Scroll to top
    document.getElementById('app-content').scrollTop = 0;
  },

  // ─── Render Home ──────────────────────────────────────────────────────────
  async renderHome() {
    const user = Auth.currentUser;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const festivals = ['Diwali', 'Holi', 'Dussehra', 'Navratri', 'Pongal', 'Onam'];
    const todaysFestival = festivals[Math.floor(Math.random() * festivals.length)];

    document.getElementById('app-content').innerHTML = `
      <!-- Hero Banner -->
      <div class="hero-banner">
        <div class="hero-gradient"></div>
        <div class="hero-content">
          <div class="hero-greeting">🙏 ${greeting}, ${user?.name?.split(' ')[0] || 'Explorer'}</div>
          <h1 class="hero-title">Discover <span>Bharat's</span><br>Living Heritage</h1>
          <p class="hero-subtitle">3,691 sites • 22 languages • Infinite stories</p>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-num">3,691+</div>
          <div class="stat-label">ASI Sites</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">42</div>
          <div class="stat-label">UNESCO</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">22</div>
          <div class="stat-label">Languages</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="quick-action" onclick="App.navigate('explorer')">
          <div class="qa-icon arch">🏛️</div>
          <span>Architecture</span>
        </div>
        <div class="quick-action" onclick="Explorer.setType('culture');App.navigate('explorer')">
          <div class="qa-icon cult">🎭</div>
          <span>Culture</span>
        </div>
        <div class="quick-action" onclick="Explorer.setType('research');App.navigate('explorer')">
          <div class="qa-icon res">📚</div>
          <span>Research</span>
        </div>
        <div class="quick-action" onclick="App.navigate('geohunt')">
          <div class="qa-icon geo">🗺️</div>
          <span>Geo Hunt</span>
        </div>
      </div>

      <!-- Daily Challenge -->
      ${(() => {
        const isDailyDone = localStorage.getItem('bv_daily_quiz_claimed') === new Date().toISOString().slice(0, 10);
        return `
        <div class="daily-challenge" onclick="AIGuide.startQuiz()">
          <div class="challenge-badge">${isDailyDone ? '✅ Daily Challenge Completed' : '🏆 Daily Challenge (+50 XP)'}</div>
          <div class="challenge-title">Heritage Quiz of the Day</div>
          <div class="challenge-desc">Test your knowledge about ${todaysFestival} and earn bonus explorer points!</div>
          <button class="challenge-btn">
            <i class="fas ${isDailyDone ? 'fa-redo' : 'fa-brain'}"></i> ${isDailyDone ? 'Practice Quiz' : 'Start Daily Quiz'}
          </button>
        </div>`;
      })()}

      <!-- Featured Sites -->
      <div class="home-section">
        <div class="section-header">
          <div class="section-title">🏛️ Featured Sites</div>
          <div class="section-link" onclick="App.navigate('explorer')">See All →</div>
        </div>
        <div class="scroll-row" id="featured-row">
          ${Array(4).fill('<div class="card skeleton-card" style="min-width:220px;height:250px"></div>').join('')}
        </div>
      </div>

      <!-- AI Promo -->
      <div style="margin:0 1rem 0">
        <div class="daily-challenge" style="background:linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2));border-color:rgba(102,126,234,0.4)"
          onclick="App.navigate('ai')">
          <div class="challenge-badge" style="background:linear-gradient(135deg,#667eea,#764ba2)">🤖 AI Powered</div>
          <div class="challenge-title">Virasat AI Guide</div>
          <div class="challenge-desc">Ask anything about India's heritage, get AI-generated stories, and take dynamic quizzes!</div>
          <button class="challenge-btn" style="background:linear-gradient(135deg,#667eea,#764ba2)">
            <i class="fas fa-robot"></i> Chat with AI
          </button>
        </div>
      </div>

      <!-- Community -->
      <div class="home-section">
        <div class="section-header">
          <div class="section-title">👥 Community Stories</div>
          <div class="section-link" onclick="App.navigate('community')">View All →</div>
        </div>
        <div id="community-preview">
          <div class="skeleton skeleton-card" style="height:120px;margin-bottom:0.5rem"></div>
          <div class="skeleton skeleton-card" style="height:120px"></div>
        </div>
      </div>
    `;

    // Load featured sites
    App.loadFeatured();
    App.loadCommunityPreview();
  },

  async loadFeatured() {
    try {
      const res = await API.getFeatured();
      const row = document.getElementById('featured-row');
      if (!row) return;
      row.innerHTML = res.data.map(site => Explorer.renderCard(site)).join('');
    } catch {}
  },

  async loadCommunityPreview() {
    try {
      const res = await API.getPosts({ limit: 2 });
      const preview = document.getElementById('community-preview');
      if (!preview) return;

      if (!res.data || res.data.length === 0) {
        preview.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><h3>No stories yet</h3><p>Be the first to share!</p></div>`;
        return;
      }

      preview.innerHTML = res.data.map(post => `
        <div style="background:var(--card-bg2);border:1px solid var(--border);border-radius:var(--radius-md);padding:0.875rem;margin-bottom:0.625rem;cursor:pointer"
          onclick="App.navigate('community')">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
            <div class="create-post-avatar" style="width:30px;height:30px;font-size:0.75rem">
              ${Auth.getInitials(post.author?.name || 'U')}
            </div>
            <span style="font-size:0.85rem;font-weight:700">${post.author?.name || 'Explorer'}</span>
            <span style="font-size:0.75rem;color:var(--text-muted)">${Community.timeAgo(post.createdAt)}</span>
          </div>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5">
            ${post.content.slice(0, 120)}${post.content.length > 120 ? '...' : ''}
          </p>
        </div>`).join('');
    } catch {}
  },

  // ─── Render Profile ───────────────────────────────────────────────────────
  async renderProfile() {
    const user = Auth.currentUser;
    const levelProgress = user ? ((user.points % 500) / 500) * 100 : 0;
    const nextLevel = user ? ((Math.floor(user.points / 500) + 1) * 500) : 500;
    const currentLevelPoints = user ? (user.points % 500) : 0;

    const defaultBadges = [
      { icon: '🌱', name: 'First Steps' },
      { icon: '🏛️', name: 'Explorer' },
      { icon: '🌍', name: 'Wanderer' }
    ];

    const badges = (user?.badges?.length > 0) ? user.badges : defaultBadges;

    document.getElementById('app-content').innerHTML = `
      <div class="profile-hero">
        <div class="profile-avatar-ring">${Auth.getInitials(user?.name)}</div>
        <div class="profile-name">${user?.name || 'Explorer'}</div>
        <div class="profile-state">
          <i class="fas fa-map-marker-alt" style="color:var(--saffron)"></i>
          ${user?.state || 'India'} • Level ${user?.level || 1} Heritage Explorer
        </div>

        <div class="level-bar-container">
          <div class="level-label">
            <span>Level ${user?.level || 1}</span>
            <span>${currentLevelPoints}/${nextLevel - (user?.level - 1 || 0) * 500} pts to next level</span>
          </div>
          <div class="level-bar">
            <div class="level-fill" style="width:${levelProgress}%"></div>
          </div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-num">${user?.points?.toLocaleString() || 0}</div>
          <div class="profile-stat-label">Total Points</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-num">${user?.completedMissions?.length || 0}</div>
          <div class="profile-stat-label">Missions Done</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-num">${user?.badges?.length || 0}</div>
          <div class="profile-stat-label">Badges</div>
        </div>
      </div>

      <!-- Badges -->
      <div class="badges-section">
        <div class="badges-title">🏅 Badges Earned</div>
        <div class="badges-grid">
          ${badges.slice(0, 8).map(b => `
            <div class="badge-item">
              <span class="badge-icon">${b.icon || '🏅'}</span>
              <div class="badge-name">${b.name}</div>
            </div>`).join('')}
          ${badges.length === 0 ? `
            <div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:0.85rem;padding:1rem">
              Complete missions to earn badges! 🗺️
            </div>` : ''}
        </div>
      </div>

      <!-- Menu -->
      <div class="profile-menu">
        <div class="menu-item" onclick="App.navigate('explorer')">
          <i class="fas fa-bookmark"></i>
          <span>Saved Sites</span>
          <i class="fas fa-chevron-right chevron"></i>
        </div>
        <div class="menu-item" onclick="GeoHunt.activeTab='leaderboard';App.navigate('geohunt')">
          <i class="fas fa-trophy"></i>
          <span>Leaderboard</span>
          <i class="fas fa-chevron-right chevron"></i>
        </div>
        <div class="menu-item" onclick="App.navigate('community')">
          <i class="fas fa-users"></i>
          <span>My Stories</span>
          <i class="fas fa-chevron-right chevron"></i>
        </div>
        <div class="menu-item" onclick="App.showAbout()">
          <i class="fas fa-info-circle"></i>
          <span>About BharatVirasat</span>
          <i class="fas fa-chevron-right chevron"></i>
        </div>
      </div>

      <button class="logout-btn" onclick="Auth.logout()">
        <i class="fas fa-sign-out-alt"></i> Sign Out
      </button>
    `;
  },

  // ─── Update Points Display ────────────────────────────────────────────────
  updateUserPoints() {
    const user = Auth.currentUser;
    if (user) {
      document.getElementById('user-points-display').textContent = (user.points || 0).toLocaleString();
    }
  },

  // ─── Search ───────────────────────────────────────────────────────────────
  toggleSearch() {
    const bar = document.getElementById('search-bar');
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) {
      document.getElementById('global-search').focus();
    }
  },
  closeSearch() {
    document.getElementById('search-bar').classList.add('hidden');
  },
  search(query) {
    if (query.length < 2) return;
    clearTimeout(App._searchTimer);
    App._searchTimer = setTimeout(() => {
      App.currentPage = 'explorer';
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('nav-explorer').classList.add('active');
      Explorer.currentType = 'all';
      Explorer.render();
      setTimeout(() => Explorer.loadSites(query), 200);
      App.closeSearch();
    }, 500);
  },

  // ─── Modal ────────────────────────────────────────────────────────────────
  showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },
  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  // ─── Toast ────────────────────────────────────────────────────────────────
  showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
  },

  // ─── About ────────────────────────────────────────────────────────────────
  showAbout() {
    App.showModal(`
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:1rem">🪷</div>
        <h3 style="margin-bottom:0.5rem">BharatVirasat</h3>
        <p style="color:var(--gold);font-weight:600;margin-bottom:1rem">भारत विरासत v1.0</p>
        <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6">
          An AI-powered heritage discovery platform built for SIH 2026.<br><br>
          Discover India's 3,691+ ASI monuments, folk traditions, and cultural heritage through gamification, AI guidance, and community storytelling.
        </p>
        <div style="margin-top:1.5rem;padding:1rem;background:var(--card-bg2);border-radius:var(--radius-md);border:1px solid var(--border)">
          <div style="font-size:0.8rem;color:var(--text-secondary)">🤖 Powered by Google Gemini AI</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">🗺️ Maps by OpenStreetMap</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">🏛️ Data from ASI, Government of India</div>
        </div>
        <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal()">Close</button>
      </div>`);
  }
};

// ─── Start App ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());

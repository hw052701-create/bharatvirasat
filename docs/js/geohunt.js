// ── geohunt.js — Geo Hunt GPS Module ────────────────────────────────────────
const GeoHunt = {
  map: null,
  userMarker: null,
  userLat: null,
  userLng: null,
  missions: [],
  activeTab: 'missions',

  // ─── Render Geo Hunt Page ─────────────────────────────────────────────────
  render() {
    document.getElementById('app-content').innerHTML = `
      <div class="geohunt-header">
        <h2>🗺️ Geo Hunt</h2>
        <p>Complete missions at real heritage sites to earn points & badges!</p>
      </div>

      <div style="display:flex;border-bottom:1px solid var(--border)">
        <button class="tab-btn ${GeoHunt.activeTab === 'missions' ? 'active' : ''}"
          style="border-radius:0;border:none;border-bottom:2px solid ${GeoHunt.activeTab === 'missions' ? 'var(--gold)' : 'transparent'};flex:1"
          onclick="GeoHunt.switchTab('missions')">Missions</button>
        <button class="tab-btn ${GeoHunt.activeTab === 'map' ? 'active' : ''}"
          style="border-radius:0;border:none;border-bottom:2px solid ${GeoHunt.activeTab === 'map' ? 'var(--gold)' : 'transparent'};flex:1"
          onclick="GeoHunt.switchTab('map')">Map</button>
        <button class="tab-btn ${GeoHunt.activeTab === 'leaderboard' ? 'active' : ''}"
          style="border-radius:0;border:none;border-bottom:2px solid ${GeoHunt.activeTab === 'leaderboard' ? 'var(--gold)' : 'transparent'};flex:1"
          onclick="GeoHunt.switchTab('leaderboard')">Board</button>
      </div>

      <div id="geohunt-tab-content"></div>`;

    GeoHunt.switchTab(GeoHunt.activeTab);
    GeoHunt.getUserLocation();
  },

  // ─── Switch Tab ───────────────────────────────────────────────────────────
  switchTab(tab) {
    GeoHunt.activeTab = tab;
    const content = document.getElementById('geohunt-tab-content');
    if (!content) return;

    if (tab === 'missions') GeoHunt.renderMissions(content);
    else if (tab === 'map') GeoHunt.renderMap(content);
    else if (tab === 'leaderboard') GeoHunt.renderLeaderboard(content);
  },

  // ─── Get User GPS ─────────────────────────────────────────────────────────
  getUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        GeoHunt.userLat = pos.coords.latitude;
        GeoHunt.userLng = pos.coords.longitude;
        if (GeoHunt.activeTab === 'missions') GeoHunt.loadMissions();
        if (GeoHunt.map && GeoHunt.userMarker) {
          GeoHunt.userMarker.setLatLng([GeoHunt.userLat, GeoHunt.userLng]);
        }
      },
      () => GeoHunt.loadMissions()
    );
  },

  // ─── Load Missions ────────────────────────────────────────────────────────
  async loadMissions() {
    try {
      const res = await API.getMissions(GeoHunt.userLat, GeoHunt.userLng);
      GeoHunt.missions = res.data || [];
      if (GeoHunt.activeTab === 'missions') {
        const content = document.getElementById('geohunt-tab-content');
        if (content) GeoHunt.renderMissions(content);
      }
    } catch {}
  },

  // ─── Render Missions List ─────────────────────────────────────────────────
  renderMissions(container) {
    if (GeoHunt.missions.length === 0) {
      container.innerHTML = `
        <div style="padding:1rem">
          <div class="daily-challenge" style="margin:0 0 1rem">
            <div class="challenge-badge">📍 Your Location</div>
            <div class="challenge-title">Getting nearby missions...</div>
            <div class="challenge-desc">Allow location access for best experience</div>
            <button class="challenge-btn" onclick="GeoHunt.getUserLocation()">
              <i class="fas fa-map-marker-alt"></i> Enable Location
            </button>
          </div>
          <div class="empty-state">
            <i class="fas fa-map-pin"></i>
            <h3>No missions yet</h3>
            <p>Missions will appear here based on your location</p>
          </div>
        </div>`;
      return;
    }

    const missionTypeIcon = { checkin: '📍', quiz: '❓', photo: '📸', explore: '🔍' };

    container.innerHTML = `
      <div class="missions-list">
        ${GeoHunt.missions.map(m => `
          <div class="mission-card ${m.completed ? 'completed' : ''}"
            onclick="GeoHunt.openMission('${m._id}')">
            <div class="mission-icon ${m.type}">${missionTypeIcon[m.type] || '📍'}</div>
            <div class="mission-info">
              <div class="mission-title">${m.title}</div>
              <div class="mission-desc">${m.description || ''}</div>
              <div class="mission-meta">
                <div class="mission-pts"><i class="fas fa-star"></i> ${m.rewardPoints} pts</div>
                ${m.distance !== null ? `<div class="mission-dist"><i class="fas fa-route"></i> ${m.distance < 1 ? Math.round(m.distance * 1000) + 'm' : m.distance.toFixed(1) + 'km'}</div>` : ''}
                <div class="mission-diff diff-${m.difficulty || 'easy'}">${m.difficulty || 'easy'}</div>
                ${m.completed ? '<div class="completed-badge"><i class="fas fa-check-circle"></i> Done</div>' : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  },

  // ─── Open Mission Detail ──────────────────────────────────────────────────
  openMission(missionId) {
    const mission = GeoHunt.missions.find(m => m._id === missionId);
    if (!mission) return;

    if (mission.completed) {
      App.showToast('Already completed! 🏆', 'success');
      return;
    }

    if (mission.type === 'quiz') {
      GeoHunt.startQuiz(mission);
    } else {
      App.showModal(`
        <h3>${mission.title}</h3>
        <p style="color:var(--text-secondary);margin:0.75rem 0 1.25rem;line-height:1.6">${mission.description || 'Visit this location to complete the mission.'}</p>

        <div class="daily-challenge" style="margin:0 0 1.25rem">
          <div class="challenge-badge">🎁 Reward</div>
          <div class="challenge-title">${mission.rewardPoints} Points${mission.rewardBadge?.name ? ` + "${mission.rewardBadge.name}" Badge` : ''}</div>
        </div>

        ${mission.location ? `
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">
            <i class="fas fa-map-marker-alt" style="color:var(--saffron)"></i>
            Location: ${mission.location.lat.toFixed(4)}, ${mission.location.lng.toFixed(4)}
            ${mission.distance !== null ? ` (${mission.distance < 1 ? Math.round(mission.distance * 1000) + 'm away' : mission.distance.toFixed(1) + 'km away'})` : ''}
          </p>` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <button class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn-accent" onclick="GeoHunt.attemptCheckin('${missionId}')">
            <i class="fas fa-map-marker-alt"></i> Check In
          </button>
        </div>`);
    }
  },

  // ─── Attempt Check-in ─────────────────────────────────────────────────────
  async attemptCheckin(missionId) {
    if (!GeoHunt.userLat || !GeoHunt.userLng) {
      // Simulate success for demo purposes
      App.showModal(`
        <div style="text-align:center;padding:1.5rem">
          <div style="font-size:4rem">🎉</div>
          <h3 style="margin:1rem 0 0.5rem">Location not available</h3>
          <p style="color:var(--text-secondary)">Enable GPS to check in at this location.</p>
          <button class="btn-primary" style="margin-top:1.5rem" onclick="GeoHunt.getUserLocation();App.closeModal()">
            <i class="fas fa-map-marker-alt"></i> Enable Location
          </button>
        </div>`);
      return;
    }

    try {
      const res = await API.checkIn(missionId, GeoHunt.userLat, GeoHunt.userLng);
      App.closeModal();

      // Update points display
      const user = Auth.currentUser;
      if (user) {
        user.points = res.newTotal || ((user.points || 0) + res.pointsEarned);
        localStorage.setItem('bv_user', JSON.stringify(user));
        const ptsDisplay = document.getElementById('user-points-display');
        if (ptsDisplay) ptsDisplay.textContent = user.points;
      }

      // Mark as completed
      GeoHunt.missions = GeoHunt.missions.map(m =>
        m._id === missionId ? { ...m, completed: true } : m
      );

      App.showModal(`
        <div style="text-align:center;padding:1.5rem">
          <div style="font-size:4rem">🎉</div>
          <h3 style="margin:1rem 0 0.5rem">${res.message || 'Mission Complete!'}</h3>
          <p style="font-size:1.5rem;font-weight:800;color:var(--gold)">+${res.pointsEarned} Points!</p>
          ${res.badge?.name ? `<p style="color:var(--text-secondary);margin-top:0.5rem">🏅 Earned badge: "${res.badge.name}"</p>` : ''}
          <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.5rem">Level ${res.newLevel || 1} • ${user?.points || res.newTotal} total points</p>
          <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal();GeoHunt.switchTab(GeoHunt.activeTab)">
            <span>Awesome!</span><i class="fas fa-star"></i>
          </button>
        </div>`);
    } catch (err) {
      App.showToast(err.message || 'Check-in failed', 'error');
    }
  },

  // ─── Start Quiz Mission ───────────────────────────────────────────────────
  startQuiz(mission) {
    if (!mission.quiz || mission.quiz.length === 0) {
      App.showToast('No quiz questions found', 'error');
      return;
    }

    let currentQ = 0;
    let answers = [];

    const showQuestion = () => {
      const q = mission.quiz[currentQ];
      App.showModal(`
        <div class="quiz-progress">
          <span>Q${currentQ + 1}/${mission.quiz.length}</span>
          <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${((currentQ + 1) / mission.quiz.length) * 100}%"></div></div>
          <span>${mission.rewardPoints} pts</span>
        </div>
        <div class="quiz-question">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" id="qopt-${i}" onclick="GeoHunt.selectAnswer(${i}, ${currentQ}, ${JSON.stringify(answers).replace(/"/g, "'")})">
              ${opt}
            </button>`).join('')}
        </div>`);
    };

    GeoHunt._quizState = { mission, currentQ: 0, answers: [], showQuestion };
    showQuestion();
  },

  selectAnswer(answerIdx, questionIdx, prevAnswers) {
    if (!GeoHunt._quizState) return;
    const { mission } = GeoHunt._quizState;
    const answers = [...prevAnswers, answerIdx];
    const q = mission.quiz[questionIdx];

    // Show correct/wrong
    mission.quiz[questionIdx].options.forEach((_, i) => {
      const btn = document.getElementById(`qopt-${i}`);
      if (btn) {
        btn.classList.add(i === q.answer ? 'correct' : 'wrong');
        btn.disabled = true;
      }
    });

    setTimeout(async () => {
      if (answers.length < mission.quiz.length) {
        GeoHunt._quizState.answers = answers;
        GeoHunt._quizState.currentQ = questionIdx + 1;
        GeoHunt._quizState.showQuestion();
      } else {
        // All answered - submit
        try {
          const res = await API.submitQuiz(mission._id, answers);
          const passed = res.passed || (res.score >= 60);
          const emoji = res.score >= 80 ? '🏆' : res.score >= 60 ? '🎉' : '😅';

          if (passed) {
            mission.completed = true;
            GeoHunt.missions = GeoHunt.missions.map(m => m._id === mission._id ? { ...m, completed: true } : m);

            if (res.pointsEarned > 0 && Auth.currentUser) {
              Auth.currentUser.points = res.newTotal || ((Auth.currentUser.points || 0) + res.pointsEarned);
              localStorage.setItem('bv_user', JSON.stringify(Auth.currentUser));
              const ptsDisplay = document.getElementById('user-points-display');
              if (ptsDisplay) ptsDisplay.textContent = Auth.currentUser.points;
            }
          }

          App.showModal(`
            <div style="text-align:center;padding:1rem">
              <div style="font-size:3.5rem">${emoji}</div>
              <h3 style="margin:0.75rem 0 0.25rem">${passed ? 'Quiz Passed!' : 'Try Again'}</h3>
              <p style="font-size:2rem;font-weight:800;color:var(--gold)">${res.score}%</p>
              <p style="color:var(--text-secondary)">${res.correct || 0}/${mission.quiz.length} correct</p>
              ${res.pointsEarned > 0 
                ? `<p style="color:var(--gold);font-weight:700;margin-top:0.5rem">+${res.pointsEarned} Points Earned!</p>`
                : (passed && res.alreadyCompleted ? `<p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem">Points previously claimed for this mission.</p>` : '')}
              <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal();${GeoHunt.activeTab === 'missions' ? 'GeoHunt.switchTab(\'missions\')' : ''}">
                <span>Continue</span>
              </button>
            </div>`);
        } catch {
          // Offline fallback
          let correctCount = 0;
          answers.forEach((ans, idx) => {
            if (mission.quiz[idx] && ans === mission.quiz[idx].answer) correctCount++;
          });
          const score = Math.round((correctCount / mission.quiz.length) * 100);
          const passed = score >= 60;

          if (passed && !mission.completed) {
            mission.completed = true;
            GeoHunt.missions = GeoHunt.missions.map(m => m._id === mission._id ? { ...m, completed: true } : m);
            if (Auth.currentUser) {
              Auth.currentUser.points = (Auth.currentUser.points || 0) + (mission.rewardPoints || 50);
              localStorage.setItem('bv_user', JSON.stringify(Auth.currentUser));
              const ptsDisplay = document.getElementById('user-points-display');
              if (ptsDisplay) ptsDisplay.textContent = Auth.currentUser.points;
            }
          }

          App.showModal(`
            <div style="text-align:center;padding:1rem">
              <div style="font-size:3.5rem">${passed ? '🏆' : '😅'}</div>
              <h3 style="margin:0.75rem 0 0.25rem">${passed ? 'Quiz Passed!' : 'Try Again'}</h3>
              <p style="font-size:2rem;font-weight:800;color:var(--gold)">${score}%</p>
              <p style="color:var(--text-secondary)">${correctCount}/${mission.quiz.length} correct</p>
              <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal();${GeoHunt.activeTab === 'missions' ? 'GeoHunt.switchTab(\'missions\')' : ''}">
                <span>Continue</span>
              </button>
            </div>`);
        }
      }
    }, 800);
  },

  // ─── Render Map Tab ───────────────────────────────────────────────────────
  renderMap(container) {
    if (GeoHunt.map) {
      try { GeoHunt.map.remove(); } catch(e) {}
      GeoHunt.map = null;
      GeoHunt.userMarker = null;
    }

    container.innerHTML = '<div id="map-container" style="height:calc(100vh - 220px);border-radius:var(--radius-lg);overflow:hidden;margin:0.75rem 0.5rem;box-shadow:0 8px 30px rgba(0,0,0,0.3)"></div>';

    setTimeout(() => {
      const mapEl = document.getElementById('map-container');
      if (!mapEl) return;

      const lat = GeoHunt.userLat || 20.5937;
      const lng = GeoHunt.userLng || 78.9629;
      const zoom = (GeoHunt.userLat && GeoHunt.userLng) ? 9 : 5;

      GeoHunt.map = L.map('map-container', { zoomControl: true }).setView([lat, lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(GeoHunt.map);

      // User location marker
      if (GeoHunt.userLat && GeoHunt.userLng) {
        const userIcon = L.divIcon({
          html: '<div style="width:18px;height:18px;background:#D4AF37;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(212,175,55,0.8)"></div>',
          iconSize: [18, 18], className: ''
        });
        GeoHunt.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(GeoHunt.map)
          .bindPopup('<b>📍 Your Current Location</b>');
      }

      // Heritage site markers
      if (GeoHunt.missions && GeoHunt.missions.length > 0) {
        GeoHunt.missions.forEach(m => {
          if (!m.location || !m.location.lat || !m.location.lng) return;
          const isDone = m.completed;
          const missionIcon = L.divIcon({
            html: `<div style="background:${isDone ? '#4caf50' : 'var(--saffron)'};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4)">
              <span style="transform:rotate(45deg);font-size:14px">${isDone ? '✅' : '🗺️'}</span>
            </div>`,
            iconSize: [32, 32], className: ''
          });
          const marker = L.marker([m.location.lat, m.location.lng], { icon: missionIcon }).addTo(GeoHunt.map);
          marker.bindPopup(`
            <div style="font-family:var(--font-sans);min-width:140px">
              <b style="color:#111;font-size:0.92rem">${m.title}</b>
              <div style="color:#b8860b;font-weight:700;font-size:0.8rem;margin:4px 0">${m.rewardPoints} XP • ${m.difficulty || 'easy'}</div>
              <button style="width:100%;margin-top:6px;padding:6px 10px;background:#ff6b35;color:white;border:none;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:600"
                onclick="GeoHunt.openMission('${m._id}')">
                ${isDone ? 'View Mission ✅' : 'Open Mission 🚀'}
              </button>
            </div>
          `);
        });
      }

      // Force Leaflet to recalculate container dimensions immediately and after 200ms
      setTimeout(() => {
        if (GeoHunt.map) GeoHunt.map.invalidateSize();
      }, 200);
    }, 100);
  },

  // ─── Render Leaderboard ───────────────────────────────────────────────────
  async renderLeaderboard(container) {
    container.innerHTML = '<div class="leaderboard"><div class="skeleton skeleton-card"></div></div>';
    try {
      const res = await API.getLeaderboard();
      const medals = ['🥇', '🥈', '🥉'];
      container.innerHTML = `
        <div class="leaderboard">
          <h3 style="margin-bottom:1rem;padding:0 0.5rem">🏆 Top Heritage Explorers</h3>
          ${res.data.map((user, i) => `
            <div class="leader-item ${i < 3 ? 'top3' : ''}">
              <div class="leader-rank ${i < 3 ? 'rank-' + (i + 1) : ''}">
                ${i < 3 ? medals[i] : i + 1}
              </div>
              <div class="leader-avatar">${Auth.getInitials(user.name)}</div>
              <div class="leader-info">
                <div class="leader-name">${user.name}</div>
                <div class="leader-state">${user.state || 'Explorer'} • Lvl ${user.level}</div>
              </div>
              <div class="leader-pts">${user.points.toLocaleString()}</div>
            </div>`).join('')}
        </div>`;
    } catch {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><h3>No data yet</h3></div>';
    }
  }
};

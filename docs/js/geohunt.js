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

      <div class="geohunt-tabs" id="geohunt-tabs">
        <button class="geohunt-tab-btn ${GeoHunt.activeTab === 'missions' ? 'active' : ''}"
          id="geohunt-tab-missions" data-tab="missions"
          onclick="GeoHunt.switchTab('missions')">
          <i class="fas fa-tasks"></i> Missions
        </button>
        <button class="geohunt-tab-btn ${GeoHunt.activeTab === 'map' ? 'active' : ''}"
          id="geohunt-tab-map" data-tab="map"
          onclick="GeoHunt.switchTab('map')">
          <i class="fas fa-map-marked-alt"></i> Map
        </button>
        <button class="geohunt-tab-btn ${GeoHunt.activeTab === 'leaderboard' ? 'active' : ''}"
          id="geohunt-tab-leaderboard" data-tab="leaderboard"
          onclick="GeoHunt.switchTab('leaderboard')">
          <i class="fas fa-trophy"></i> Leaderboard
        </button>
      </div>

      <div id="geohunt-tab-content"></div>`;

    GeoHunt.switchTab(GeoHunt.activeTab);
    GeoHunt.getUserLocation();
  },

  // ─── Switch Tab ───────────────────────────────────────────────────────────
  switchTab(tab) {
    GeoHunt.activeTab = tab;

    // Update active state on all tab buttons
    document.querySelectorAll('.geohunt-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Cleanup map if switching away from map tab
    if (tab !== 'map' && GeoHunt.map) {
      try {
        GeoHunt.map.remove();
      } catch (e) {}
      GeoHunt.map = null;
      GeoHunt.userMarker = null;
    }

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

  fallbackMissions: [
    {
      _id: 'gh_m_01',
      title: 'Golden Sanctuary Explorer',
      description: 'Visit Sri Harmandir Sahib (Golden Temple) in Amritsar and discover the spiritual sanctity of Amrit Sarovar.',
      type: 'quiz',
      difficulty: 'easy',
      rewardPoints: 150,
      rewardBadge: { name: 'Golden Pilgrim', icon: '🪷' },
      location: { lat: 31.6200, lng: 74.8765 },
      distance: null,
      quiz: [
        {
          question: 'What is the sacred pool surrounding the Golden Temple known as?',
          options: ['Amrit Sarovar', 'Ganga Sagar', 'Manas Sarovar', 'Pushkar Lake'],
          answer: 0
        },
        {
          question: 'Who laid the foundation stone of the Golden Temple in 1589?',
          options: ['Guru Arjan Dev Ji & Sai Mian Mir', 'Guru Nanak Dev Ji', 'Maharaja Ranjit Singh', 'Banda Singh Bahadur'],
          answer: 0
        },
        {
          question: 'Which Maharaja overlaid the upper sanctum with genuine gold foils in 1830?',
          options: ['Maharaja Ranjit Singh', 'Maharaja Bhupinder Singh', 'Maharaja Jagatjit Singh', 'Maharaja Gulab Singh'],
          answer: 0
        }
      ]
    },
    {
      _id: 'gh_m_02',
      title: 'Imperial Citadel of Agra Fort',
      description: 'Explore the red sandstone walls and marble courtyards of the Mughal imperial fortress.',
      type: 'quiz',
      difficulty: 'medium',
      rewardPoints: 180,
      rewardBadge: { name: 'Citadel Master', icon: '🏰' },
      location: { lat: 27.1795, lng: 78.0211 },
      distance: null,
      quiz: [
        {
          question: 'Which Mughal Emperor primarily built the current red sandstone structure of Agra Fort?',
          options: ['Emperor Akbar', 'Emperor Babur', 'Emperor Shah Jahan', 'Emperor Aurangzeb'],
          answer: 0
        },
        {
          question: 'Which octagonal tower inside Agra Fort offers a direct view of the Taj Mahal?',
          options: ['Musamman Burj', 'Sheesh Mahal', 'Khas Mahal', 'Jahangiri Mahal'],
          answer: 0
        },
        {
          question: 'Agra Fort was declared a UNESCO World Heritage site in which year?',
          options: ['1983', '1995', '2001', '1975'],
          answer: 0
        }
      ]
    },
    {
      _id: 'gh_m_03',
      title: 'Queen’s Subterranean Stepwell',
      description: 'Uncover the 7-tier architectural masterpiece of Rani ki Vav in Patan, Gujarat.',
      type: 'quiz',
      difficulty: 'medium',
      rewardPoints: 200,
      rewardBadge: { name: 'Stepwell Scholar', icon: '💧' },
      location: { lat: 23.8589, lng: 72.1014 },
      distance: null,
      quiz: [
        {
          question: 'Who commissioned the construction of Rani ki Vav in memory of King Bhima I?',
          options: ['Queen Udayamati', 'Queen Ahilyabai', 'Queen Rudradeva', 'Queen Padmini'],
          answer: 0
        },
        {
          question: 'Rani ki Vav is built in which distinctive architectural style?',
          options: ['Maru-Gurjara style', 'Dravidian style', 'Vesara style', 'Indo-Saracenic'],
          answer: 0
        },
        {
          question: 'On which Indian Rupee banknote is Rani ki Vav featured?',
          options: ['₹100 banknote (Lavender)', '₹500 banknote', '₹50 banknote', '₹200 banknote'],
          answer: 0
        }
      ]
    },
    {
      _id: 'gh_m_04',
      title: 'Invincible Ramparts of Kumbhalgarh',
      description: 'Walk the 36-kilometer Great Wall of India at Kumbhalgarh Fort in the Aravalli Hills.',
      type: 'quiz',
      difficulty: 'hard',
      rewardPoints: 250,
      rewardBadge: { name: 'Highland Guardian', icon: '🛡️' },
      location: { lat: 25.1479, lng: 73.5877 },
      distance: null,
      quiz: [
        {
          question: 'Which legendary Rajput ruler built the massive Kumbhalgarh Fort in the 15th century?',
          options: ['Rana Kumbha', 'Maharana Pratap', 'Rana Sanga', 'Rana Ratan Singh'],
          answer: 0
        },
        {
          question: 'Kumbhalgarh fort wall is famous worldwide as:',
          options: ['The second-longest continuous wall in the world', 'The tallest fort in Asia', 'The oldest moat in India', 'The fastest built fortress'],
          answer: 0
        },
        {
          question: 'Which legendary Mewar warrior was born inside Kumbhalgarh at Badal Mahal?',
          options: ['Maharana Pratap', 'Rana Amar Singh', 'Bappa Rawal', 'Prithviraj Chauhan'],
          answer: 0
        }
      ]
    },
    {
      _id: 'gh_m_05',
      title: 'Jallianwala Memorial Pilgrimage',
      description: 'Honor the martyrs of the 1919 freedom struggle in the historic city of Amritsar.',
      type: 'checkin',
      difficulty: 'easy',
      rewardPoints: 120,
      rewardBadge: { name: 'Freedom Sentinel', icon: '🕊️' },
      location: { lat: 31.6206, lng: 74.8801 },
      distance: null
    },
    {
      _id: 'gh_m_06',
      title: 'Nawabi Grandeur of Bara Imambara',
      description: 'Explore the gravity-defying central vault and the intricate labyrinths of Bhool Bhulaiya.',
      type: 'quiz',
      difficulty: 'medium',
      rewardPoints: 175,
      rewardBadge: { name: 'Awadh Connoisseur', icon: '🏛️' },
      location: { lat: 26.8688, lng: 80.9129 },
      distance: null,
      quiz: [
        {
          question: 'Which Nawab of Awadh built Bara Imambara during the famine of 1784 as a food-for-work initiative?',
          options: ['Nawab Asaf-ud-Daula', 'Nawab Wajid Ali Shah', 'Nawab Saadat Ali Khan', 'Nawab Shuja-ud-Daula'],
          answer: 0
        },
        {
          question: 'What is unique about the central arched hall of Bara Imambara?',
          options: ['Built entirely without any supporting pillars or beams', 'Built with pure white Makrana marble', 'Has 100 golden domes', 'Has an underwater passage to Delhi'],
          answer: 0
        }
      ]
    },
    {
      _id: 'gh_m_07',
      title: 'Harappan Maritime Gateway of Lothal',
      description: 'Discover the world’s oldest known tidal dockyard and ancient Indus Valley trade port in Gujarat.',
      type: 'quiz',
      difficulty: 'hard',
      rewardPoints: 220,
      rewardBadge: { name: 'Indus Navigator', icon: '⚓' },
      location: { lat: 22.5225, lng: 72.2492 },
      distance: null,
      quiz: [
        {
          question: 'What revolutionary engineering marvel was discovered at Lothal?',
          options: ['A massive tidal dockyard connected to the Sabarmati river', 'The earliest iron smelter in Asia', 'The world’s first steam mill', 'A subterranean gold mine'],
          answer: 0
        },
        {
          question: 'Which ancient civilization traded directly with the merchants of Lothal?',
          options: ['Mesopotamia & Persian Gulf', 'Roman Empire', 'Inca Empire', 'Song Dynasty'],
          answer: 0
        }
      ]
    },
    {
      _id: 'gh_m_08',
      title: 'Solar Chariot of Modhera Sun Temple',
      description: 'Witness the geometry where equinox rays illuminate the sanctum of Surya Deva in Mehsana.',
      type: 'quiz',
      difficulty: 'medium',
      rewardPoints: 190,
      rewardBadge: { name: 'Solar Disciple', icon: '☀️' },
      location: { lat: 23.5835, lng: 72.1332 },
      distance: null,
      quiz: [
        {
          question: 'The Sun Temple at Modhera is situated along the banks of which river?',
          options: ['Pushpavati River', 'Narmada River', 'Tapi River', 'Mahi River'],
          answer: 0
        },
        {
          question: 'The stepped reservoir in front of the temple complex is called:',
          options: ['Surya Kund (Ramakund)', 'Soma Kund', 'Ganga Kund', 'Brahma Sarovar'],
          answer: 0
        }
      ]
    },
    {
      _id: 'gh_m_09',
      title: 'Ram Tirath Hermitage of Valmiki',
      description: 'Pay homage to the sacred ashram of Maharishi Valmiki and birth site of Luv and Kush in Amritsar.',
      type: 'checkin',
      difficulty: 'easy',
      rewardPoints: 130,
      rewardBadge: { name: 'Ramayana Scholar', icon: '🏹' },
      location: { lat: 31.6833, lng: 74.7500 },
      distance: null
    },
    {
      _id: 'gh_m_10',
      title: 'Pride of Mewar: Chittorgarh Fort',
      description: 'Stand atop India’s largest fortress and explore Vijay Stambha (Tower of Victory).',
      type: 'quiz',
      difficulty: 'hard',
      rewardPoints: 260,
      rewardBadge: { name: 'Mewar Sovereign', icon: '🚩' },
      location: { lat: 24.8879, lng: 74.6453 },
      distance: null,
      quiz: [
        {
          question: 'Which legendary 9-story monument in Chittorgarh was erected by Rana Kumbha to commemorate his victory over Mahmud Khilji?',
          options: ['Vijay Stambha', 'Kirti Stambha', 'Padmini Palace', 'Ratan Singh Palace'],
          answer: 0
        },
        {
          question: 'Chittorgarh Fort sits atop a high hill that sprawls across how many acres?',
          options: ['Approximately 700 acres', '50 acres', '2,500 acres', '100 acres'],
          answer: 0
        }
      ]
    }
  ],

  // ─── Load Missions ────────────────────────────────────────────────────────
  async loadMissions() {
    try {
      const res = await API.getMissions(GeoHunt.userLat, GeoHunt.userLng);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        GeoHunt.missions = res.data;
      } else {
        GeoHunt.populateFallbackMissions();
      }
    } catch {
      GeoHunt.populateFallbackMissions();
    }

    if (GeoHunt.activeTab === 'missions') {
      const content = document.getElementById('geohunt-tab-content');
      if (content) GeoHunt.renderMissions(content);
    }
  },

  populateFallbackMissions() {
    const completedIds = (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.completedMissions)
      ? Auth.currentUser.completedMissions.map(String)
      : [];

    GeoHunt.missions = GeoHunt.fallbackMissions.map(m => {
      let distance = null;
      if (GeoHunt.userLat && GeoHunt.userLng && m.location) {
        const rad = Math.PI / 180;
        const dLat = (m.location.lat - GeoHunt.userLat) * rad;
        const dLng = (m.location.lng - GeoHunt.userLng) * rad;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(GeoHunt.userLat * rad) * Math.cos(m.location.lat * rad) * Math.sin(dLng / 2) ** 2;
        distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      return {
        ...m,
        completed: completedIds.includes(m._id),
        distance
      };
    });

    // Sort by distance if GPS is active, otherwise by points
    if (GeoHunt.userLat && GeoHunt.userLng) {
      GeoHunt.missions.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    } else {
      GeoHunt.missions.sort((a, b) => (b.rewardPoints || 0) - (a.rewardPoints || 0));
    }
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
    if (!mission || !mission.quiz || mission.quiz.length === 0) {
      App.showToast('No quiz questions found for this mission', 'error');
      return;
    }

    GeoHunt._quizState = {
      mission,
      currentQ: 0,
      answers: [],
      correctCount: 0
    };

    GeoHunt.renderQuizQuestion();
  },

  renderQuizQuestion() {
    const state = GeoHunt._quizState;
    if (!state || !state.mission || !state.mission.quiz) return;

    const { mission, currentQ } = state;
    const q = mission.quiz[currentQ];
    if (!q) {
      GeoHunt.submitQuizResult();
      return;
    }

    App.showModal(`
      <div class="quiz-progress" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
        <span style="font-size:0.8rem;color:var(--text-secondary);font-weight:700">Question ${currentQ + 1} of ${mission.quiz.length}</span>
        <span style="font-size:0.8rem;color:var(--gold);font-weight:700">+${mission.rewardPoints || 100} pts</span>
      </div>
      <div class="quiz-bar" style="height:4px;background:var(--card-bg2);border-radius:2px;margin-bottom:1.25rem;overflow:hidden">
        <div class="quiz-bar-fill" style="height:100%;background:var(--grad-gold);width:${((currentQ + 1) / mission.quiz.length) * 100}%;transition:width 0.3s"></div>
      </div>
      <div class="quiz-question" style="font-size:1rem;font-weight:700;line-height:1.5;margin-bottom:1.25rem;color:var(--text-primary)">
        ${q.question}
      </div>
      <div class="quiz-options" style="display:flex;flex-direction:column;gap:0.65rem">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" id="qopt-${i}" onclick="GeoHunt.selectAnswer(${i})">
            ${opt}
          </button>`).join('')}
      </div>`);
  },

  selectAnswer(answerIdx) {
    const state = GeoHunt._quizState;
    if (!state) return;

    const { mission, currentQ } = state;
    const q = mission.quiz[currentQ];
    if (!q) return;

    // Disable all option buttons immediately
    document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);

    const isCorrect = (q.answer !== undefined && q.answer !== null) ? (answerIdx === q.answer) : true;
    if (isCorrect) state.correctCount++;

    const chosenBtn = document.getElementById(`qopt-${answerIdx}`);
    if (chosenBtn) {
      chosenBtn.classList.add(isCorrect ? 'correct' : 'wrong');
      chosenBtn.style.borderColor = isCorrect ? 'var(--success)' : 'var(--danger)';
      chosenBtn.style.background = isCorrect ? 'rgba(46, 125, 91, 0.2)' : 'rgba(192, 57, 43, 0.2)';
    }

    if (!isCorrect && q.answer !== undefined) {
      const correctBtn = document.getElementById(`qopt-${q.answer}`);
      if (correctBtn) {
        correctBtn.classList.add('correct');
        correctBtn.style.borderColor = 'var(--success)';
        correctBtn.style.background = 'rgba(46, 125, 91, 0.2)';
      }
    }

    state.answers.push(answerIdx);

    setTimeout(() => {
      if (state.currentQ < state.mission.quiz.length - 1) {
        state.currentQ++;
        GeoHunt.renderQuizQuestion();
      } else {
        GeoHunt.submitQuizResult();
      }
    }, 700);
  },

  async submitQuizResult() {
    const state = GeoHunt._quizState;
    if (!state) return;

    const { mission, answers, correctCount } = state;
    const total = mission.quiz.length;

    App.showModal(`
      <div style="text-align:center;padding:2rem 1rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--gold);margin-top:1rem;font-weight:600">Verifying your heritage mission...</p>
      </div>`);

    let res = null;
    try {
      res = await API.submitQuiz(mission._id, answers);
    } catch (e) {
      console.warn('API submitQuiz error, using local computation:', e.message);
    }

    const score = (res && res.score !== undefined) ? res.score : Math.round((correctCount / total) * 100);
    const passed = (res && res.passed !== undefined) ? res.passed : (score >= 60);
    const ptsEarned = (res && res.pointsEarned !== undefined) ? res.pointsEarned : (passed ? (mission.rewardPoints || 100) : 0);
    const emoji = score >= 80 ? '🏆' : passed ? '🎉' : '💪';

    if (passed) {
      mission.completed = true;
      GeoHunt.missions = GeoHunt.missions.map(m => m._id === mission._id ? { ...m, completed: true } : m);

      if (ptsEarned > 0 && Auth.currentUser) {
        if (res && res.newTotal !== undefined) {
          Auth.currentUser.points = res.newTotal;
        } else {
          Auth.currentUser.points = (Auth.currentUser.points || 0) + ptsEarned;
          API.awardPoints(ptsEarned, `mission_${mission._id}`).catch(() => {});
        }
        Auth.currentUser.level = Math.floor(Auth.currentUser.points / 500) + 1;
        if (!Auth.currentUser.completedMissions) Auth.currentUser.completedMissions = [];
        if (!Auth.currentUser.completedMissions.includes(mission._id)) {
          Auth.currentUser.completedMissions.push(mission._id);
        }
        localStorage.setItem('bv_user', JSON.stringify(Auth.currentUser));
        const ptsDisplay = document.getElementById('user-points-display');
        if (ptsDisplay) ptsDisplay.textContent = Auth.currentUser.points;
      }
    }

    App.showModal(`
      <div style="text-align:center;padding:1.25rem 0.5rem">
        <div style="font-size:3.5rem;margin-bottom:0.5rem">${emoji}</div>
        <h3 style="margin:0 0 0.35rem;font-size:1.3rem;color:var(--text-primary)">${passed ? 'Mission Expedition Conquered!' : 'Expedition Incomplete'}</h3>
        <p style="font-size:2.2rem;font-weight:800;color:var(--gold);margin:0.5rem 0">${score}%</p>
        <p style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:1rem">${correctCount} of ${total} answers correct</p>
        
        ${ptsEarned > 0 ? `
          <div style="background:rgba(212,175,55,0.12);border:1px solid var(--gold);border-radius:var(--radius-md);padding:0.75rem;margin-bottom:1.25rem">
            <div style="color:var(--gold);font-weight:800;font-size:1.1rem">+${ptsEarned} Explorer XP Awarded!</div>
            <div style="color:var(--text-muted);font-size:0.78rem;margin-top:2px">Added to your total points and global leaderboard rank.</div>
          </div>
        ` : (passed ? `<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem">Points previously claimed for this mission.</p>` : `<p style="color:var(--danger);font-size:0.85rem;margin-bottom:1rem">Score at least 60% to earn points for this expedition.</p>`)}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <button class="btn-secondary" onclick="App.closeModal();GeoHunt.switchTab('missions')">
            <i class="fas fa-map"></i> Missions
          </button>
          <button class="btn-primary" onclick="App.closeModal();GeoHunt.switchTab('leaderboard')">
            <i class="fas fa-trophy"></i> Leaderboard
          </button>
        </div>
      </div>`);

    GeoHunt._quizState = null;
  },

  // ─── Render Map Tab ───────────────────────────────────────────────────────
  renderMap(container) {
    if (GeoHunt.map) {
      try { GeoHunt.map.remove(); } catch(e) {}
      GeoHunt.map = null;
      GeoHunt.userMarker = null;
    }

    container.innerHTML = `
      <div style="padding:0.75rem 0.5rem 0.25rem;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.85rem;color:var(--text-secondary)"><i class="fas fa-map-pin" style="color:var(--gold);margin-right:4px"></i> Interactive Heritage Map</span>
        <button class="btn-secondary" style="padding:4px 10px;font-size:0.75rem;border-radius:12px" onclick="GeoHunt.getUserLocation()">
          <i class="fas fa-crosshairs"></i> Recenter
        </button>
      </div>
      <div id="map-container" style="height:calc(100vh - 240px);min-height:380px;border-radius:var(--radius-lg);overflow:hidden;margin:0.5rem;box-shadow:0 8px 30px rgba(0,0,0,0.35);border:1px solid var(--border)"></div>`;

    setTimeout(async () => {
      const mapEl = document.getElementById('map-container');
      if (!mapEl) return;

      if (!GeoHunt.missions || GeoHunt.missions.length === 0) {
        await GeoHunt.loadMissions();
      }

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
          html: '<div style="width:18px;height:18px;background:#D4AF37;border-radius:50%;border:3px solid white;box-shadow:0 0 14px rgba(212,175,55,0.9)"></div>',
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
            html: `<div style="background:${isDone ? '#4caf50' : '#ff6b35'};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4)">
              <span style="transform:rotate(45deg);font-size:14px">${isDone ? '✅' : '🏛️'}</span>
            </div>`,
            iconSize: [32, 32], className: ''
          });
          const marker = L.marker([m.location.lat, m.location.lng], { icon: missionIcon }).addTo(GeoHunt.map);
          marker.bindPopup(`
            <div style="font-family:var(--font-sans);min-width:150px;padding:4px">
              <b style="color:#111;font-size:0.92rem;display:block;margin-bottom:2px">${m.title}</b>
              <div style="color:#b8860b;font-weight:700;font-size:0.8rem;margin:4px 0">${m.rewardPoints} XP • ${m.difficulty || 'easy'}</div>
              <button style="width:100%;margin-top:6px;padding:6px 10px;background:#ff6b35;color:white;border:none;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:600"
                onclick="GeoHunt.openMission('${m._id}')">
                ${isDone ? 'View Mission ✅' : 'Open Mission 🚀'}
              </button>
            </div>
          `);
        });
      }

      // Invalidate size on animation frame and timeouts
      requestAnimationFrame(() => {
        if (GeoHunt.map) GeoHunt.map.invalidateSize();
      });
      setTimeout(() => {
        if (GeoHunt.map) GeoHunt.map.invalidateSize();
      }, 250);
    }, 100);
  },

  // ─── Render Leaderboard ───────────────────────────────────────────────────
  async renderLeaderboard(container) {
    container.innerHTML = '<div class="leaderboard"><div class="skeleton skeleton-card"></div></div>';
    try {
      const res = await API.getLeaderboard();
      const medals = ['🥇', '🥈', '🥉'];
      let leaders = (res && res.data && Array.isArray(res.data)) ? res.data : [];

      // Sync active logged-in user points and ensure correct rank placement
      const current = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
      if (current) {
        // Sync local points with backend asynchronously
        if (current.points > 0) {
          API.syncPoints(current.points).catch(() => {});
        }

        const foundIdx = leaders.findIndex(u => 
          (u._id && current._id && u._id.toString() === current._id.toString()) || 
          (u.name && current.name && u.name.toLowerCase() === current.name.toLowerCase())
        );

        if (foundIdx !== -1) {
          leaders[foundIdx].points = Math.max(leaders[foundIdx].points || 0, current.points || 0);
          leaders[foundIdx].level = Math.floor((leaders[foundIdx].points || 0) / 500) + 1;
        } else if (current.name) {
          leaders.push({
            _id: current._id,
            name: current.name,
            points: current.points || 0,
            level: current.level || Math.floor((current.points || 0) / 500) + 1,
            state: current.state || 'Explorer'
          });
        }

        leaders.sort((a, b) => (b.points || 0) - (a.points || 0));
      }

      container.innerHTML = `
        <div class="leaderboard">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;padding:0 0.5rem">
            <h3 style="margin:0;font-size:1.1rem;color:var(--gold)">🏆 Top Heritage Explorers</h3>
            <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:600">Global Ranks</span>
          </div>
          ${leaders.map((user, i) => {
            const isMe = current && (
              (user._id && current._id && user._id.toString() === current._id.toString()) ||
              (user.name && current.name && user.name.toLowerCase() === current.name.toLowerCase())
            );
            return `
              <div class="leader-item ${i < 3 ? 'top3' : ''}" style="${isMe ? 'border-color:var(--gold);background:rgba(212,175,55,0.12);box-shadow:var(--shadow-gold)' : ''}">
                <div class="leader-rank ${i < 3 ? 'rank-' + (i + 1) : ''}">
                  ${i < 3 ? medals[i] : (i + 1)}
                </div>
                <div class="leader-avatar">${Auth.getInitials(user.name)}</div>
                <div class="leader-info">
                  <div class="leader-name" style="display:flex;align-items:center;gap:6px">
                    <span>${user.name}</span>
                    ${isMe ? '<span style="background:var(--grad-gold);color:var(--deep-blue);font-size:0.58rem;font-weight:800;padding:2px 6px;border-radius:10px">YOU</span>' : ''}
                  </div>
                  <div class="leader-state">${user.state || 'Explorer'} • Level ${user.level || 1}</div>
                </div>
                <div class="leader-pts">${(user.points || 0).toLocaleString()} pts</div>
              </div>`;
          }).join('')}
        </div>`;
    } catch {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><h3>No data yet</h3></div>';
    }
  }
};

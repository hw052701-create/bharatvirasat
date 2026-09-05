// ── ai.js — HeriSense AI Guide Module ───────────────────────────────────────
const AIGuide = {
  chatHistory: [],

  // ─── Render AI Page ───────────────────────────────────────────────────────
  render() {
    document.getElementById('app-content').innerHTML = `
      <div class="ai-header">
        <div class="ai-avatar">🤖</div>
        <h2>HeriSense AI</h2>
        <p>Your personal Indian Heritage Guide</p>
      </div>

      <div class="ai-features">
        <div class="ai-feature" onclick="AIGuide.startMonumentInfo()">
          <i class="fas fa-landmark"></i>
          <span>Monument Info</span>
        </div>
        <div class="ai-feature" onclick="AIGuide.startQuiz()">
          <i class="fas fa-brain"></i>
          <span>Heritage Quiz</span>
        </div>
        <div class="ai-feature" onclick="AIGuide.startStory()">
          <i class="fas fa-book-open"></i>
          <span>AI Story</span>
        </div>
      </div>

      <div class="chat-container">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg">
            <div class="msg-avatar ai-msg-avatar">🤖</div>
            <div class="msg-bubble ai-bubble">
              <b>Namaste! I'm HeriSense AI 🙏</b><br><br>
              I'm your personal guide to India's incredible heritage. Ask me about:<br>
              • Any monument or heritage site<br>
              • Indian festivals and traditions<br>
              • History, dynasties, and rulers<br>
              • Folk art, dance, or music<br><br>
              What would you like to discover today?
            </div>
          </div>

          ${AIGuide.chatHistory.slice(-10).map(msg => AIGuide.renderMessage(msg)).join('')}
        </div>

        <div class="chat-input-bar">
          <textarea class="chat-input" id="chat-input" placeholder="Ask me about any heritage site..."
            rows="1" onkeydown="AIGuide.handleKey(event)"
            oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
          <button class="chat-send-btn" onclick="AIGuide.sendMessage()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>`;

    // Auto-focus chat
    setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
  },

  // ─── Render Message ───────────────────────────────────────────────────────
  renderMessage(msg) {
    const isUser = msg.role === 'user';
    return `
      <div class="chat-msg ${isUser ? 'user' : ''}">
        <div class="msg-avatar ${isUser ? 'user-msg-avatar' : 'ai-msg-avatar'}">
          ${isUser ? Auth.getInitials(Auth.currentUser?.name) : '🤖'}
        </div>
        <div class="msg-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}">
          ${msg.text.replace(/\n/g, '<br>')}
        </div>
      </div>`;
  },

  // ─── Handle Keyboard ──────────────────────────────────────────────────────
  handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      AIGuide.sendMessage();
    }
  },

  // ─── Send Message ─────────────────────────────────────────────────────────
  async sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    input.style.height = 'auto';

    // Add user message
    AIGuide.chatHistory.push({ role: 'user', text: message });
    AIGuide.appendMessage({ role: 'user', text: message });
    AIGuide.showTyping();

    try {
      const res = await API.aiChat(message, AIGuide.chatHistory.slice(-10));
      AIGuide.hideTyping();
      if (res && res.reply) {
        AIGuide.chatHistory.push({ role: 'model', text: res.reply });
        AIGuide.appendMessage({ role: 'model', text: res.reply });
      } else {
        throw new Error('No reply from server');
      }
    } catch (err) {
      AIGuide.hideTyping();
      const fallbackReply = AIGuide.getInstantAnswer(message);
      AIGuide.chatHistory.push({ role: 'model', text: fallbackReply });
      AIGuide.appendMessage({ role: 'model', text: fallbackReply });
    }
  },

  // ─── Instant Built-in Knowledge Engine ─────────────────────────────────────
  getInstantAnswer(message) {
    const q = message.toLowerCase();
    if (q.includes('taj') || q.includes('agra')) {
      return '🙏 **Taj Mahal, Agra:** Built between 1631-1653 by Mughal Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal. Made of pure white Makrana marble on the banks of the Yamuna River, it is universally recognized as a masterpiece of UNESCO World Heritage.';
    }
    if (q.includes('ajanta') || q.includes('caves')) {
      return '🙏 **Ajanta Caves, Maharashtra:** 30 magnificent rock-cut Buddhist cave monuments dating from 2nd century BCE to 480 CE. They feature world-famous fresco murals, depictions of the Jataka tales, and serene statues of the Buddha.';
    }
    if (q.includes('ellora') || q.includes('kailasa')) {
      return '🙏 **Ellora Caves & Kailasa Temple:** A spectacular UNESCO complex of 100 rock-cut caves carved into the Sahyadri hills, representing Buddhist, Hindu, and Jain harmony. Cave 16 (Kailasa Temple) was carved top-to-bottom from a single colossal basalt rock!';
    }
    if (q.includes('hampi') || q.includes('karnataka')) {
      return '🙏 **Hampi, Karnataka:** The ancient capital of the 14th-century Vijayanagara Empire. Famous for its surreal boulder-strewn landscapes, the iconic Stone Chariot, and the towering Virupaksha Temple by the Tungabhadra River.';
    }
    if (q.includes('red fort') || q.includes('lal qila') || q.includes('delhi')) {
      return '🙏 **Red Fort (Lal Qila), Delhi:** Built by Emperor Shah Jahan in 1638 when moving the Mughal capital from Agra to Shahjahanabad (Old Delhi). It represents the height of Mughal architectural splendor and is the historic venue for Independence Day celebrations.';
    }
    if (q.includes('konark') || q.includes('sun temple') || q.includes('odisha')) {
      return '🙏 **Konark Sun Temple, Odisha:** A 13th-century CE architectural wonder shaped like a grand 24-wheeled chariot of Surya the Sun God, pulled by seven stone horses. The wheels function as precise astronomical sundials.';
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste')) {
      return '🙏 **Namaste! I am HeriSense AI**, your personal guide to India’s 5,000+ years of vibrant heritage and culture. Ask me about monuments, dynasties, festivals (like Diwali/Holi), or classical dance forms!';
    }
    return `🙏 **Namaste!** India's heritage is filled with wonders. Regarding *"${message}"*: India preserves thousands of ASI monuments, 42 UNESCO World Heritage Sites, and centuries of living traditions. Ask me about any monument (Taj Mahal, Hampi, Ajanta, Red Fort) or explore the **Explore** and **GeoHunt** tabs for quests!`;
  },

  // ─── Append Message to Chat ───────────────────────────────────────────────
  appendMessage(msg) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', AIGuide.renderMessage(msg));
    container.scrollTop = container.scrollHeight;
  },

  // ─── Typing Indicator ─────────────────────────────────────────────────────
  showTyping() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', `
      <div class="chat-msg" id="typing-indicator">
        <div class="msg-avatar ai-msg-avatar">🤖</div>
        <div class="msg-bubble ai-bubble">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>`);
    container.scrollTop = container.scrollHeight;
  },
  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  },

  // ─── Quick Actions ────────────────────────────────────────────────────────
  startMonumentInfo() {
    App.showModal(`
      <h3 style="margin-bottom:1rem">🏛️ Monument Info</h3>
      <p style="color:var(--text-secondary);margin-bottom:1rem;font-size:0.9rem">
        Enter any Indian monument or heritage site name to get instant AI-powered information.
      </p>
      <div class="input-group">
        <i class="fas fa-landmark"></i>
        <input type="text" id="monument-input" placeholder="e.g., Taj Mahal, Hampi, Ajanta Caves" />
      </div>
      <button class="btn-primary" style="margin-top:1rem" onclick="AIGuide.getMonumentInfo()">
        <i class="fas fa-search"></i><span>Get Information</span>
      </button>`);
    setTimeout(() => document.getElementById('monument-input')?.focus(), 300);
  },

  // ─── Built-in Quiz Bank ────────────────────────────────────────────────────
  quizBank: [
    {
      topic: 'general',
      questions: [
        { question: 'Which emperor built the Taj Mahal in memory of his beloved wife?', options: ['Akbar', 'Shah Jahan', 'Babur', 'Humayun'], correct: 1 },
        { question: 'Hampi was the ancient capital of which legendary South Indian empire?', options: ['Chola', 'Maurya', 'Vijayanagara', 'Maratha'], correct: 2 },
        { question: 'Which Sun Temple is shaped like a colossal stone chariot with 24 carved wheels?', options: ['Meenakshi Temple', 'Konark Sun Temple', 'Khajuraho', 'Brihadeeswara'], correct: 1 },
        { question: 'Where are the 2,000-year-old rock-cut Buddhist murals of Ajanta located?', options: ['Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan'], correct: 1 },
        { question: 'Which classical dance originated in the sacred temples of Tamil Nadu?', options: ['Kathak', 'Bharatnatyam', 'Kathakali', 'Odissi'], correct: 1 }
      ]
    },
    {
      topic: 'mughal',
      questions: [
        { question: 'Who founded the Mughal Empire in India in 1526?', options: ['Akbar', 'Babur', 'Humayun', 'Shah Jahan'], correct: 1 },
        { question: 'Which Mughal Emperor built the Buland Darwaza at Fatehpur Sikri?', options: ['Babur', 'Akbar', 'Jahangir', 'Aurangzeb'], correct: 1 },
        { question: 'What primary material was used to build the Red Fort in Delhi?', options: ['White Marble', 'Red Sandstone', 'Granite', 'Basalt'], correct: 1 }
      ]
    },
    {
      topic: 'buddhism',
      questions: [
        { question: 'Who commissioned the Great Stupa at Sanchi in the 3rd century BCE?', options: ['Chandragupta Maurya', 'Emperor Ashoka', 'Kanishka', 'Harsha'], correct: 1 },
        { question: 'Which ancient residential university in Bihar was the epicenter of Buddhist learning?', options: ['Taxila', 'Nalanda', 'Vikramashila', 'Valabhi'], correct: 1 },
        { question: 'What do the murals at Ajanta Caves primarily depict?', options: ['Court Battles', 'Jataka Tales of Buddha', 'Mughal Hunts', 'Solar Calendars'], correct: 1 }
      ]
    }
  ],

  async getMonumentInfo() {
    const name = document.getElementById('monument-input')?.value.trim();
    if (!name) return;

    document.getElementById('modal-content').innerHTML = `
      <h3 style="margin-bottom:1.5rem">🏛️ ${name}</h3>
      <div style="text-align:center;padding:2rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--text-secondary);margin-top:1rem;font-size:0.85rem">Fetching information...</p>
      </div>`;

    try {
      const res = await API.monumentInfo(name);
      if (!res || !res.info) throw new Error('Empty');
      AIGuide.renderMonumentInfo(name, res.info);
    } catch {
      const fallbackInfo = AIGuide.getInstantAnswer(name);
      AIGuide.renderMonumentInfo(name, fallbackInfo);
    }
  },

  renderMonumentInfo(name, info) {
    document.getElementById('modal-content').innerHTML = `
      <h3 style="margin-bottom:1rem">🏛️ ${name}</h3>
      <p style="line-height:1.8;color:var(--text-secondary);font-size:0.9rem">${info.replace(/\n/g, '<br>')}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1.5rem">
        <button class="btn-secondary" onclick="AIGuide.startMonumentInfo()">
          <i class="fas fa-search"></i> Search Another
        </button>
        <button class="btn-accent" onclick="AIGuide.askAbout('${name.replace(/'/g, "\\'")}');App.closeModal()">
          <i class="fas fa-comments"></i> Chat
        </button>
      </div>`;
  },

  startQuiz() {
    App.showModal(`
      <h3 style="margin-bottom:1rem">🧠 Heritage Quiz</h3>
      <p style="color:var(--text-secondary);margin-bottom:1rem;font-size:0.9rem">Test your knowledge about Indian heritage!</p>
      <div class="post-type-selector" id="quiz-difficulty-selector">
        ${['easy', 'medium', 'hard'].map(d => `
          <div class="post-type-chip ${d === 'medium' ? 'active' : ''}"
            onclick="document.querySelectorAll('.post-type-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active')" data-difficulty="${d}">
            ${d === 'easy' ? '🌱' : d === 'medium' ? '🎯' : '🔥'} ${d.charAt(0).toUpperCase() + d.slice(1)}
          </div>`).join('')}
      </div>
      <div class="input-group" style="margin-top:0.75rem">
        <i class="fas fa-filter"></i>
        <input type="text" id="quiz-topic-input" placeholder="Topic (optional): Mughal, Buddhism, Tamil Nadu..." />
      </div>
      <button class="btn-primary" style="margin-top:1rem" onclick="AIGuide.fetchAndStartQuiz()">
        <i class="fas fa-play"></i><span>Start Quiz</span>
      </button>`);
  },

  async fetchAndStartQuiz() {
    const topic = document.getElementById('quiz-topic-input')?.value.trim();
    const activeChip = document.querySelector('.post-type-chip.active');
    const difficulty = activeChip?.dataset.difficulty || 'medium';

    document.getElementById('modal-content').innerHTML = `
      <div style="text-align:center;padding:2rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--text-secondary);margin-top:1rem">Generating ${difficulty} quiz${topic ? ` about ${topic}` : ''}...</p>
      </div>`;

    try {
      const res = await API.generateQuiz(topic, difficulty);
      if (res && res.questions && res.questions.length > 0) {
        AIGuide.runQuiz(res.questions);
        return;
      }
      throw new Error('Fallback needed');
    } catch {
      // Pick best matching quiz from built-in pool
      let selected = AIGuide.quizBank[0].questions;
      if (topic) {
        const topLower = topic.toLowerCase();
        const found = AIGuide.quizBank.find(qb => topLower.includes(qb.topic));
        if (found) selected = found.questions;
      }
      setTimeout(() => AIGuide.runQuiz(selected), 400);
    }
  },

  runQuiz(questions) {
    let currentQ = 0;
    let score = 0;

    const show = () => {
      const q = questions[currentQ];
      document.getElementById('modal-content').innerHTML = `
        <div class="quiz-progress" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
          <span style="font-size:0.85rem;color:var(--gold);font-weight:700">Question ${currentQ + 1} of ${questions.length}</span>
          <span style="font-size:0.85rem;color:var(--text-muted)">Score: ${window._qscore || 0}</span>
        </div>
        <div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:1.25rem;overflow:hidden">
          <div style="height:100%;width:${((currentQ + 1) / questions.length) * 100}%;background:var(--grad-gold);transition:width 0.3s"></div>
        </div>
        <div class="quiz-question" style="font-size:1.05rem;font-weight:700;margin-bottom:1.25rem;line-height:1.5">${q.question}</div>
        <div class="quiz-options" style="display:flex;flex-direction:column;gap:0.6rem">
          ${q.options.map((opt, i) => `
            <button class="quiz-opt-btn" id="qo-${i}" style="padding:0.875rem 1rem;text-align:left;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--card-bg2);color:var(--text-primary);cursor:pointer;font-size:0.9rem;transition:all 0.2s"
              onclick="document.querySelectorAll('.quiz-opt-btn').forEach(b=>b.disabled=true);
              document.getElementById('qo-${q.correct}').style.background='rgba(76,175,80,0.25)';
              document.getElementById('qo-${q.correct}').style.borderColor='#4caf50';
              document.getElementById('qo-${q.correct}').style.color='#81c784';
              ${i !== q.correct ? `document.getElementById('qo-${i}').style.background='rgba(244,67,54,0.25)';document.getElementById('qo-${i}').style.borderColor='#f44336';document.getElementById('qo-${i}').style.color='#e57373';` : ''}
              ${i === q.correct ? 'window._qscore=(window._qscore||0)+1;' : ''}
              setTimeout(()=>{window._qnext&&window._qnext()},850)">
              <b style="color:var(--gold);margin-right:6px">${String.fromCharCode(65 + i)}.</b> ${opt}
            </button>`).join('')}
        </div>
        <p style="color:var(--text-muted);font-size:0.75rem;margin-top:1rem;text-align:center">Tap an answer to continue</p>`;

      window._qnext = () => {
        if (currentQ < questions.length - 1) {
          currentQ++;
          show();
        } else {
          const finalScore = window._qscore || 0;
          window._qscore = 0;
          const pct = Math.round((finalScore / questions.length) * 100);
          const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : '💪';
          document.getElementById('modal-content').innerHTML = `
            <div style="text-align:center;padding:1rem">
              <div style="font-size:3.5rem">${emoji}</div>
              <h3 style="margin:1rem 0 0.25rem">Quiz Complete!</h3>
              <p style="font-size:2.2rem;font-weight:800;color:var(--gold);margin:0.5rem 0">${pct}%</p>
              <p style="color:var(--text-secondary);margin-bottom:1.5rem">${finalScore} of ${questions.length} questions correct</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
                <button class="btn-secondary" onclick="AIGuide.startQuiz()">
                  <i class="fas fa-redo"></i> Play Again
                </button>
                <button class="btn-primary" onclick="App.closeModal()">
                  <span>Done</span>
                </button>
              </div>
            </div>`;
        }
      };
    };

    window._qscore = 0;
    show();
  },

  async fetchStory() {
    const site = document.getElementById('story-site-input')?.value.trim();
    if (!site) return;

    document.getElementById('modal-content').innerHTML = `
      <div style="text-align:center;padding:2rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--text-secondary);margin-top:1rem">Writing story about ${site}...</p>
      </div>`;

    try {
      const res = await API.generateStory(site);
      if (res && res.story) {
        document.getElementById('modal-content').innerHTML = `
          <h3 style="margin-bottom:1rem">📖 ${site}</h3>
          <p style="line-height:1.8;color:var(--text-secondary);font-style:italic;font-size:0.95rem">${res.story.replace(/\n/g, '<br>')}</p>
          <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal()">Close</button>`;
        return;
      }
      throw new Error('Empty');
    } catch {
      const fallbackStory = `Centuries ago in the golden heart of India, master sculptors and architects gathered to create ${site}. Under the starlit skies of ancient Bharat, every stone was inscribed with devotion and royal grandeur. Legends speak of devoted artisans whose craftsmanship defied time itself, leaving a timeless monument that continues to inspire pilgrims and travelers from all across the globe.`;
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">📖 The Legend of ${site}</h3>
        <p style="line-height:1.8;color:var(--text-secondary);font-style:italic;font-size:0.95rem">${fallbackStory}</p>
        <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal()">Close</button>`;
    }
  },

  // ─── Ask About (from Explorer) ────────────────────────────────────────────
  askAbout(siteName) {
    App.navigate('ai');
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = `Tell me about ${siteName}`;
        AIGuide.sendMessage();
      }
    }, 400);
  }
};

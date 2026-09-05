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
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">🏛️ ${name}</h3>
        <p style="line-height:1.8;color:var(--text-secondary);font-size:0.9rem">${res.info.replace(/\n/g, '<br>')}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1.5rem">
          <button class="btn-secondary" onclick="AIGuide.startMonumentInfo()">
            <i class="fas fa-search"></i> Search Another
          </button>
          <button class="btn-accent" onclick="AIGuide.askAbout('${name.replace(/'/g, "\\'")}');App.closeModal()">
            <i class="fas fa-comments"></i> Chat
          </button>
        </div>`;
    } catch {
      document.getElementById('modal-content').innerHTML = `<p style="color:var(--danger)">Failed to get information.</p>`;
    }
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
      AIGuide.runQuiz(res.questions);
    } catch {
      document.getElementById('modal-content').innerHTML = `<p style="color:var(--danger)">Failed to generate quiz. Try again.</p>`;
    }
  },

  runQuiz(questions) {
    let currentQ = 0;
    let score = 0;
    let answered = false;

    const show = () => {
      answered = false;
      const q = questions[currentQ];
      document.getElementById('modal-content').innerHTML = `
        <div class="quiz-progress">
          <span>${currentQ + 1}/${questions.length}</span>
          <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${((currentQ + 1) / questions.length) * 100}%"></div></div>
        </div>
        <div class="quiz-question">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" id="qo-${i}" onclick="document.querySelectorAll('.quiz-option').forEach(b=>b.disabled=true);
              document.getElementById('qo-${q.correct}').classList.add('correct');
              ${i !== q.correct ? `document.getElementById('qo-${i}').classList.add('wrong');` : ''}
              ${i === q.correct ? 'window._qscore=(window._qscore||0)+1;' : ''}
              setTimeout(()=>{window._qnext&&window._qnext()},900)">
              ${opt}
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
              <p style="font-size:2rem;font-weight:800;color:var(--gold)">${pct}%</p>
              <p style="color:var(--text-secondary)">${finalScore}/${questions.length} correct</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1.5rem">
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

  startStory() {
    App.showModal(`
      <h3 style="margin-bottom:1rem">📖 AI Heritage Story</h3>
      <div class="input-group">
        <i class="fas fa-landmark"></i>
        <input type="text" id="story-site-input" placeholder="e.g., Taj Mahal, Hampi, Varanasi..." />
      </div>
      <button class="btn-primary" style="margin-top:1rem" onclick="AIGuide.fetchStory()">
        <i class="fas fa-magic"></i><span>Generate Story</span>
      </button>`);
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
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">📖 ${site}</h3>
        <p style="line-height:1.8;color:var(--text-secondary);font-style:italic;font-size:0.95rem">${res.story.replace(/\n/g, '<br>')}</p>
        <button class="btn-primary" style="margin-top:1.5rem" onclick="App.closeModal()">Close</button>`;
    } catch {
      document.getElementById('modal-content').innerHTML = `<p style="color:var(--danger)">Failed to generate story.</p>`;
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

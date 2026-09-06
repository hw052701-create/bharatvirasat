// ── ai.js — Virasat AI Guide Module ───────────────────────────────────────
const AIGuide = {
  chatHistory: [],

  // ─── Render AI Page ───────────────────────────────────────────────────────
  render() {
    const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
    const firstName = user?.name?.split(' ')[0] || 'Explorer';
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    document.getElementById('app-content').innerHTML = `
      <div class="ai-header">
        <div class="ai-avatar">🪷</div>
        <h2>Virasat AI</h2>
        <p>Your Personal Indian Heritage Guide</p>
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
            <div class="msg-avatar ai-msg-avatar">🪷</div>
            <div class="msg-bubble ai-bubble">
              <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;font-weight:500;letter-spacing:0.3px">
                <i class="fas fa-shield-alt" style="margin-right:3px;font-size:0.7rem"></i> PERSONAL SESSION • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <b>${timeGreeting}, ${firstName}! 🙏</b><br><br>
              Welcome to your personal heritage session. I'm <b>Virasat AI</b> — your expert guide to India's incredible 5,000-year-old civilization.<br><br>
              <div style="display:flex;flex-direction:column;gap:4px">
                <div style="display:flex;align-items:flex-start;gap:7px"><span style="color:var(--gold)">🏛️</span><span>Ask about any <b>monument</b> or heritage site</span></div>
                <div style="display:flex;align-items:flex-start;gap:7px"><span style="color:var(--gold)">👑</span><span>Explore <b>dynasties</b>, rulers & history</span></div>
                <div style="display:flex;align-items:flex-start;gap:7px"><span style="color:var(--gold)">🎭</span><span>Discover <b>festivals</b>, dance & art forms</span></div>
                <div style="display:flex;align-items:flex-start;gap:7px"><span style="color:var(--gold)">📜</span><span>Deep-dive into <b>inscriptions</b>, architecture & travel</span></div>
              </div>
              <br>
              <span style="color:var(--text-muted);font-size:0.82rem">What would you like to discover today, ${firstName}?</span>
            </div>
          </div>

          ${AIGuide.chatHistory.slice(-10).map(msg => AIGuide.renderMessage(msg)).join('')}
        </div>

        <div class="chat-input-bar">
          <textarea class="chat-input" id="chat-input" placeholder="Ask me about any heritage site, ${firstName}..."
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

  // ─── Professional Markdown Parser ─────────────────────────────────────────
  formatMarkdown(text) {
    if (!text) return '';
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h4 style="margin:0.6rem 0 0.25rem;color:var(--gold);font-size:0.98rem;font-weight:700">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="margin:0.75rem 0 0.35rem;color:var(--gold);font-size:1.05rem;font-weight:800">$1</h3>')
      .replace(/^# (.*$)/gim, '<h3 style="margin:0.75rem 0 0.35rem;color:var(--gold);font-size:1.1rem;font-weight:800">$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Bullet points
      .replace(/^\s*[•\-\*]\s+(.*$)/gim, '<div style="display:flex;align-items:flex-start;gap:7px;margin:4px 0"><span style="color:var(--gold);line-height:1.4">•</span><span>$1</span></div>')
      // Numbered lists
      .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div style="display:flex;align-items:flex-start;gap:7px;margin:4px 0"><span style="color:var(--gold);font-weight:700;line-height:1.4">$1.</span><span>$2</span></div>')
      // Paragraphs and breaks
      .replace(/\n\n/g, '<div style="height:0.5rem"></div>')
      .replace(/\n/g, '<br>');
  },

  // ─── Render Message ───────────────────────────────────────────────────────
  renderMessage(msg) {
    const isUser = msg.role === 'user';
    const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
    const senderName = isUser ? (user?.name?.split(' ')[0] || 'You') : 'Virasat AI';
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `
      <div class="chat-msg ${isUser ? 'user' : ''}">
        <div class="msg-avatar ${isUser ? 'user-msg-avatar' : 'ai-msg-avatar'}">
          ${isUser ? Auth.getInitials(Auth.currentUser?.name) : '🪷'}
        </div>
        <div class="msg-content-wrap">
          <div class="msg-sender-row" style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-size:0.75rem;font-weight:700;color:${isUser ? 'var(--text-secondary)' : 'var(--gold)'}">${senderName}</span>
            <span style="font-size:0.65rem;color:var(--text-muted)">${time}</span>
          </div>
          <div class="msg-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}">
            ${AIGuide.formatMarkdown(msg.text)}
          </div>
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

  // ─── Comprehensive Multi-Domain Heritage Knowledge Engine ─────────────────
  // ─── Comprehensive Multi-Domain Heritage Knowledge Engine ─────────────────
  getInstantAnswer(message, history = []) {
    let q = message.toLowerCase().trim();
    // Normalize typos and question prefixes
    q = q.replace(/^tel\b/, 'tell').replace(/^wat\b/, 'what').replace(/^abt\b/, 'about').replace(/^whos\b/, 'who is').replace(/^whens\b/, 'when is');

    // Get user's first name for personalization
    const userName = (typeof Auth !== 'undefined' && Auth.currentUser?.name) ? Auth.currentUser.name.split(' ')[0] : 'Explorer';

    // Extract recent entity context if present from history
    let activeEntity = null;
    const allRecentText = [
      ...((history && history.length) ? history.map(h => (h.text || h.message || '')) : []),
      ...((AIGuide.chatHistory && AIGuide.chatHistory.length) ? AIGuide.chatHistory.map(h => h.text || '') : [])
    ].join(' ').toLowerCase();

    const entityKeywords = [
      { key: 'khajuraho', match: ['khajuraho', 'chandela', 'kandariya', 'chhatarpur'] },
      { key: 'taj', match: ['taj mahal', 'taj', 'mumtaz', 'shah jahan', 'agra'] },
      { key: 'red_fort', match: ['red fort', 'lal qila'] },
      { key: 'qutub', match: ['qutub', 'qutb', 'iron pillar'] },
      { key: 'hampi', match: ['hampi', 'vijayanagara', 'vittala', 'stone chariot'] },
      { key: 'ajanta', match: ['ajanta', 'cave 1', 'frescoes', 'padmapani'] },
      { key: 'ellora', match: ['ellora', 'kailasa', 'rashtrakuta'] },
      { key: 'konark', match: ['konark', 'sun temple', 'narasimhadeva'] },
      { key: 'brihadeeswara', match: ['brihadeeswara', 'thanjavur', 'chola', 'raja raja'] },
      { key: 'meenakshi', match: ['meenakshi', 'madurai', 'sundareswarar'] },
      { key: 'sanchi', match: ['sanchi', 'stupa', 'ashoka'] },
      { key: 'rani_ki_vav', match: ['rani ki vav', 'stepwell', 'patan'] },
      { key: 'nalanda', match: ['nalanda', 'ancient university'] },
      { key: 'mahabalipuram', match: ['mahabalipuram', 'mamallapuram', 'pallava', 'shore temple'] },
      { key: 'fatehpur', match: ['fatehpur', 'buland darwaza', 'akbar'] },
      { key: 'golden_temple', match: ['golden temple', 'harmandir', 'amritsar'] },
      { key: 'varanasi', match: ['varanasi', 'kashi', 'banaras', 'ghat'] }
    ];

    // Check if current message or recent context mentions an entity
    for (const ent of entityKeywords) {
      if (ent.match.some(m => q.includes(m))) {
        activeEntity = ent.key;
        break;
      }
    }
    if (!activeEntity) {
      for (const ent of entityKeywords) {
        if (ent.match.some(m => allRecentText.includes(m))) {
          activeEntity = ent.key;
          break;
        }
      }
    }

    // 1. Follow-up: Inscriptions & Epigraphy
    if (q.includes('inscription') || q.includes('script') || q.includes('epigraph') || q.includes('writing') || q.includes('written') || q.includes('language') || q.includes('engrav')) {
      if (activeEntity === 'khajuraho') {
        return `📜 **Inscriptions & Epigraphy of Khajuraho Temples**\n\n• **Language & Script:** Inscribed in classical Sanskrit using the medieval northern **Kutila (early Nagari)** script.\n• **Key Inscriptions:** Found prominently on the stone plinths of the **Lakshmana Temple** (dated 954 CE under King Yashovarman) and the **Visvanatha Temple** (dated 1002 CE under King Dhanga).\n• **Historical Value:** These prashastis (royal panegyrics) document the divine genealogy of the Chandela dynasty tracing descent from the Moon God (*Chandra*), record royal military victories, and credit master guild architects like *Sutradhara Chhichha*.\n• **Religious Significance:** The inscriptions record the installation of sacred Vaikuntha Vishnu and Marakatesvara Emerald Shiva lingas, establishing Khajuraho as a premier medieval spiritual power center.`;
      }
      if (activeEntity === 'taj') {
        return `📜 **Inscriptions & Calligraphy of the Taj Mahal**\n\n• **Master Calligrapher:** Inscribed by Persian master **Amanat Khan** (Abd al-Haq) in 1639 CE, whose humble signature appears at the base of the central dome.\n• **Script & Style:** Flawless Arabic and Persian calligraphy in the monumental **Thuluth** script, meticulously inlaid using black jasper marble into white Makrana marble panels.\n• **Content:** 22 Surahs from the Holy Quran, including Surah Ya-Sin and Surah Al-Fajr (Daybreak), inviting pure souls into the eternal gardens of Paradise.\n• **Optical Illusion:** The letter sizes increase progressively higher up the arches so they appear perfectly uniform to an observer standing below on the ground.`;
      }
      if (activeEntity === 'brihadeeswara') {
        return `📜 **Inscriptions of Brihadeeswara Temple (Thanjavur)**\n\n• **Script & Language:** Written in ancient Tamil and Grantha scripts encircling the entire granite basement of the Vimana.\n• **Royal Chronicle:** Commissioned by Emperor **Raja Raja Chola I**, recording exact weights of gold, bronze icons donated, and land revenue endowments from 300+ villages across South India and Sri Lanka.\n• **Social History:** Records the names and quarters of over 400 temple dancers (*Talippendir*), musicians, sculptors, and accountants.`;
      }
      if (activeEntity === 'sanchi' || activeEntity === 'ashoka') {
        return `📜 **Inscriptions & Edicts of Sanchi & Ashoka**\n\n• **Brahmi Edicts (3rd Century BCE):** Early Brahmi script in Prakrit language commissioned under Emperor Ashoka the Great.\n• **Schism Edict:** A pillar edict warning Buddhist monks and nuns against dividing the Sangha.\n• **Votive Inscriptions:** Hundreds of donor epigraphs carved on gateways and railings donated by ordinary citizens, guilds (*ivory workers of Vidisha*), and monks.`;
      }
      if (activeEntity === 'qutub') {
        return `📜 **Inscriptions on Qutub Minar & Iron Pillar**\n\n• **Qutub Minar:** Inscriptions in cursive Arabic and Nagari scripts detailing successive construction and repairs by Qutb-ud-din Aibak, Iltutmish, Firoz Shah Tughlaq, and Sikandar Lodi.\n• **Iron Pillar Inscription:** A 6-line Sanskrit poem in 4th-century CE Gupta Brahmi script eulogizing King Chandra (Chandragupta II Vikramaditya).`;
      }
      // Universal Indian Inscriptions
      return `📜 **Ancient Indian Inscriptions & Epigraphy (पुरालेख)**\n\nIndia has over 100,000 recorded historical inscriptions on stone, pillars, and copper plates (*Tamrapatra*):\n\n• **Ashokan Edicts (3rd century BCE):** Deciphered by James Prinsep; written in Brahmi, Kharosthi, Greek, and Aramaic scripts across India advocating Dhamma, non-violence, and tree planting.\n• **Gupta Prashastis:** The Allahabad Pillar (Prayag Prashasti) composed by court poet Harishena recording Samudragupta's conquests in classical Sanskrit.\n• **Copper Plate Grants:** Detailed land grants and maritime expeditions of Chola, Chalukya, and Rashtrakuta dynasties.\n• **Temple Basements:** Indian temples served as living civic archives preserving donor lists, astronomical dates, and historical genealogies.`;
    }

    // 2. Follow-up: Sculptures, Murals, Art & Erotic Carvings
    if (q.includes('sculpture') || q.includes('carving') || q.includes('statue') || q.includes('erotic') || q.includes('mural') || q.includes('painting') || q.includes('art') || q.includes('mithuna')) {
      if (activeEntity === 'khajuraho') {
        return `🎨 **Sculptures & Art of Khajuraho Temples**\n\n• **Universal Celebration of Life:** Only about 10% of Khajuraho's carvings are erotic (*Mithuna*); the remaining 90% depict medieval daily life, musicians, celestial maidens (*Apsaras* removing thorns or applying makeup), cosmic deities, and royal warriors.\n• **Spiritual Philosophy:** Represents the four Purusharthas (goals of life)—Dharma (righteousness), Artha (wealth), Kama (desire & love), and Moksha (liberation)—integrating worldly passion into the cosmic spiritual journey.\n• **Mastery:** Carved from fine sandstone with astonishing depth, dynamic movement, and graceful anatomical curves.`;
      }
      if (activeEntity === 'ajanta') {
        return `🎨 **Masterpiece Murals of Ajanta Caves**\n\n• **Tempera Frescoes:** Painted over mud-plastered rock surfaces using mineral pigments (lapislazuli, red ochre, lamp black).\n• **Bodhisattva Padmapani (Cave 1):** The lotus-bearing Bodhisattva epitomizes serene compassion with timeless shading and depth.\n• **Narratives:** Illustrates Jataka stories narrating the Buddha's previous births and ancient Indian courtly splendor.`;
      }
      if (activeEntity === 'ellora') {
        return `🗿 **Sculptural Splendor of Ellora Caves**\n\n• **Ravana Shaking Mount Kailasa (Cave 16):** Dramatic multi-tiered relief where the demon king shakes Shiva's mountain while Parvati clings to Shiva in absolute stillness.\n• **Avatar Relievos:** Colossal sculptures of Narasimha, Varaha, and the cosmic Tandava dance of Lord Shiva.`;
      }
      if (activeEntity === 'konark') {
        return `☀️ **Sculptures of Konark Sun Temple**\n\n• **24 Sundial Wheels:** Sculpted with intricate spokes and medallions depicting seasonal motifs and astronomical precision.\n• **Natya Mandapa:** Adorned with hundreds of sculptures of musicians and dancers in classical Odissi postures.`;
      }
    }

    // 3. Follow-up: Architecture & Engineering
    if (q.includes('architecture') || q.includes('design') || q.includes('engineering') || q.includes('how was it built') || q.includes('material') || q.includes('style') || q.includes('height')) {
      if (activeEntity === 'khajuraho') {
        return `🏛️ **Architecture of Khajuraho (Nagara Style)**\n\n• **Panchayatana Layout:** A central shrine surrounded by four subsidiary shrines built upon a high stone terrace (*Jagati*).\n• **Spire Progression (Shikhara):** Clusters of miniature spires (*Urushringas*) ascend rhythmically like a mountain range, symbolizing Mount Meru (the cosmic axis).\n• **Inner Sanctuaries:** Progresses seamlessly through Ardhamandapa (entrance porch), Mandapa (hall), Mahamandapa, and Garbhagriha (inner sanctum).`;
      }
      if (activeEntity === 'taj') {
        return `🏛️ **Architectural Genius of the Taj Mahal**\n\n• **Bilateral Symmetry:** Flawless balance along the central water canal, flanked by red sandstone mosque and jawab.\n• **Double Dome:** An outer bulbous dome rising 73 meters and an inner acoustic dome for reverberating sacred prayers.\n• **Earthquake Engineering:** Four 40-meter minarets tilt slightly outward to safeguard the central tomb in case of seismic shocks.\n• **Timber Well Foundation:** Rests on a subterranean network of ebony wood wells nourished by Yamuna river moisture.`;
      }
      if (activeEntity === 'hampi') {
        return `🏛️ **Vijayanagara Architecture at Hampi**\n\n• **Musical Pillars:** 56 monolithic granite pillars in the Vittala Temple that resonate distinct musical notes when tapped.\n• **Monolithic Stone Chariot:** A shrine dedicated to Garuda crafted with interlocking granite blocks designed to resemble a ceremonial wooden temple car.`;
      }
    }

    // 4. Follow-up: Who built it / History / Dynasty / Dates
    if (q.includes('who built') || q.includes('when was') || q.includes('history of') || q.includes('founder') || q.includes('dynasty') || q.includes('ruler') || q.includes('king') || q.includes('emperor')) {
      if (activeEntity === 'khajuraho') {
        return `👑 **History & Builders of Khajuraho Temples**\n\n• **Dynasty:** Built by the **Chandela Rajput Dynasty** between **950 and 1050 CE** at their cultural and religious capital in Bundelkhand.\n• **Key Rulers:** King Harshadeva, Yashovarman (Lakshmana Temple), King Dhanga (Visvanatha Temple), and King Vidyadhara (Kandariya Mahadeva).\n• **Survival:** Of the original 85 temples across 20 sq km, 25 survive today preserved by ASI and UNESCO.`;
      }
      if (activeEntity === 'taj') {
        return `👑 **History of the Taj Mahal**\n\n• **Commissioned:** 1631 CE by Mughal Emperor **Shah Jahan** in memory of **Mumtaz Mahal**.\n• **Timeline:** Completed in 1653 CE with 20,000 artisans under chief architect Ustad Ahmad Lahori.`;
      }
      if (activeEntity === 'brihadeeswara') {
        return `👑 **History of Brihadeeswara Temple**\n\n• **Emperor:** Commissioned by Emperor **Raja Raja Chola I** and completed in 1010 CE to celebrate 25 years of Chola imperial rule.`;
      }
    }

    // 5. Follow-up: Travel / How to visit / Timings
    if (q.includes('how to reach') || q.includes('visit') || q.includes('ticket') || q.includes('timing') || q.includes('best time') || q.includes('where is')) {
      if (activeEntity === 'khajuraho') {
        return `✈️ **Travel Guide: Khajuraho, Madhya Pradesh**\n\n• **Location:** Chhatarpur district, Madhya Pradesh, India.\n• **How to Reach:** Khajuraho Airport (HJR) and Khajuraho Railway Station connect to Delhi, Varanasi, and Bhopal.\n• **Best Time to Visit:** October to March (pleasant winter climate); don't miss the famous **Khajuraho Dance Festival** held every February against the illuminated temples.\n• **Timings:** Sunrise to sunset daily. Evening Western Group Sound & Light Show in English & Hindi.`;
      }
    }

    // 6. Greetings & System Capabilities
    if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
      return `🙏 **Namaste, ${userName}!** Welcome back to Virasat AI (विरासत AI) — your expert companion for Indian heritage, culture, and history.\n\nI can help you discover:\n• **42+ UNESCO World Heritage Sites** & ASI protected monuments across India\n• **Royal Dynasties** (Mughal, Chola, Maurya, Gupta, Vijayanagara, Maratha)\n• **Classical Dance & Music** (Bharatnatyam, Kathak, Carnatic, Hindustani)\n• **Living Festivals** (Diwali, Holi, Navratri, Durga Puja, Pongal, Onam)\n• **Ancient Temple Architecture** (Nagara, Dravidian, Vesara styles)\n\nWhat would you like to explore today?`;
    }

    if (q.includes('kaise ho') || q.includes('how are you')) {
      return `🙏 **Namaste! I am doing wonderful**, immersed in India's timeless heritage. How can I guide your journey into India's history or culture today?`;
    }

    if (q.includes('who are you') || q.includes('kya ho') || q.includes('kya kar sakte ho') || q.includes('help')) {
      return `🙏 **I am Virasat AI**, an AI cultural guide developed for BharatVirasat. I can answer historical queries, summarize monuments, generate ancient legends, provide travel tips, and host interactive quizzes on any Indian heritage topic!`;
    }

    // 7. Iconic Monuments (North India)
    if (q.includes('taj') || q.includes('agra')) {
      return `🏛️ **Taj Mahal, Agra (Uttar Pradesh)**\n\n• **Commissioned:** 1631–1653 CE by Emperor Shah Jahan in memory of his favorite empress, Mumtaz Mahal.\n• **Architecture:** Masterpiece of Indo-Islamic symmetry built using pristine white Makrana marble from Rajasthan, inlaid with semi-precious pietra dura gems.\n• **Significance:** UNESCO World Heritage Site and one of the New 7 Wonders of the World.\n• **Visiting Tip:** Sunrise or full-moon nights offer breathtaking golden and pearl-white reflections along the Yamuna river.`;
    }

    if (q.includes('red fort') || q.includes('lal qila')) {
      return `🏰 **Red Fort (Lal Qila), Delhi**\n\n• **Commissioned:** 1638–1648 CE by Emperor Shah Jahan when shifting the Mughal capital to Shahjahanabad (Old Delhi).\n• **Highlights:** Built of red sandstone featuring the Lahori Gate, Diwan-i-Aam (Hall of Public Audience), and the exquisite marble Diwan-i-Khas.\n• **National Symbol:** Every year on 15 August (Independence Day), the Prime Minister of India hoists the tricolor flag and addresses the nation from its ramparts.`;
    }

    if (q.includes('qutub minar') || q.includes('qutb')) {
      return `🗼 **Qutub Minar Complex, Delhi**\n\n• **Built:** Started in 1193 CE by Qutb-ud-din Aibak and completed by Shams-ud-din Iltutmish.\n• **Architecture:** World's tallest brick minaret at 72.5 meters (238 feet), with five distinct tapering storeys of fluted red sandstone.\n• **Wonder:** The complex houses the 1,600-year-old **Iron Pillar of Delhi**, famed worldwide for its ancient rust-resistant metallurgy.`;
    }

    if (q.includes('fatehpur') || q.includes('buland darwaza')) {
      return `🚪 **Fatehpur Sikri & Buland Darwaza, Uttar Pradesh**\n\n• **Built:** Founded in 1571 CE by Emperor Akbar as his capital city.\n• **Buland Darwaza:** The 54-meter high "Gate of Magnificence" erected in 1601 to celebrate Akbar's military victory over Gujarat.\n• **Sanctuary:** Houses the serene white marble Tomb of Sufi saint Sheikh Salim Chishti.`;
    }

    if (q.includes('varanasi') || q.includes('kashi') || q.includes('banaras') || q.includes('ghat')) {
      return `🪔 **Varanasi (Kashi), Uttar Pradesh**\n\n• **Heritage:** One of the oldest continuously inhabited sacred cities in world history, nestled along the holy Ganges.\n• **Highlights:** Over 84 historic ghats including Dashashwamedh Ghat (famous for the evening Ganga Aarti) and Manikarnika Ghat.\n• **Culture:** Spiritual heart of Shaivism (Kashi Vishwanath Temple), world-renowned Banarasi silk weaving, and Hindustani classical music traditions.`;
    }

    if (q.includes('golden temple') || q.includes('harmandir') || q.includes('amritsar')) {
      return `✨ **Golden Temple (Sri Harmandir Sahib), Amritsar**\n\n• **Founded:** 1577 CE by Guru Ram Das, the fourth Sikh Guru; marble sanctum overlaid with pure 24-karat gold foil by Maharaja Ranjit Singh in 1830.\n• **Architecture:** Features four open entrances symbolizing universal welcoming for all castes and creeds.\n• **Langar:** Serves free nutritious meals to over 100,000 pilgrims every single day in the world's largest community kitchen.`;
    }

    // 8. West & Central India
    if (q.includes('ajanta')) {
      return `🎨 **Ajanta Caves, Maharashtra**\n\n• **Era:** 2nd century BCE to 5th century CE, carved into a horseshoe cliff along the Waghora River.\n• **Artistry:** 30 rock-cut Buddhist prayer halls (Chaityas) and monasteries (Viharas) containing ancient masterpiece mural frescoes depicting the Jataka tales.\n• **Significance:** Ancient Indian painting pinnacle preserved for over two millennia.`;
    }

    if (q.includes('ellora') || q.includes('kailasa')) {
      return `⛰️ **Ellora Caves & Kailasa Temple, Maharashtra**\n\n• **Harmony:** 100 rock-cut caves carved by Rashtrakuta and Yadava kings representing Buddhist, Hindu, and Jain traditions side by side.\n• **Kailasa Temple (Cave 16):** The world's largest single monolithic rock excavation, carved top-to-bottom from a basalt cliff without scaffolding, removing over 200,000 tonnes of rock!`;
    }

    if (q.includes('khajuraho') || q.includes('chandela')) {
      return `🛕 **Khajuraho Temples, Madhya Pradesh**\n\n• **Built:** 950–1050 CE under the Chandela dynasty.\n• **Architecture:** Sublime Nagara-style sandstone temples featuring intricate sculptures celebrating spiritual devotion, cosmic deities, music, dance, and human passion.\n• **Crown Jewel:** The towering Kandariya Mahadeva Temple dedicated to Lord Shiva.`;
    }

    if (q.includes('sanchi') || q.includes('stupa')) {
      return `☸️ **Great Stupa at Sanchi, Madhya Pradesh**\n\n• **Commissioned:** 3rd century BCE by Emperor Ashoka the Great over the holy relics of the Buddha.\n• **Toranas:** Four intricately sculpted ornamental gateways oriented to the cardinal directions depicting Buddha's life and enlightenment.\n• **Significance:** The oldest stone structure in India and a supreme milestone of Buddhist art.`;
    }

    if (q.includes('rani ki vav') || q.includes('patan') || q.includes('stepwell')) {
      return `💧 **Rani ki Vav (Queen's Stepwell), Patan (Gujarat)**\n\n• **Built:** 11th century CE by Queen Udayamati in memory of King Bhima I of the Chaulukya dynasty.\n• **Design:** An inverted underground subterranean temple with 7 terraced levels featuring more than 500 principal sculptures dedicated to Lord Vishnu in his Dashavatara forms.`;
    }

    if (q.includes('jaipur') || q.includes('amer') || q.includes('hawa mahal') || q.includes('rajasthan')) {
      return `👑 **Rajasthan Heritage & Royal Forts**\n\n• **Jaipur (Pink City):** UNESCO World Heritage city founded in 1727 by Maharaja Sawai Jai Singh II with grid planning and Hawa Mahal (Palace of Winds).\n• **Hill Forts of Rajasthan:** Amer, Kumbhalgarh (world's 2nd longest wall), Chittorgarh, Mehrangarh, and Jaisalmer Fort.\n• **Living Heritage:** Famed for vibrant block-print textiles, puppet kathputli arts, Rajput hospitality, and desert music.`;
    }

    // 9. South India
    if (q.includes('hampi') || q.includes('vijayanagara')) {
      return `🏛️ **Hampi & Vijayanagara Empire, Karnataka**\n\n• **Golden Age:** Capital of the Vijayanagara Empire (14th–16th century CE), described by medieval Portuguese and Persian travelers as one of the world's wealthiest capitals.\n• **Monuments:** Vittala Temple with the iconic monolithic **Stone Chariot** and musical pillars, Virupaksha Temple, and royal elephant stables.\n• **Landscape:** Surreal boulder-strewn terrain flanking the holy Tungabhadra river.`;
    }

    if (q.includes('brihadeeswara') || q.includes('thanjavur') || q.includes('tanjore') || q.includes('chola')) {
      return `🛕 **Brihadeeswara Temple (Peruvudaiyar Kovil), Thanjavur**\n\n• **Built:** 1010 CE by Emperor Raja Raja Chola I to mark Chola imperial supremacy.\n• **Engineering Marvel:** Built entirely of interlocking granite. The apex dome (Kumbam) weighs over 80 tonnes, hoisted atop a 66-meter towering Vimana tower without mortar.\n• **Chola Legacy:** Center of classical Bharatnatyam dance and bronze casting.`;
    }

    if (q.includes('meenakshi') || q.includes('madurai')) {
      return `🌸 **Meenakshi Amman Temple, Madurai (Tamil Nadu)**\n\n• **Dedication:** Goddess Meenakshi (Parvati) and Sundareswarar (Shiva).\n• **Architecture:** Classic Dravidian jewel with 14 towering, multi-colored Gopurams adorned with thousands of hand-painted mythological statues.\n• **Heritage:** Famous for the Hall of 1,000 Pillars and 2,500 years of living Tamil heritage.`;
    }

    if (q.includes('mahabalipuram') || q.includes('mamallapuram') || q.includes('pallava') || q.includes('shore temple')) {
      return `🌊 **Mahabalipuram Shore Temples, Tamil Nadu**\n\n• **Era:** 7th–8th century CE under the Pallava maritime empire.\n• **Monuments:** Pancha Rathas (five monolithic rock chariots), the dramatic Shore Temple braving the ocean waves, and "Arjuna's Penance" (Descent of the Ganges) rock relief.`;
    }

    if (q.includes('mysore') || q.includes('mysuru')) {
      return `🏰 **Mysore Palace (Amba Vilas), Karnataka**\n\n• **Royal Seat:** Historic residence of the Wadiyar dynasty, redesigned in Indo-Saracenic grandeur by Henry Irwin in 1912.\n• **Splendor:** Features stained glass ceilings, Belgian chandeliers, peacock pavilions, and illuminates with nearly 100,000 incandescent light bulbs during Mysore Dasara.`;
    }

    // 10. East & North-East India
    if (q.includes('konark') || q.includes('sun temple') || q.includes('odisha')) {
      return `☀️ **Konark Sun Temple, Odisha**\n\n• **Built:** 1250 CE by King Narasimhadeva I of the Eastern Ganga Dynasty on the Bay of Bengal coast.\n• **Design:** Conceived as a colossal chariot for the Sun God Surya, complete with 24 carved stone wheels pulled by 7 galloping horses.\n• **Sundial Clock:** The wheel spokes function as astronomical sundials calculating exact time to the minute using sunlight shadows.`;
    }

    if (q.includes('nalanda') || q.includes('bihar')) {
      return `📚 **Nalanda Mahavihara, Bihar**\n\n• **Historic University:** Founded in the 5th century CE under the Gupta Empire; ancient world's greatest residential university hosting 10,000 students and 2,000 teachers from China, Korea, Japan, and Tibet.\n• **Legacy:** Famous scholars like Aryabhata and Nagarjuna taught here; vast library *Dharmaganja* held centuries of sacred manuscripts.`;
    }

    // 11. Classical Dances & Art Forms
    if (q.includes('dance') || q.includes('nritya') || q.includes('bharatnatyam') || q.includes('kathak') || q.includes('kathakali') || q.includes('odissi')) {
      return `💃 **Indian Classical Dances (Natya Shastra Heritage)**\n\n• **Bharatnatyam (Tamil Nadu):** Temple origins, geometric precision, striking footwork, and expressive Abhinaya.\n• **Kathak (North India):** Storytelling tradition of court and temple with lightning-fast spins (chakkars) and rhythmic ghungroo footwork.\n• **Kathakali (Kerala):** Grand dance-drama with stylized face makeup, elaborate headgear, and heroic mudra gestures.\n• **Odissi (Odisha):** Sculpturesque postures based on the *Tribhanga* (three-bend) stance mirroring temple statues.\n• **Others:** Kuchipudi (Andhra Pradesh), Manipuri (Manipur), Mohiniyattam (Kerala), and Sattriya (Assam).`;
    }

    if (q.includes('painting') || q.includes('madhubani') || q.includes('warli') || q.includes('tanjore') || q.includes('art')) {
      return `🎨 **Traditional Indian Folk Arts & Paintings**\n\n• **Madhubani (Mithila, Bihar):** Geometric motifs of nature and deities painted with natural mineral pigments and twigs.\n• **Warli Art (Maharashtra):** Minimalist tribal stick figures painted in white rice paste depicting village harvest and communal dances.\n• **Tanjore Painting (Tamil Nadu):** Rich gold leaf foil overlay, glass beads, and vibrant depictions of divine childhood forms.\n• **Pattachitra (Odisha & Bengal):** Cloth scroll paintings depicting epics with natural plant dyes and fine line work.`;
    }

    // 12. Indian Festivals & Traditions
    if (q.includes('diwali') || q.includes('deepavali')) {
      return `🪔 **Diwali (The Festival of Lights)**\n\n• **Significance:** Celebrates the victory of light over darkness and good over evil, commemorating Lord Rama's triumphant return to Ayodhya after 14 years of exile.\n• **Traditions:** Lighting earthen clay diyas, rangoli floor artworks, Lakshmi Puja for prosperity, sharing festive sweets, and family reunions.`;
    }

    if (q.includes('holi')) {
      return `🎨 **Holi (The Festival of Colors & Spring)**\n\n• **Heritage:** Celebrates the arrival of spring (*Vasant Ritu*) and the eternal divine love of Radha-Krishna in Braj (Mathura/Vrindavan).\n• **Significance:** Symbolizes the burning of evil (Holika Dahan) and the triumph of devotion represented by Bhakta Prahlada.`;
    }

    if (q.includes('festival') || q.includes('navratri') || q.includes('durga puja') || q.includes('pongal') || q.includes('onam')) {
      return `🎉 **Living Festivals of India**\n\n• **Durga Puja (Bengal):** UNESCO Intangible Cultural Heritage celebrating Goddess Durga with grand artistic pandals and dhunuchi dance.\n• **Navratri & Garba (Gujarat):** 9 nights of devotion with colorful circular community dance.\n• **Onam (Kerala):** Harvest festival celebrating King Mahabali with Pookkalam flower carpets and Vallam Kali snake boat races.\n• **Pongal & Makar Sankranti:** Solar harvest celebrations honoring Surya the Sun God with freshly harvested rice and sugarcane.`;
    }

    // 13. Dynasties & History
    if (q.includes('mughal') || q.includes('babur') || q.includes('akbar') || q.includes('shah jahan')) {
      return `👑 **The Mughal Dynasty (1526–1857 CE)**\n\n• **Founder:** Babur in 1526 following the First Battle of Panipat.\n• **Golden Age:** Akbar the Great championed religious harmony (*Sulh-i-Kul*) and imperial synthesis; Shah Jahan brought Mughal architecture to its zenith with the Taj Mahal and Red Fort.\n• **Architecture:** Characterized by bulbous domes, four-quartered *Charbagh* gardens, red sandstone, and white marble inlay.`;
    }

    if (q.includes('maurya') || q.includes('ashoka') || q.includes('chandragupta') || q.includes('chanakya')) {
      return `🦁 **The Mauryan Empire (322–185 BCE)**\n\n• **Founding:** United most of the Indian subcontinent under Chandragupta Maurya with strategic guidance from Chanakya (Kautilya), author of the *Arthashastra*.\n• **Emperor Ashoka:** Following the Kalinga War, embraced Buddhism and propagated Ahimsa (non-violence) through rock and pillar edicts across India.\n• **National Emblem:** The Lion Capital of Ashoka at Sarnath is the official Emblem of India.`;
    }

    if (q.includes('chola') || q.includes('raja raja')) {
      return `⚓ **The Imperial Chola Dynasty (848–1279 CE)**\n\n• **Maritime Empire:** Ruled South India with strong naval expeditions extending influence to Sri Lanka, Malaysia, Indonesia, and Southeast Asia.\n• **Living Heritage:** Built monumental granite Dravidian temples (Brihadeeswara at Thanjavur & Gangaikonda Cholapuram) and perfected lost-wax bronze casting (Nataraja).`;
    }

    // 14. Intelligent Contextual Fallback for all other heritage queries
    const cleanWord = message.replace(/[?.,!]/g, '').trim();
    return `🏛️ **Indian Heritage Insights: "${cleanWord}"**\n\n${userName}, India preserves over 5,000 years of civilization with **42 UNESCO World Heritage Sites**, thousands of ASI protected monuments, and rich intangible traditions.\n\n• **Discover Monuments:** Use the **Explore** tab to browse architectural masterpieces and historical dynasties.\n• **Earn Badges:** Visit sites with GPS in **GeoHunt** to unlock explorer achievements.\n• **Ask Virasat AI:** Ask about specific rulers (Ashoka, Akbar, Cholas), temples (Konark, Meenakshi), caves (Ajanta, Ellora), or festivals!\n\nWould you like a detailed historical legend, travel guide, or quiz about this?`;
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
        <div class="msg-avatar ai-msg-avatar">🪷</div>
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
  // ─── Built-in Diverse Quiz Bank ──────────────────────────────────────────
  quizBank: [
    {
      topic: 'architecture',
      keywords: ['architecture', 'monument', 'building', 'fort', 'palace'],
      questions: [
        { question: 'Which emperor built the Taj Mahal in memory of his beloved wife Mumtaz Mahal?', options: ['Akbar', 'Shah Jahan', 'Babur', 'Humayun'], correct: 1 },
        { question: 'What primary building material gives Delhi’s Red Fort its distinctive hue?', options: ['White Makrana Marble', 'Red Sandstone', 'Granite', 'Basalt'], correct: 1 },
        { question: 'Which Sun Temple is sculpted in the shape of a colossal chariot with 24 carved wheels?', options: ['Brihadeeswara Temple', 'Konark Sun Temple', 'Meenakshi Temple', 'Khajuraho'], correct: 1 },
        { question: 'The Buland Darwaza at Fatehpur Sikri was built by Akbar to commemorate his victory over which region?', options: ['Bengal', 'Gujarat', 'Deccan', 'Kashmir'], correct: 1 },
        { question: 'Which iconic stepwell in Gujarat features intricate subterranean carvings and UNESCO status?', options: ['Chand Baori', 'Rani ki Vav', 'Agrasen ki Baoli', 'Adalaj Stepwell'], correct: 1 }
      ]
    },
    {
      topic: 'south_heritage',
      keywords: ['south', 'chola', 'hampi', 'vijayanagara', 'dravidian', 'tamil', 'karnataka', 'kerala'],
      questions: [
        { question: 'Hampi on the banks of the Tungabhadra River was the capital of which great empire?', options: ['Chola Empire', 'Vijayanagara Empire', 'Maratha Empire', 'Pallava Empire'], correct: 1 },
        { question: 'The Brihadeeswara Temple in Thanjavur is a masterpiece built by which Chola ruler?', options: ['Raja Raja Chola I', 'Rajendra Chola', 'Karikala Chola', 'Kulothunga I'], correct: 0 },
        { question: 'Which world-renowned rock relief at Mahabalipuram depicts the Descent of the Ganges?', options: ['Arjuna’s Penance', 'Kailashnath Relief', 'Elephanta Trimurti', 'Gommateshwara'], correct: 0 },
        { question: 'The iconic Shore Temple at Mahabalipuram was constructed by which dynasty?', options: ['Cholas', 'Pallavas', 'Cheras', 'Pandyas'], correct: 1 },
        { question: 'Which classical dance drama from Kerala is famous for vibrant face makeup and elaborate headgear?', options: ['Kathak', 'Kathakali', 'Mohiniyattam', 'Yakshagana'], correct: 1 }
      ]
    },
    {
      topic: 'ancient_history',
      keywords: ['history', 'maurya', 'ashoka', 'gupta', 'buddhism', 'nalanda', 'sanchi'],
      questions: [
        { question: 'Who founded the Mauryan Empire in 322 BCE with guidance from Chanakya?', options: ['Ashoka the Great', 'Chandragupta Maurya', 'Bindusara', 'Samudragupta'], correct: 1 },
        { question: 'Where did Gautama Buddha deliver his first sermon (Dharmachakra Pravartana)?', options: ['Bodh Gaya', 'Sarnath', 'Kushinagar', 'Lumbini'], correct: 1 },
        { question: 'The Great Stupa with magnificent toranas (gateways) was commissioned by Ashoka at:', options: ['Sanchi', 'Nalanda', 'Amaravati', 'Sarnath'], correct: 0 },
        { question: 'Which ancient residential university in modern-day Bihar attracted scholars from across Asia?', options: ['Taxila', 'Nalanda', 'Vikramashila', 'Vallabhi'], correct: 1 },
        { question: 'The Lion Capital of Ashoka that forms India’s National Emblem was discovered at:', options: ['Sanchi', 'Sarnath', 'Patliputra', 'Ujjain'], correct: 1 }
      ]
    },
    {
      topic: 'caves_sculpture',
      keywords: ['cave', 'ajanta', 'ellora', 'elephanta', 'rock-cut', 'sculpture'],
      questions: [
        { question: 'The single-rock monolithic Kailasa Temple (Cave 16) is the centerpiece of which cave complex?', options: ['Ajanta', 'Ellora', 'Elephanta', 'Badami'], correct: 1 },
        { question: 'What primary themes are depicted in the 2nd-century BCE murals of Ajanta Caves?', options: ['Mughal Court Battles', 'Jataka Tales of Buddha', 'Astronomy Charts', 'Temple Rituals'], correct: 1 },
        { question: 'The colossal three-headed Trimurti sculpture of Lord Shiva is located in:', options: ['Ajanta Caves', 'Elephanta Caves', 'Badami Caves', 'Udayagiri Caves'], correct: 1 },
        { question: 'In which state are the ancient Bhimbetka rock shelters with prehistoric cave paintings located?', options: ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Odisha'], correct: 1 }
      ]
    },
    {
      topic: 'culture_festivals',
      keywords: ['culture', 'festival', 'dance', 'music', 'art', 'tradition'],
      questions: [
        { question: 'Which classical dance originated in the sacred temples of Tamil Nadu as a spiritual expression?', options: ['Kathak', 'Bharatnatyam', 'Odissi', 'Manipuri'], correct: 1 },
        { question: 'Which grand 10-day festival in Mysore culminates in a royal Jumbo Savari procession?', options: ['Pongal', 'Mysuru Dasara', 'Onam', 'Ugadi'], correct: 1 },
        { question: 'Which Indian textile art from Andhra Pradesh uses kalam (bamboo pen) and natural vegetable dyes?', options: ['Bandhani', 'Kalamkari', 'Chikankari', 'Pashmina'], correct: 1 },
        { question: 'The living root bridges of Cherrapunji are engineered by which indigenous tribe?', options: ['Khasi & Jaintia', 'Garo', 'Naga', 'Mizo'], correct: 0 }
      ]
    }
  ],

  // ─── Daily Challenge Flow ──────────────────────────────────────────────────
  startDailyChallenge() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const isDone = localStorage.getItem('bv_daily_completed_date') === todayStr || localStorage.getItem('bv_daily_quiz_claimed') === todayStr;

    if (isDone) {
      App.showDailyCompletedModal();
      return;
    }

    // Pick a curated challenge from question banks based on day of year
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const bankIdx = dayOfYear % AIGuide.quizBank.length;
    const pool = AIGuide.quizBank[bankIdx].questions;
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);

    App.showModal(`
      <div style="text-align:center;padding:1rem 0.5rem">
        <div style="font-size:3rem;margin-bottom:0.5rem">🏆</div>
        <h3 style="margin-bottom:0.35rem">Heritage Daily Challenge</h3>
        <p style="color:var(--gold);font-weight:700;font-size:0.95rem;margin-bottom:0.75rem">+50 Explorer XP Reward</p>
        <p style="color:var(--text-secondary);font-size:0.88rem;line-height:1.5;margin-bottom:1.5rem">
          Answer at least 60% correctly to claim your daily bonus. You can only complete this challenge once per day!
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <button class="btn-secondary" onclick="App.closeModal()">Later</button>
          <button class="btn-primary" onclick="AIGuide.runQuiz(${JSON.stringify(shuffled).replace(/"/g, '&quot;')}, true)">
            <i class="fas fa-play"></i> <span>Begin Challenge</span>
          </button>
        </div>
      </div>`);
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
      <h3 style="margin-bottom:1rem">🧠 Heritage Quiz Challenge</h3>
      <p style="color:var(--text-secondary);margin-bottom:1rem;font-size:0.9rem">Test your knowledge across ancient history, architecture, and living traditions!</p>
      <div class="post-type-selector" id="quiz-difficulty-selector">
        ${['easy', 'medium', 'hard'].map(d => `
          <div class="post-type-chip ${d === 'medium' ? 'active' : ''}"
            onclick="document.querySelectorAll('.post-type-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active')" data-difficulty="${d}">
            ${d === 'easy' ? '🌱' : d === 'medium' ? '🎯' : '🔥'} ${d.charAt(0).toUpperCase() + d.slice(1)}
          </div>`).join('')}
      </div>
      <div class="input-group" style="margin-top:0.75rem">
        <i class="fas fa-filter"></i>
        <input type="text" id="quiz-topic-input" placeholder="Topic: Mughal, Chola, Buddhism, Temples, Caves..." />
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
        <p style="color:var(--text-secondary);margin-top:1rem">Generating ${difficulty} quiz${topic ? ` about "${topic}"` : ''}...</p>
      </div>`;

    try {
      const res = await API.generateQuiz(topic, difficulty);
      if (res && res.questions && res.questions.length > 0) {
        AIGuide.runQuiz(res.questions, false);
        return;
      }
      throw new Error('Fallback needed');
    } catch {
      // Pick best matching or randomized quiz from built-in pool
      let questionsPool = [];
      if (topic) {
        const topLower = topic.toLowerCase();
        const found = AIGuide.quizBank.find(qb => 
          topLower.includes(qb.topic) || (qb.keywords && qb.keywords.some(k => topLower.includes(k)))
        );
        if (found) questionsPool = found.questions;
      }

      if (questionsPool.length === 0) {
        // Collect all questions across banks and sample 5 randomly
        const allQuestions = AIGuide.quizBank.flatMap(qb => qb.questions);
        questionsPool = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);
      }

      setTimeout(() => AIGuide.runQuiz(questionsPool, false), 400);
    }
  },

  runQuiz(questions, isDaily = false) {
    if (!questions || !questions.length) return;

    // Shuffle questions slightly for variety if general quiz
    const preparedQuestions = isDaily ? questions : [...questions].sort(() => 0.5 - Math.random());

    AIGuide._quizState = {
      questions: preparedQuestions,
      currentQ: 0,
      score: 0,
      isDaily
    };

    AIGuide.renderQuizQuestion();
  },

  renderQuizQuestion() {
    const state = AIGuide._quizState;
    if (!state) return;

    const { questions, currentQ, score, isDaily } = state;
    const q = questions[currentQ];

    document.getElementById('modal-content').innerHTML = `
      <div class="quiz-progress" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
        <span style="font-size:0.85rem;color:var(--gold);font-weight:700">
          ${isDaily ? '🏆 Daily Challenge • ' : ''}Question ${currentQ + 1} of ${questions.length}
        </span>
        <span style="font-size:0.85rem;color:var(--text-muted)">Score: ${score}</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:1.25rem;overflow:hidden">
        <div style="height:100%;width:${((currentQ + 1) / questions.length) * 100}%;background:var(--grad-gold);transition:width 0.3s"></div>
      </div>
      <div class="quiz-question" style="font-size:1.05rem;font-weight:700;margin-bottom:1.25rem;line-height:1.5">${q.question}</div>
      <div class="quiz-options" style="display:flex;flex-direction:column;gap:0.6rem">
        ${q.options.map((opt, i) => `
          <button class="quiz-opt-btn" id="qo-${i}" style="padding:0.875rem 1rem;text-align:left;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--card-bg2);color:var(--text-primary);cursor:pointer;font-size:0.9rem;transition:all 0.2s"
            onclick="AIGuide.handleQuizAnswer(${i})">
            <b style="color:var(--gold);margin-right:6px">${String.fromCharCode(65 + i)}.</b> ${opt}
          </button>`).join('')}
      </div>
      <p style="color:var(--text-muted);font-size:0.75rem;margin-top:1rem;text-align:center">Tap an answer to continue</p>`;
  },

  handleQuizAnswer(selectedIdx) {
    const state = AIGuide._quizState;
    if (!state) return;

    const { questions, currentQ, isDaily } = state;
    const q = questions[currentQ];

    document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);

    const correctBtn = document.getElementById(`qo-${q.correct}`);
    if (correctBtn) {
      correctBtn.style.background = 'rgba(76,175,80,0.25)';
      correctBtn.style.borderColor = '#4caf50';
      correctBtn.style.color = '#81c784';
    }

    if (selectedIdx !== q.correct) {
      const wrongBtn = document.getElementById(`qo-${selectedIdx}`);
      if (wrongBtn) {
        wrongBtn.style.background = 'rgba(244,67,54,0.25)';
        wrongBtn.style.borderColor = '#f44336';
        wrongBtn.style.color = '#e57373';
      }
    } else {
      state.score++;
    }

    setTimeout(() => {
      if (state.currentQ < state.questions.length - 1) {
        state.currentQ++;
        AIGuide.renderQuizQuestion();
      } else {
        const finalScore = state.score;
        const total = state.questions.length;
        const pct = Math.round((finalScore / total) * 100);
        const passed = pct >= 60;
        const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : '💪';

        const todayStr = new Date().toISOString().slice(0, 10);
        let bonusAwarded = 0;

        if (isDaily && passed) {
          localStorage.setItem('bv_daily_completed_date', todayStr);
          localStorage.setItem('bv_daily_quiz_claimed', todayStr);
          bonusAwarded = 50;

          if (Auth.currentUser) {
            Auth.currentUser.points = (Auth.currentUser.points || 0) + bonusAwarded;
            localStorage.setItem('bv_user', JSON.stringify(Auth.currentUser));
            const ptsDisplay = document.getElementById('user-points-display');
            if (ptsDisplay) ptsDisplay.textContent = Auth.currentUser.points;
          }
        }

        document.getElementById('modal-content').innerHTML = `
          <div style="text-align:center;padding:1rem 0.5rem">
            <div style="font-size:3.5rem">${emoji}</div>
            <h3 style="margin:0.75rem 0 0.25rem">${isDaily ? (passed ? 'Daily Challenge Conquered!' : 'Challenge Incomplete') : (passed ? 'Quiz Passed!' : 'Quiz Complete!')}</h3>
            <p style="font-size:2.2rem;font-weight:800;color:var(--gold);margin:0.5rem 0">${pct}%</p>
            <p style="color:var(--text-secondary);margin-bottom:1rem">${finalScore} of ${total} questions correct</p>
            
            ${isDaily && passed
              ? `<div class="daily-challenge completed" style="margin:0 0 1.25rem;padding:0.875rem;border:1px solid #4caf50">
                  <div class="challenge-title" style="color:#81c784;font-size:1rem;margin:0">🌟 +50 XP Daily Challenge Bonus Claimed!</div>
                  <p style="color:var(--text-muted);font-size:0.8rem;margin-top:0.25rem">Recorded for today (${todayStr}). Come back tomorrow for a new challenge!</p>
                </div>`
              : (isDaily && !passed
                ? `<p style="color:#e57373;font-size:0.85rem;margin-bottom:1rem">Score at least 60% to claim today's +50 XP bonus.</p>`
                : '')}

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
              ${isDaily && passed
                ? `<button class="btn-secondary" onclick="App.closeModal();App.navigate('home')">
                    <i class="fas fa-home"></i> Home
                  </button>
                  <button class="btn-primary" onclick="App.closeModal();App.navigate('ai')">
                    <i class="fas fa-robot"></i> AI Quizzes
                  </button>`
                : (isDaily && !passed
                  ? `<button class="btn-secondary" onclick="App.closeModal()">Cancel</button>
                     <button class="btn-primary" onclick="AIGuide.startDailyChallenge()">
                       <i class="fas fa-redo"></i> Retry
                     </button>`
                  : `<button class="btn-secondary" onclick="AIGuide.startQuiz()">
                       <i class="fas fa-redo"></i> Play Another
                     </button>
                     <button class="btn-primary" onclick="App.closeModal()">
                       <span>Done</span>
                     </button>`)}
            </div>
          </div>`;
        AIGuide._quizState = null;
      }
    }, 750);
  },

  startStory(defaultSite = '') {
    App.showModal(`
      <h3 style="margin-bottom:0.75rem">📖 Heritage AI Storyteller</h3>
      <p style="color:var(--text-secondary);margin-bottom:1rem;font-size:0.88rem">
        Step into the past with epic historical narratives and ancient legends crafted by Virasat AI.
      </p>
      <div class="input-group">
        <i class="fas fa-feather-alt"></i>
        <input type="text" id="story-site-input" value="${defaultSite}" placeholder="Enter monument or site (e.g. Ajanta Caves, Taj Mahal, Hampi)" />
      </div>
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin:0.85rem 0">
        ${['Ajanta Caves', 'Konark Sun Temple', 'Hampi', 'Rani ki Vav', 'Ellora Caves', 'Taj Mahal', 'Sanchi Stupa'].map(s => `
          <span style="font-size:0.75rem;padding:0.3rem 0.65rem;border-radius:12px;background:var(--card-bg2);border:1px solid var(--border);cursor:pointer;color:var(--gold)"
            onclick="document.getElementById('story-site-input').value='${s}'">
            ${s}
          </span>`).join('')}
      </div>
      <button class="btn-primary" style="margin-top:0.5rem" onclick="AIGuide.fetchStory()">
        <i class="fas fa-magic"></i><span>Generate Legend & Story</span>
      </button>`);
    setTimeout(() => {
      const input = document.getElementById('story-site-input');
      if (input && !defaultSite) input.focus();
    }, 300);
  },

  getStoryFallback(site) {
    const s = (site || '').toLowerCase().trim();
    if (s.includes('khajuraho') || s.includes('chandela') || s.includes('kandariya')) {
      return `In the misty autumn of **950 CE**, nestled beneath the craggy Vindhya hills in the heart of Bundelkhand, **King Yashovarman** and the visionary rulers of the **Chandela Rajput Dynasty** gazed upon a vast sacred clearing. Here, they resolved to translate the entire cosmic order—from the mortal realm to the highest heavenly spheres—into living stone.\n\nOver the course of a glorious century, master architects (*Sutradharas*) like **Chhichha** led guilds of thousands of stonemasons who quarried golden-hued sandstone from the Panna riverbeds. Guided by ancient **Vastu Shastra** and the **Nagara** architectural canon, they raised 85 towering temples. The jewel among them was the soaring **Kandariya Mahadeva Temple**, dedicated to Lord Shiva, designed with a rhythmic cluster of 84 miniature spires (*Urushringas*) that mirrored the sacred peaks of **Mount Kailash**.\n\nOn the exterior walls, sculptors breathed life into the four **Purusharthas** (the fundamental goals of human existence): *Dharma* (righteousness), *Artha* (wealth), *Kama* (love, passion, and artistic beauty), and *Moksha* (ultimate liberation). Celestial dancers (*Apsaras*) applying *kajal*, musicians playing classical *veenas*, royal warriors, and divine couples (*Mithuna*) were carved with such breathtaking anatomical grace that the stone itself seemed to pulse with life.\n\nAs dynasties waned and medieval trade routes shifted, the dense teak jungle slowly enveloped the sacred valley for nearly four centuries. It was not until **1838**, when British surveyor **Captain T.S. Burt** followed local tribal guides deep into the forest, that Khajuraho's 25 surviving sanctuaries were rediscovered—standing as an eternal tribute to the unbound imagination and spiritual harmony of medieval India.`;
    }
    if (s.includes('ajanta')) {
      return `Between the **2nd century BCE and the 5th century CE**, in a dramatic crescent-shaped volcanic gorge carved by the Waghora River, Buddhist monks and guild artisans discovered an oasis of profound stillness. Here, sheltered from worldly turmoil, they carved **30 magnificent cave temples and monastic halls** (*Chaityas* and *Viharas*) deep into the raw basalt cliffs of Maharashtra.\n\nWorking in semi-darkness, the ancient painters devised an ingenious lighting system, using polished brass plates and silver mirrors placed at cave entrances to reflect soft natural daylight into the deepest chambers. Upon walls prepared with a plaster of river clay, rice husk, and cow dung, they painted with natural mineral pigments: crushed **lapis lazuli** from Badakhshan for celestial blues, rich **red and yellow ochres** from local volcanic soil, and carbon lampblack.\n\nTheir brushes brought the **Jataka tales** of the Buddha's previous incarnations alive with extraordinary emotional depth and fluidity. In Cave 1, the timeless mural of **Bodhisattva Padmapani** captures the pinnacle of classical Indian art—holding a delicate blue lotus with eyes cast down in boundless compassion for all living beings, wearing pearl necklaces that seem to catch the ambient lamp glow.\n\nWhen royal patronage waned with the fall of the **Vakataka Dynasty**, the lush monsoon jungle slowly concealed the cave entrances under thick curtains of creepers and wild trees. For nearly a thousand years, the painted Buddhas rested in secret peace until **April 1819**, when British cavalry officer **John Smith**, tracking a tiger through the Waghora ravine, spotted the top arch of Cave 10—reawakening the greatest painted heritage of the ancient world.`;
    }
    if (s.includes('ellora') || s.includes('kailasa')) {
      return `In the 8th century CE, amidst the dramatic basalt cliffs of the Deccan plateau in Maharashtra, **King Krishna I** of the **Rashtrakuta Dynasty** conceived an architectural audacity that defied every law of conventional building. Rather than assembling blocks of quarried stone, he declared that his artisans would sculpt an entire sacred mountain out of a single volcanic cliff face to recreate **Mount Kailash**, the mystical abode of Lord Shiva.\n\nMaster architect **Kokasa** made a daring vow: his sculptors would work exclusively **top-down**, carving into the living cliff without the aid of scaffolding or mortar. For over a century, generations of master craftsmen swung iron chisels and hammers beneath the blistering Deccan sun, cutting deep vertical trenches into the mountain and excavating more than **200,000 tonnes of solid basalt rock**.\n\nFrom the living mountain emerged **Cave 16 (The Kailasa Temple)**—a breathtaking monolithic complex twice the footprint of the Parthenon in Athens. Artisans carved multi-story pillared galleries, life-sized elephants that appear to lift the temple on their massive backs, and monumental high-relief panels. The most dramatic among them depicts the demon king **Ravana shaking Mount Kailash**, capturing the trembling fury of the mountain and the calm, effortless grace of Shiva pinning him down with a single toe.\n\nWhen the temple was originally completed, it was coated in brilliant white plaster so that it gleamed like the snow-capped Himalayas in the Indian sun. Even after a thousand years, Kailasa stands as an unfathomable engineering and spiritual marvel—a monument that seems not built by mortal hands, but summoned directly from the stone by divine will.`;
    }
    if (s.includes('konark') || s.includes('sun temple')) {
      return `In **1250 CE**, where the roaring waves of the Bay of Bengal met the sacred Chandrabhaga River, King **Langula Narasimhadeva I** of the Eastern Ganga Dynasty made an imperial vow. To celebrate his glorious victories and offer gratitude for the blessings of **Surya**, the Supreme Sun God, he commanded the creation of a temple the likes of which mortal eyes had never seen: a colossal celestial stone chariot surging out of the sea toward the rising dawn.\n\nChief architect **Bisu Maharana** led a legion of **1,200 master sculptors** who laboured through twelve grueling years. From heavy Khondalite and Chlorite stones, they carved **24 monumental wheels**, each nearly ten feet in diameter and pulled by seven galloping steeds representing the seven days of the week and the seven colors of sunlight. Each wheel was sculpted with such astronomical precision that the shadows cast by the sun across the intricate hub and eight spokes functioned as an exact sundial, measuring time down to the minute.\n\nYet as the twelfth year drew to a close, a crisis gripped the shore. The massive magnetic iron-clamped crowning dome (*Kalasa*) could not be balanced atop the towering spire, and the King issued a terrifying ultimatum to finish the temple by sunrise or face execution. That fateful night, **Dharmapada**, the 12-year-old son of Bisu Maharana who had grown up studying the sacred architectural treatises, stepped into the sanctum. With brilliant mathematical insight, the young prodigy climbed the dizzying heights and locked the crowning stone into flawless alignment. Then, to protect his father's honor and save the lives of the 1,200 craftsmen from the king's wrath, the brave boy leaped from the temple pinnacle into the raging sea.\n\nThough ocean tides and centuries have weathered its majestic assembly hall (*Jagamohana*), the **Konark Sun Temple** remains one of humanity's grandest achievements—a breathtaking hymn in stone celebrating cosmic rhythm, solar power, and boundless human devotion.`;
    }
    if (s.includes('taj') || s.includes('mumtaz')) {
      return `In the sweltering monsoon of **1631 CE**, an overwhelming stillness fell upon the royal camp at Burhanpur. Empress **Mumtaz Mahal**, the beloved companion and confidante of Mughal Emperor **Shah Jahan**, had passed away. Consumed by inconsolable grief, the Emperor resolved to channel his heartbreak into the most sublime monument human hands had ever fashioned—a terrestrial reflection of the gardens of Paradise (*Jannat*).\n\nOn the banks of the sacred **Yamuna River in Agra**, master architect **Ustad Ahmad Lahori** assembled a guild of more than **20,000 artisans**, sculptors, calligraphers, and lapidaries from across India, Persia, the Ottoman Empire, and Central Asia. Massive blocks of translucent, flawless **white Makrana marble** were brought across Rajasthan on teams of specially harnessed bullocks and elephants. The tomb was engineered upon a subterranean network of moisture-retaining **ebony wood wells**, while its four 40-meter minarets were deliberately tilted outward by a fraction of a degree—an ingenious safeguard ensuring they would fall away from the sanctum in the event of an earthquake.\n\nFor 22 tireless years, the artisans practiced the delicate art of *Parchin Kari* (*pietra dura* inlay), embedding 28 varieties of rare semi-precious gems into floral arabesques: deep blue **lapis lazuli** from Afghanistan, glowing **carnelian** from Arabia, green **jade** from China, and fiery **jasper** from Punjab. Calligrapher **Amanat Khan** inscribed 22 Surahs from the Holy Quran in flowing **Thuluth script**, with letters calibrated in ascending scale so that to the mortal eye looking upward, the sacred verses appear in immaculate optical harmony.\n\nToday, the **Taj Mahal** stands not merely as a marble tomb, but as an eternal poem of love and devotion that softly transforms its hues with the shifting heavens—blushing soft rose at dawn, glowing crystalline white under the midday sun, and gleaming like pure molten gold beneath the full moon.`;
    }
    if (s.includes('hampi') || s.includes('vijayanagara')) {
      return `In the year **1336 CE**, amidst a surreal landscape of giant granite boulders along the sacred **Tungabhadra River**, two warrior brothers named **Harihara** and **Bukka** founded the capital of the **Vijayanagara Empire**—the legendary 'City of Victory'. Under the golden reign of **Emperor Krishnadevaraya** in the 16th century, Hampi flourished as one of the largest, wealthiest, and most cosmopolitan metropolises on earth.\n\nForeign travelers like the Persian ambassador **Abdur Razzaq** and Portuguese merchant **Domingo Paes** wrote in sheer astonishment that Hampi's bustling bazaars traded diamonds, pearls, rubies, and emeralds openly by the measure, like common grain. The empire fostered a radiant renaissance of Kannada, Telugu, and Sanskrit literature, while royal *Sthapathis* carved grand temples that blended Dravidian grandeur with bold sculptural vigor.\n\nAt the **Vittala Temple Complex**, artisans created the iconic **Monolithic Stone Chariot**, dedicated to Garuda, and sculpted fifty-six **musical pillars** (*SaReGaMa pillars*) from single resonant granite blocks that produced distinct notes of classical Indian music when gently tapped by royal musicians. Across the river, the sky-piercing Gopuram of the ancient **Virupaksha Temple** watched over sacred festivals where decorated royal elephants marched in gold-embroidered silks.\n\nThough the imperial capital fell in the battle of 1565, the ruins of Hampi spread across 4,100 hectares remain alive with majestic power—where wind whistling through granite colonnades and sacred chants echoing across the Tungabhadra still narrate the golden epoch of South India's greatest empire.`;
    }
    if (s.includes('brihadeeswara') || s.includes('thanjavur') || s.includes('chola')) {
      return `In **1010 CE**, to commemorate the 25th victorious year of his imperial reign, the great Chola Emperor **Raja Raja Chola I** laid the final sanctified stone of the **Brihadeeswara Temple** (*Peruvudaiyar Kovil*) in Thanjavur, Tamil Nadu. Having built a naval empire whose fleets held sway across the Bay of Bengal to Sumatra and Malaya, the Emperor resolved to build the world's most formidable granite temple in tribute to Lord Shiva as the Cosmic Dancer, **Nataraja**.\n\nIn a flat alluvial delta completely devoid of natural stone, the Chola engineers transported over **130,000 tonnes of hard granite** from quarries over 50 kilometers away. The soaring central tower (*Vimana*) was raised to a dizzying **66 meters (216 feet)**, making it the tallest architectural structure of its era. Atop this colossal tower rests the **Kumbam**—a single monolithic granite capstone weighing an astonishing **80 tonnes**.\n\nTo lift this immense monolith to the summit, master builders constructed a monumental inclined earth ramp that stretched nearly **6 kilometers** through the countryside, where regiments of royal elephants, oxen, and thousands of workers hauled the granite block inch by inch. The entire temple was constructed without mortar, using precisely interlocked tongue-and-groove granite blocks that have withstood numerous earthquakes and monsoons for over a millennium.\n\nWithin its circumambulatory halls, Chola artists painted vibrant frescoes, while royal inscriptions etched deeply into the stone plinths meticulously recorded the names of every dancer, musician, architect, and cook who served the temple. The Brihadeeswara Temple stands today as the supreme triumph of **Dravidian architecture**—a monumental granite symphony of imperial power, architectural genius, and unyielding devotion.`;
    }
    if (s.includes('vav') || s.includes('rani')) {
      return `In **1063 CE**, following the demise of King Bhima I of the Chaulukya (Solanki) Dynasty, **Queen Udayamati** resolved to build a memorial unlike any other in royal history. While kings raised towers reaching toward the heavens, the Queen commissioned an **inverted subterranean temple** in Patan, Gujarat, that plunged seven magnificent levels deep into the womb of the earth to honor the sacred life-giving gift of water.\n\nKnown as **Rani ki Vav** (The Queen's Stepwell), this subterranean marvel was designed as an architectural sanctuary along the ancient Saraswati River. Descending through stepped terraces and intricately pillared pavilions, visitors are surrounded by more than **800 major sculptures** and 1,000 minor carvings of extraordinary sophistication, depicting **Lord Vishnu in his Dashavatara forms**—from Matsya and Kurma to the majestic sleeping form of *Sheshashayi Vishnu* resting upon the cosmic serpent.\n\nWhen the Saraswati River altered its course and flooded the plains in the 13th century, silt and fine sand completely buried the stepwell, sealing it in a natural subterranean time capsule for nearly seven centuries. When the **Archaeological Survey of India** meticulously excavated the monument in the late 20th century, the carvings emerged in pristine, razor-sharp condition—looking as though the master Solanki sculptors had laid down their chisels only yesterday.`;
    }
    if (s.includes('red fort') || s.includes('lal qila')) {
      return `In **1638 CE**, Mughal Emperor **Shah Jahan** decided to shift his imperial throne from Agra to Delhi, designing a brand-new planned capital city named **Shahjahanabad**. For ten years along the Yamuna riverbank, master builders and stonemasons raised the soaring, octagonal bastions of the **Red Fort (Lal Qila)** using glowing red sandstone quarried from Rajasthan.\n\nBehind its formidable two-kilometer battlements lay a majestic world of marble palaces, canal-cooled courtyards, and fragrant *Charbagh* gardens. In the **Diwan-i-Khas** (Hall of Private Audience), the Emperor held council upon the fabled **Peacock Throne**, encrusted with diamonds, emeralds, pearls, and the legendary **Koh-i-Noor diamond**, beneath silver ceilings inlaid with gold.\n\nOn the marble archway overlooking the hall, court poet **Amir Khusrau's** celebrated Persian couplet was inscribed in gleaming gold calligraphy: *"Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast"*—**If there is a paradise on earth, it is this, it is this, it is this.** Over three centuries, the fort witnessed the zenith of Mughal majesty, the upheavals of 1857, and finally the historic dawn of **15 August 1947**, when Prime Minister Jawaharlal Nehru raised independent India's tricolor flag from its ramparts—sealing its place as the living heartbeat of the nation.`;
    }
    if (s.includes('sanchi')) {
      return `In the 3rd century BCE, following the catastrophic bloodbath of the Kalinga War, a profound transformation gripped the heart of the mighty Mauryan Emperor **Ashoka**. Renouncing territorial conquest through war (*Digvijaya*), the Emperor embraced the Buddhist path of moral victory through righteousness (*Dhammavijaya*). On a serene, secluded hilltop at **Sanchi** in Madhya Pradesh, he commissioned the construction of a great hemispherical stone dome to enshrine sacred bone relics of **Gautama Buddha**.\n\nTwo centuries later, under the **Satavahana Dynasty**, guilds of ivory carvers and sculptors from nearby Vidisha added four magnificent **Torana gateways** facing the four cardinal directions. These 34-foot-high gateways were carved with breathtaking density: playful elephants holding lotus flowers, celestial guardians (*Yakshis*) gracefully suspended from mango boughs, and vivid narrative panels recounting the Buddha's life and Jataka tales.\n\nIntriguingly, the Buddha himself was never depicted in human form on these ancient toranas—instead, his presence was reverently symbolized through footprints (*Paduka*), an empty throne beneath the Bodhi tree, the wheel of law (*Dharmachakra*), and the umbrella of spiritual royalty (*Chhatra*). Sanchi stands today as India's oldest surviving stone structure, a timeless sanctuary of inner peace and universal compassion.`;
    }
    return `Centuries ago in the golden heart of India, visionary rulers, master sthapathis, and devoted guilds of craftsmen gathered to breathe life into **${site || 'this timeless monument'}**.\n\nWorking under the starlit skies of ancient Bharat, hundreds of stone carvers, metal casters, and painters chipped away at raw granite, sandstone, and marble. Guided by sacred geometric canons and Vedic philosophy, every arch was calibrated to capture the cosmic movement of constellations, while every sculpted pillar mirrored the spiritual harmony between nature, humanity, and the divine.\n\nLegends recount the immense devotion of those master artisans who poured their lifetimes into this creation, leaving behind inscriptions in classical Sanskrit, Prakrit, or Persian that whisper forgotten tales of royal valor, celestial music, and spiritual enlightenment. Today, as travelers and pilgrims walk through its historic corridors, the stones continue to echo with the enduring soul of India's 5,000-year-old civilization.`;
  },

  formatStoryHtml(rawText) {
    if (!rawText) return '';
    const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paragraphs.map(p => {
      let formatted = p.trim()
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--gold)">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      return `<p style="margin-bottom:1rem;line-height:1.8;color:var(--text);font-size:0.94rem;text-align:justify">${formatted}</p>`;
    }).join('');
  },

  async fetchStory() {
    const siteInput = document.getElementById('story-site-input');
    const site = siteInput ? siteInput.value.trim() : 'Ajanta Caves';
    if (!site) return;

    document.getElementById('modal-content').innerHTML = `
      <div style="text-align:center;padding:2.5rem 1rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--gold);margin-top:1.25rem;font-weight:600;font-size:1rem">Summoning ancient legends for ${site}...</p>
        <p style="color:var(--text-muted);font-size:0.82rem;margin-top:0.3rem">Weaving historical chronicles, architecture & artisan lore</p>
      </div>`;

    try {
      const res = await API.generateStory(site);
      const storyText = (res && res.story) ? res.story : AIGuide.getStoryFallback(site);
      const formattedStory = AIGuide.formatStoryHtml(storyText);

      document.getElementById('modal-content').innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
          <div>
            <h3 style="margin:0;font-size:1.2rem;color:var(--gold)">📖 The Legend of ${site}</h3>
            <span style="font-size:0.78rem;color:var(--text-muted)"><i class="fas fa-scroll" style="margin-right:4px"></i> Historical Epic • ~2 min read</span>
          </div>
          <span style="background:rgba(212,160,23,0.15);color:var(--gold);border:1px solid rgba(212,160,23,0.3);padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:600">VIRASAT TALES</span>
        </div>
        <div style="max-height:60vh;overflow-y:auto;padding-right:6px;margin:1rem 0">
          ${formattedStory}
        </div>
        <div style="display:flex;gap:0.75rem;margin-top:1.25rem;padding-top:0.75rem;border-top:1px solid var(--border)">
          <button class="btn-secondary" style="flex:1" onclick="AIGuide.startStory('${site.replace(/'/g, "\\'")}')">
            <i class="fas fa-redo"></i> Another Legend
          </button>
          <button class="btn-primary" style="flex:1" onclick="App.closeModal()">
            <span>Close Chronicle</span>
          </button>
        </div>`;
    } catch {
      const fallbackStory = AIGuide.getStoryFallback(site);
      const formattedStory = AIGuide.formatStoryHtml(fallbackStory);
      document.getElementById('modal-content').innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
          <div>
            <h3 style="margin:0;font-size:1.2rem;color:var(--gold)">📖 The Legend of ${site}</h3>
            <span style="font-size:0.78rem;color:var(--text-muted)"><i class="fas fa-scroll" style="margin-right:4px"></i> Historical Epic • ~2 min read</span>
          </div>
          <span style="background:rgba(212,160,23,0.15);color:var(--gold);border:1px solid rgba(212,160,23,0.3);padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:600">VIRASAT TALES</span>
        </div>
        <div style="max-height:60vh;overflow-y:auto;padding-right:6px;margin:1rem 0">
          ${formattedStory}
        </div>
        <div style="display:flex;gap:0.75rem;margin-top:1.25rem;padding-top:0.75rem;border-top:1px solid var(--border)">
          <button class="btn-secondary" style="flex:1" onclick="AIGuide.startStory('${site.replace(/'/g, "\\'")}')">
            <i class="fas fa-redo"></i> Try Another
          </button>
          <button class="btn-primary" style="flex:1" onclick="App.closeModal()">
            <span>Close Chronicle</span>
          </button>
        </div>`;
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

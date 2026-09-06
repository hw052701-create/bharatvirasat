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
      const fallbackReply = AIGuide.getInstantAnswer(message, AIGuide.chatHistory);
      AIGuide.chatHistory.push({ role: 'model', text: fallbackReply });
      AIGuide.appendMessage({ role: 'model', text: fallbackReply });
    }
  },

  // ─── Comprehensive Multi-Domain Heritage Knowledge Engine ─────────────────
  lastEntity: null,

  getInstantAnswer(message, history = []) {
    let q = message.toLowerCase().trim();

    // ── Extensive Typo Normalization ──
    q = q
      .replace(/\b(bild|biuld|build|biult|buil|bult|buld|bld)\b/g, 'built')
      .replace(/\b(artecthuire|architecher|architectur|arcitecture|arkitecture|artecture|architechture|artitecture)\b/g, 'architecture')
      .replace(/\b(wen|whens|whn|whne)\b/g, 'when')
      .replace(/\b(hoo|whos|whoo|whoes)\b/g, 'who')
      .replace(/\b(wat|wats|whut|wot)\b/g, 'what')
      .replace(/^tel\b|^tell me\b|^tle\b/g, 'tell')
      .replace(/^abt\b|^abou\b/g, 'about')
      .replace(/\b(histry|histroy|histery|histoy)\b/g, 'history')
      .replace(/\b(tempel|tempal|templee|tmple)\b/g, 'temple')
      .replace(/\b(monumnet|monumet|monumentt)\b/g, 'monument')
      .replace(/\b(inscrption|inscriptin|inscripton|inscriptions|inscript)\b/g, 'inscription')
      .replace(/\b(sculpter|sculptre|sculpure|sculptures|sculptur)\b/g, 'sculpture')
      .replace(/\b(festval|festivel|festivl|festivals)\b/g, 'festival')
      .replace(/\b(dynesty|dynasti|dynastie|dynasties)\b/g, 'dynasty')
      .replace(/\b(ruler|rular|ruelr|rulers)\b/g, 'ruler')
      .replace(/\b(emperor|emperer|emperur|emperors)\b/g, 'emperor');

    // Get user's first name for personalization
    const userName = (typeof Auth !== 'undefined' && Auth.currentUser?.name) ? Auth.currentUser.name.split(' ')[0] : 'Explorer';

    // ── Heritage Entity Knowledge Base ──
    const entities = [
      {
        key: 'red_fort',
        name: 'Red Fort (Lal Qila)',
        match: ['red fort', 'lal qila', 'redfort', 'lal kila', 'delhi fort'],
        built: '1638–1648 CE',
        age: 378,
        builders: 'Mughal Emperor Shah Jahan (with architects Ustad Ahmad and Ustad Hamid)',
        city: 'Old Delhi (Shahjahanabad)',
        details: 'Built from red sandstone, featuring the Lahori Gate, Diwan-i-Aam, and the marble Diwan-i-Khas which once held the fabled Peacock Throne.',
        inscriptions: 'The famous golden Persian couplet by Amir Khusrau on the Diwan-i-Khas marble archway: "If there is paradise on earth, it is this, it is this, it is this."',
        architecture: 'Indo-Islamic octagonal fortress with 2-kilometer red sandstone battlements, water-cooled marble palaces, and Charbagh gardens along the Yamuna.'
      },
      {
        key: 'taj',
        name: 'Taj Mahal',
        match: ['taj mahal', 'taj', 'mumtaz', 'shah jahan', 'agra'],
        built: '1631–1653 CE',
        age: 373,
        builders: 'Mughal Emperor Shah Jahan (with master architect Ustad Ahmad Lahori)',
        city: 'Agra, Uttar Pradesh',
        details: 'Commissioned as a mausoleum of eternal love for Empress Mumtaz Mahal, crafted by over 20,000 artisans from white Makrana marble and 28 varieties of semi-precious gems.',
        inscriptions: '22 Quranic Surahs inscribed in Thuluth calligraphy by Amanat Khan in black jasper, optically scaled so the script looks uniform from the ground.',
        architecture: 'Masterpiece of bilateral symmetry with a 73m double dome, 4 outward-tilting minarets, and moisture-retaining ebony wood well foundations.'
      },
      {
        key: 'khajuraho',
        name: 'Khajuraho Temples',
        match: ['khajuraho', 'chandela', 'kandariya', 'chhatarpur', 'lakshmana temple', 'visvanatha'],
        built: '950–1050 CE',
        age: 1000,
        builders: 'Chandela Rajput Dynasty (Kings Yashovarman, Dhanga, and Vidyadhara)',
        city: 'Chhatarpur, Madhya Pradesh',
        details: 'Sublime Nagara-style sandstone temples celebrating the four Purusharthas (Dharma, Artha, Kama, Moksha), with the towering Kandariya Mahadeva as the crown jewel.',
        inscriptions: 'Sanskrit inscriptions in northern Kutila (early Nagari) script on Lakshmana (954 CE) and Visvanatha (1002 CE) temple plinths detailing Chandela genealogy.',
        architecture: 'Panchayatana layout elevated on a high Jagati terrace with rhythmic clusters of mini-spires (Urushringas) symbolizing Mount Meru.'
      },
      {
        key: 'qutub',
        name: 'Qutub Minar Complex',
        match: ['qutub', 'qutb', 'iron pillar', 'mehrauli'],
        built: '1193 CE',
        age: 833,
        builders: 'Qutb-ud-din Aibak & Shams-ud-din Iltutmish',
        city: 'Mehrauli, New Delhi',
        details: 'The world\'s tallest brick minaret at 72.5 meters with five tapered fluted storeys, alongside the 1,600-year-old rust-resistant Iron Pillar.',
        inscriptions: 'Arabic and Nagari inscriptions on minaret bands, and a 4th-century Gupta Brahmi Sanskrit eulogy to King Chandra on the Iron Pillar.',
        architecture: 'Fluted red sandstone and white marble storeys with stalactite-bracketed balconies and Indo-Islamic geometric carvings.'
      },
      {
        key: 'hampi',
        name: 'Hampi (Vijayanagara Empire)',
        match: ['hampi', 'vijayanagara', 'vittala', 'stone chariot', 'virupaksha', 'krishnadevaraya', 'tungabhadra'],
        built: '1336 CE (14th century)',
        age: 650,
        builders: 'Vijayanagara Empire (Brothers Harihara & Bukka, Emperor Krishnadevaraya)',
        city: 'Vijayanagara district, Karnataka',
        details: 'Capital of South India\'s wealthiest empire, featuring over 1,600 monuments, the iconic Stone Chariot, and open-air diamond and gem bazaars.',
        inscriptions: 'Kannada, Telugu, and Sanskrit inscriptions across temple basements recording royal endowments and international maritime trade.',
        architecture: 'Dravidian granite architecture with 56 musical SaReGaMa resonant pillars and majestic multi-tiered Gopurams along the Tungabhadra river.'
      },
      {
        key: 'ajanta',
        name: 'Ajanta Caves',
        match: ['ajanta', 'cave 1', 'padmapani', 'frescoes', 'waghora'],
        built: '2nd century BCE to 5th century CE',
        age: 2200,
        builders: 'Satavahana & Vakataka dynasties (Buddhist monks & guild artists)',
        city: 'Aurangabad district, Maharashtra',
        details: '30 rock-cut Buddhist chaityas and viharas inside a horseshoe canyon, containing ancient India\'s greatest surviving mural paintings.',
        inscriptions: 'Brahmi and Sanskrit donor inscriptions recording offerings by royal patrons, monks, and merchants.',
        architecture: 'Rock-cut basalt prayer halls with arched Chaitya windows, ribbed ceilings, and natural tempera murals illuminated by mirrored daylight.'
      },
      {
        key: 'ellora',
        name: 'Ellora Caves & Kailasa Temple',
        match: ['ellora', 'kailasa', 'rashtrakuta', 'cave 16', 'krishna i'],
        built: '8th century CE',
        age: 1250,
        builders: 'Rashtrakuta Dynasty (King Krishna I and master architect Kokasa)',
        city: 'Aurangabad district, Maharashtra',
        details: '34 rock-cut temples uniting Hindu, Buddhist, and Jain traditions. Cave 16 (Kailasa) is the world\'s largest monolithic excavation from a single volcanic cliff.',
        inscriptions: 'Rashtrakuta and Yadava inscriptions commemorating royal lineage and the dedication of sacred Shiva sanctums.',
        architecture: 'Top-down monolithic excavation of 200,000 tonnes of solid basalt rock, featuring multi-story pillared courtyards and life-sized carved elephants.'
      },
      {
        key: 'konark',
        name: 'Konark Sun Temple',
        match: ['konark', 'sun temple', 'narasimhadeva', 'black pagoda', 'chandrabhaga'],
        built: '1250 CE',
        age: 776,
        builders: 'King Langula Narasimhadeva I of the Eastern Ganga Dynasty',
        city: 'Puri district, Odisha',
        details: 'Designed as a colossal chariot for Surya the Sun God, with 24 carved stone wheels that function as precise astronomical sundials.',
        inscriptions: 'Odia and Sanskrit palm-leaf chronicles (Madala Panji) and temple plinth inscriptions detailing 12 years of construction under Bisu Maharana.',
        architecture: 'Kalinga-style architecture crafted from Chlorite and Khondalite stone, with 24 sundial wheels and 7 galloping horses.'
      },
      {
        key: 'brihadeeswara',
        name: 'Brihadeeswara Temple',
        match: ['brihadeeswara', 'thanjavur', 'chola', 'raja raja', 'tanjore', 'peruvudaiyar'],
        built: '1010 CE',
        age: 1016,
        builders: 'Emperor Raja Raja Chola I of the Chola Empire',
        city: 'Thanjavur, Tamil Nadu',
        details: 'A towering 66-meter granite sanctuary topped with an 80-tonne monolithic dome raised without mortar, celebrating imperial Chola naval supremacy.',
        inscriptions: 'Extensive Tamil and Grantha inscriptions covering the granite plinths, meticulously recording 400+ temple dancers, musicians, and village endowments.',
        architecture: 'Interlocking Dravidian granite masonry, square sanctum, and massive Vimana tower that has stood for over a millennium.'
      },
      {
        key: 'meenakshi',
        name: 'Meenakshi Amman Temple',
        match: ['meenakshi', 'madurai', 'sundareswarar'],
        built: '6th century CE (rebuilt 17th century)',
        age: 1400,
        builders: 'Pandya Dynasty kings & Nayak rulers (Thirumalai Nayak)',
        city: 'Madurai, Tamil Nadu',
        details: 'Sacred center of Tamil heritage dedicated to Goddess Meenakshi and Lord Sundareswarar, with 14 multi-colored towering Gopurams and the Hall of 1,000 Pillars.',
        inscriptions: 'Ancient Tamil inscriptions chronicling royal Pandya and Nayak benefactions, festivals, and sacred poetic traditions.',
        architecture: 'Dravidian temple city layout with concentric rectangular walls, polychrome sculpted towers, and the sacred Golden Lotus tank (Porthamarai Kulam).'
      },
      {
        key: 'sanchi',
        name: 'Great Stupa at Sanchi',
        match: ['sanchi', 'stupa', 'ashoka', 'torana'],
        built: '3rd century BCE',
        age: 2300,
        builders: 'Mauryan Emperor Ashoka the Great',
        city: 'Raisen district, Madhya Pradesh',
        details: 'Oldest stone structure in India enshrining Buddha\'s relics, flanked by four ornate Torana gateways carved with Jataka tales by ivory guilds.',
        inscriptions: 'Early Brahmi Prakrit edicts of Emperor Ashoka and over 600 donor inscriptions from ordinary citizens and ancient craft guilds.',
        architecture: 'Hemispherical stone dome (Anda) crowned by a triple umbrella (Chhatra) symbolizing the Three Jewels of Buddhism, surrounded by carved Toranas.'
      },
      {
        key: 'rani_ki_vav',
        name: 'Rani ki Vav (Queen\'s Stepwell)',
        match: ['rani ki vav', 'stepwell', 'patan', 'udayamati'],
        built: '1063 CE',
        age: 963,
        builders: 'Queen Udayamati (Chaulukya / Solanki Dynasty)',
        city: 'Patan, Gujarat',
        details: 'An inverted underground stepped temple descending seven levels into the earth, adorned with over 800 exquisite sculptures of Lord Vishnu\'s Dashavatara.',
        inscriptions: 'Mentioned in Merutunga\'s 1304 chronicle *Prabandha Chintamani* commemorating Queen Udayamati\'s memorial for King Bhima I.',
        architecture: 'Maru-Gurjara style subterranean stepped architecture with pillared pavilions, deep wells, and finely carved niche panels.'
      },
      {
        key: 'fatehpur',
        name: 'Fatehpur Sikri',
        match: ['fatehpur', 'buland darwaza', 'akbar', 'salim chishti'],
        built: '1571 CE',
        age: 455,
        builders: 'Mughal Emperor Akbar the Great',
        city: 'Agra district, Uttar Pradesh',
        details: 'Akbar\'s planned imperial capital featuring the 54-meter Buland Darwaza ("Gate of Magnificence") and the serene white marble tomb of Sufi saint Salim Chishti.',
        inscriptions: 'Quranic calligraphy and Persian inscriptions on the Buland Darwaza proclaiming: "The world is a bridge, pass over it, but build no houses upon it."',
        architecture: 'Red sandstone architectural synthesis blending Mughal, Persian, Gujarati, and Rajasthani palace traditions.'
      },
      {
        key: 'golden_temple',
        name: 'Golden Temple (Sri Harmandir Sahib)',
        match: ['golden temple', 'harmandir', 'amritsar', 'darbar sahib'],
        built: '1577 CE',
        age: 449,
        builders: 'Guru Ram Das & Maharaja Ranjit Singh',
        city: 'Amritsar, Punjab',
        details: 'Spiritual center of Sikhism surrounded by the holy Amrit Sarovar, with 4 open doors welcoming all humanity and the world\'s largest free langar kitchen.',
        inscriptions: 'Gurmukhi inscriptions from the Guru Granth Sahib carved in gold leaf along the marble arches and sanctum panels.',
        architecture: 'Harmonious blend of Indo-Islamic and Hindu architectural elements, overlaid with 24-karat pure gold foil.'
      },
      {
        key: 'varanasi',
        name: 'Varanasi (Kashi)',
        match: ['varanasi', 'kashi', 'banaras', 'ghat', 'ganga aarti'],
        built: 'Over 3,000 years ago (11th century BCE)',
        age: 3000,
        builders: 'Ancient sacred civilization & abode of Lord Shiva',
        city: 'Varanasi, Uttar Pradesh',
        details: 'The world\'s oldest living city, famed for its 84 historic stone ghats (Dashashwamedh, Manikarnika), Banarasi silk weaving, and evening Ganga Aarti.',
        inscriptions: 'Ancient stone pillar inscriptions and temple epigraphs recording centuries of pilgrimages, royal grants, and philosophical discourses.',
        architecture: 'Riverfront stone steps, tiered temple shikhars, narrow historic gallis, and sacred ghats hugging the sacred northern bend of the Ganges.'
      }
    ];

    // ── Reverse Context Resolution ──
    let activeEntity = null;

    // 1. Direct match in current query
    for (const ent of entities) {
      if (ent.match.some(m => q.includes(m))) {
        activeEntity = ent;
        AIGuide.lastEntity = ent;
        break;
      }
    }

    // 2. Search recent history in reverse order (newest first)
    if (!activeEntity) {
      const messagesToCheck = [
        ...((history && Array.isArray(history)) ? history : []),
        ...((AIGuide.chatHistory && Array.isArray(AIGuide.chatHistory)) ? AIGuide.chatHistory : [])
      ].slice(-10).reverse();

      for (const item of messagesToCheck) {
        const text = (item.text || item.message || '').toLowerCase();
        for (const ent of entities) {
          if (ent.match.some(m => text.includes(m))) {
            activeEntity = ent;
            AIGuide.lastEntity = ent;
            break;
          }
        }
        if (activeEntity) break;
      }
    }

    // 3. Fallback to remembered lastEntity
    if (!activeEntity && AIGuide.lastEntity) {
      activeEntity = AIGuide.lastEntity;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FOLLOW-UP HANDLERS (Context-Aware)
    // ══════════════════════════════════════════════════════════════════════════

    // ── 1. How Old / Age / Duration ──
    if (q.includes('how old') || q.includes('how long') || q.includes('age') || q.includes('years old') || q.includes('how ancient') || q.includes('till now') || q.includes('since when') || q.includes('how many year') || (q.includes('long') && q.includes('it'))) {
      if (activeEntity) {
        const centuryStr = activeEntity.age >= 1000 ? `nearly ${Math.round(activeEntity.age / 100)} centuries` : `about ${Math.round(activeEntity.age / 10)} decades`;
        return `⏳ The **${activeEntity.name}** was originally built around **${activeEntity.built}**, which makes it approximately **${activeEntity.age} years old** — that's ${centuryStr} of standing history in ${activeEntity.city}!\n\nDespite the passage of centuries, it remains one of India's most treasured landmarks, protected by the **Archaeological Survey of India (ASI)** and visited by travelers worldwide.\n\nWould you like to know who built it, explore its architecture, or learn about its inscriptions?`;
      }
      return `⏳ India's cultural heritage spans over **5,000 years** of continuous civilization — from the ancient **Indus Valley cities of Harappa and Mohenjo-daro** (3300 BCE) to medieval temple marvels and royal palaces.\n\nWhich specific monument would you like to know the age of? I can share exact dates, builders, and historical context!`;
    }

    // ── 2. Who Built It / When Was It Built / History / Dynasties / Founders ──
    if (q.includes('who built') || q.includes('who made') || q.includes('who create') || q.includes('who construct') || q.includes('builder') || q.includes('when was') || q.includes('when is it') || q.includes('history of') || q.includes('founder') || q.includes('dynasty') || q.includes('ruler') || q.includes('king') || q.includes('emperor') || (q.includes('built') && (q.includes('it') || q.includes('this') || q.includes('when') || q.includes('who')))) {
      if (activeEntity) {
        if (activeEntity.key === 'red_fort') {
          return `👑 The **Red Fort (Lal Qila)** was commissioned between **1638 and 1648 CE** by Mughal Emperor **Shah Jahan** when he relocated the imperial capital from Agra to the newly planned city of **Shahjahanabad** (Old Delhi).\n\nChief court architects **Ustad Ahmad** and **Ustad Hamid** oversaw the 10-year construction using Rajasthan red sandstone. Within its fortified walls, the Emperor held court in the marble *Diwan-i-Khas*, seated upon the fabled **Peacock Throne**.\n\nWould you like to know about its architecture, famous Persian inscriptions, or how to visit?`;
        }
        if (activeEntity.key === 'taj') {
          return `👑 The **Taj Mahal** was commissioned in **1631 CE** by Mughal Emperor **Shah Jahan** as a mausoleum of eternal devotion for his beloved empress **Mumtaz Mahal**.\n\nIt took approximately **22 years** (completed in 1653 CE) and more than **20,000 master artisans** under chief architect **Ustad Ahmad Lahori** to create this white Makrana marble masterpiece.\n\nShall I tell you about its optical calligraphy inscriptions, architecture, or visiting tips?`;
        }
        if (activeEntity.key === 'khajuraho') {
          return `👑 The **Khajuraho Temples** were built by the **Chandela Rajput Dynasty** between **950 and 1050 CE** at their sacred religious capital in Bundelkhand.\n\nKey royal patrons included **King Yashovarman** (who built Lakshmana Temple), **King Dhanga** (Visvanatha Temple), and **King Vidyadhara** (the monumental Kandariya Mahadeva Temple). Of the original 85 temples, **25 survive today**.\n\nWould you like to explore their sculptures or architecture?`;
        }
        if (activeEntity.key === 'qutub') {
          return `👑 The **Qutub Minar** was founded in **1193 CE** by **Qutb-ud-din Aibak**, founder of the Delhi Sultanate, and expanded by his successor **Shams-ud-din Iltutmish** who completed the top storeys.\n\nLater repairs and additions were made by Sultan Firoz Shah Tughlaq and Sikandar Lodi. The complex also houses the **1,600-year-old Iron Pillar** erected during the reign of Chandragupta II Vikramaditya.\n\nWould you like to know about its inscriptions or architectural design?`;
        }
        if (activeEntity.key === 'brihadeeswara') {
          return `👑 The **Brihadeeswara Temple** was built in **1010 CE** by the great Emperor **Raja Raja Chola I** to mark 25 victorious years of imperial Chola rule across South India and the seas.\n\nEngineers hauled an **80-tonne granite dome** to the top of the 66-meter tower using an inclined earth ramp stretching nearly 6 kilometers, constructing the entire temple without mortar.\n\nShall I tell you about its Tamil inscriptions or Chola bronze art?`;
        }
        return `👑 **${activeEntity.name}** was built around **${activeEntity.built}** by **${activeEntity.builders}** in **${activeEntity.city}**.\n\nIt has stood for approximately **${activeEntity.age} years** as an enduring testament to India's extraordinary architectural and cultural genius.\n\nWould you like to know more about its architecture, inscriptions, or history?`;
      }
      return `👑 India's historic monuments were built by legendary dynasties — from the **Mauryas** (Emperor Ashoka) and **Guptas**, to the **Cholas**, **Chandelas**, **Rashtrakutas**, **Vijayanagara Emperors**, and the **Mughals**.\n\nWhich specific monument or ruler would you like to explore?`;
    }

    // ── 3. Inscriptions & Epigraphy ──
    if (q.includes('inscription') || q.includes('script') || q.includes('epigraph') || q.includes('writing') || q.includes('written') || q.includes('language') || q.includes('engrav')) {
      if (activeEntity) {
        return `📜 The inscriptions of **${activeEntity.name}** hold great historical significance:\n\n${activeEntity.inscriptions}\n\nThese epigraphs offer a direct window into the royal courts, spiritual philosophy, and artistic dedication of ancient India.\n\nWould you like to know about who built it, its architecture, or folklore?`;
      }
      return `📜 India is home to over **100,000 historical inscriptions** on stone plinths, pillars, and copper plates (*Tamrapatra*) — including the 3rd-century BCE **Ashokan Edicts** in Brahmi and Kharosthi, royal Chola Tamil chronicles, and exquisite Mughal Thuluth calligraphy.\n\nWhich monument's inscriptions would you like to dive into?`;
    }

    // ── 4. Sculptures, Murals & Art ──
    if (q.includes('sculpture') || q.includes('carving') || q.includes('statue') || q.includes('erotic') || q.includes('mural') || q.includes('painting') || q.includes('mithuna') || q.includes('art')) {
      if (activeEntity && activeEntity.key === 'khajuraho') {
        return `🎨 Contrary to common belief, only about **10% of Khajuraho's sculptures are erotic** (*Mithuna*). The remaining 90% vividly depict medieval daily life — musicians, warriors, cosmic deities, and celestial maidens (*Apsaras*) applying makeup or removing thorns from their feet.\n\nPhilosophically, they embody the four **Purusharthas** (goals of life): *Dharma*, *Artha*, *Kama*, and *Moksha*, carved with lifelike anatomical grace from golden sandstone.\n\nWould you like to know who built them or explore the temple architecture?`;
      }
      if (activeEntity && activeEntity.key === 'ajanta') {
        return `🎨 The **Ajanta Cave murals** represent the golden age of ancient Indian painting. The most famous is the **Bodhisattva Padmapani** in Cave 1 — depicting a serene, lotus-bearing figure whose compassionate gaze has captivated the world for over 1,500 years.\n\nMonk artists used natural mineral pigments like crushed lapis lazuli and red ochre, painting on mud-plastered rock using a *tempera fresco* technique.\n\nShall I tell you about the rock-cut architecture or the Ellora Caves?`;
      }
      if (activeEntity) {
        return `🎨 The artwork at **${activeEntity.name}** is a masterclass in craftsmanship: ${activeEntity.details}\n\nEvery carved stone and fresco was designed according to sacred proportion and cosmic balance.\n\nWould you like to know about its history, builders, or visiting guide?`;
      }
    }

    // ── 5. Architecture & Engineering ──
    if (q.includes('architecture') || q.includes('design') || q.includes('engineering') || q.includes('how was it built') || q.includes('material') || q.includes('style') || q.includes('height') || q.includes('structure')) {
      if (activeEntity) {
        return `🏛️ **${activeEntity.name}** is renowned for its architectural excellence:\n\n${activeEntity.architecture}\n\nBuilt around **${activeEntity.built}**, its structural harmony and enduring resilience continue to astonish modern architects and engineers.\n\nWould you like to know who built it, explore its inscriptions, or learn travel tips?`;
      }
      return `🏛️ India features diverse architectural traditions — from the soaring shikharas of **Nagara style** in the North, to the massive granite gopurams of **Dravidian style** in the South, and the symmetrical domes of **Indo-Islamic architecture**.\n\nWhich monument's architecture would you like to discover?`;
    }

    // ── 6. Travel / Visit / Timings ──
    if (q.includes('how to reach') || q.includes('visit') || q.includes('ticket') || q.includes('timing') || q.includes('best time') || q.includes('where is') || q.includes('how to go') || q.includes('travel')) {
      if (activeEntity) {
        return `✈️ **${activeEntity.name}** is located in **${activeEntity.city}**.\n\n• **Best Time to Visit:** October to March when the weather is pleasant.\n• **Preservation:** Maintained by the **Archaeological Survey of India (ASI)**, open generally from sunrise to sunset.\n• **Explorer Tip:** Visit during early morning or late afternoon for the best golden-hour lighting and photography.\n\nWould you like to hear a detailed historical legend about ${activeEntity.name}?`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  GREETINGS & GENERAL INTRO
    // ══════════════════════════════════════════════════════════════════════════
    if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
      return `🙏 **Namaste, ${userName}!** Welcome to Virasat AI — your personal guide to India's 5,000 years of heritage.\n\nI can guide you through **UNESCO World Heritage Sites**, famous **monuments & temples**, royal **dynasties**, classical **dance & music**, and vibrant **festivals**. You can also ask follow-up questions like "when was it built?" or "tell me about its inscriptions" — I'll remember what we're discussing.\n\nWhat would you like to explore today?`;
    }

    if (q.includes('kaise ho') || q.includes('how are you')) {
      return `🙏 I'm doing great, ${userName}, immersed in India's glorious history! What would you like to discover today — a monument, dynasty, festival, or ancient story?`;
    }

    if (q.includes('who are you') || q.includes('kya ho') || q.includes('kya kar sakte ho') || q.includes('help')) {
      return `🙏 I'm **Virasat AI**, your AI cultural guide on BharatVirasat. I can share in-depth historical knowledge, architectural insights, artisan legends, travel tips, and generate interactive quizzes on any Indian heritage topic!`;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  PRIMARY MONUMENTS (Rich Conversational Paragraphs)
    // ══════════════════════════════════════════════════════════════════════════
    if (q.includes('red fort') || q.includes('lal qila')) {
      return `🏰 The **Red Fort (Lal Qila)** in Old Delhi is one of India's most iconic historic fortresses. Commissioned between **1638 and 1648 CE** by Mughal Emperor **Shah Jahan** when shifting the imperial capital from Agra to Shahjahanabad, its massive red sandstone bastions have guarded Delhi for nearly four centuries.\n\nInside its fortified walls lie exquisite royal halls like the *Diwan-i-Aam* and the marble *Diwan-i-Khas*, which once housed the legendary Peacock Throne. Every year on **15 August (Independence Day)**, the Prime Minister hoists the national tricolor flag from its ramparts.\n\nWould you like to know about who built it, its architecture, or famous Persian inscriptions?`;
    }

    if (q.includes('taj') || q.includes('agra')) {
      return `🏛️ The **Taj Mahal** in Agra is one of the most breathtaking monuments ever created. Commissioned between **1631 and 1653 CE** by Mughal Emperor **Shah Jahan** in memory of his beloved wife **Mumtaz Mahal**, it is a masterpiece of Indo-Islamic symmetry crafted from pristine white **Makrana marble** and inlaid with 28 varieties of semi-precious gems.\n\nRecognized as a **UNESCO World Heritage Site** and one of the New 7 Wonders of the World, it transforms its hues with the heavens — glowing soft rose at dawn and shimmering gold beneath the full moon.\n\nWould you like to know about its optical calligraphy inscriptions, architecture, or who built it?`;
    }

    if (q.includes('khajuraho') || q.includes('chandela')) {
      return `🛕 The **Khajuraho Temples** in Madhya Pradesh are among India's finest architectural treasures. Built between **950 and 1050 CE** by the **Chandela Rajput dynasty**, these sublime **Nagara-style sandstone temples** feature thousands of intricate sculptures celebrating spiritual devotion, cosmic deities, music, dance, and human passion.\n\nThe crown jewel is the towering **Kandariya Mahadeva Temple**, dedicated to Lord Shiva, designed with 84 mini-spires mimicking sacred Mount Kailash.\n\nWould you like to explore their famous sculptures, inscriptions, or history?`;
    }

    if (q.includes('qutub') || q.includes('qutb')) {
      return `🗼 The **Qutub Minar** in Delhi is the world's tallest brick minaret at **72.5 meters**, featuring five fluted red sandstone storeys. Built starting **1193 CE** under **Qutb-ud-din Aibak** and completed by **Iltutmish**, it stands as a landmark of medieval Indo-Islamic architecture.\n\nThe complex also houses the famous **1,600-year-old Iron Pillar** — an ancient metallurgical marvel that has resisted rust for over sixteen centuries.\n\nWould you like to know about its inscriptions or history?`;
    }

    if (q.includes('hampi') || q.includes('vijayanagara')) {
      return `🏛️ **Hampi** in Karnataka was the glorious capital of the **Vijayanagara Empire** (14th–16th centuries). Medieval European and Persian travelers described it as one of the **wealthiest metropolises in the world**, where diamonds and rubies were traded openly in street bazaars.\n\nThe UNESCO site features over **1,600 surviving monuments**, including the iconic **Monolithic Stone Chariot**, the 56 musical resonance pillars of Vittala Temple, and the ancient Virupaksha Temple.\n\nWant to know about who built Hampi, its architecture, or the Vijayanagara dynasty?`;
    }

    if (q.includes('ajanta')) {
      return `🎨 The **Ajanta Caves** in Maharashtra are **30 rock-cut Buddhist temples** dating from the **2nd century BCE to 5th century CE**, carved into a volcanic cliff along the Waghora River. They preserve ancient India's **greatest surviving mural paintings**, including the world-famous *Bodhisattva Padmapani*.\n\nForgotten for centuries under dense forest, they were rediscovered in 1819 by British officer John Smith during a tiger hunt.\n\nWould you like to know about the murals or the nearby Ellora Caves?`;
    }

    if (q.includes('ellora') || q.includes('kailasa')) {
      return `⛰️ The **Ellora Caves** in Maharashtra represent Buddhist, Hindu, and Jain traditions side by side. The undisputed highlight is the **Kailasa Temple (Cave 16)**, the world's largest monolithic rock excavation.\n\nMaster architect Kokasa and Rashtrakuta artisans carved the entire temple **top-down from a basalt cliff**, removing over **200,000 tonnes of solid rock** without scaffolding!\n\nShall I tell you about the Rashtrakuta dynasty or the temple's engineering feats?`;
    }

    if (q.includes('konark') || q.includes('sun temple')) {
      return `☀️ The **Konark Sun Temple** in Odisha, built in **1250 CE** by King **Langula Narasimhadeva I**, is designed as a colossal celestial chariot for the **Sun God Surya** — complete with **24 carved wheels** pulled by 7 galloping horses.\n\nThe wheel spokes function as **precise astronomical sundials** calculating exact time by the sun's shadow down to the minute.\n\nWould you like to hear the legend of child architect Dharmapada or learn about its carvings?`;
    }

    if (q.includes('brihadeeswara') || q.includes('thanjavur') || q.includes('chola')) {
      return `🛕 The **Brihadeeswara Temple** in Thanjavur, built in **1010 CE** by **Raja Raja Chola I**, is an engineering triumph. Built entirely of **interlocking granite without mortar**, its 66-meter Vimana tower is crowned by a single **80-tonne granite dome** hoisted via a 6 km inclined ramp.\n\nIt nurtured classical **Bharatnatyam dance** and Chola lost-wax bronze casting (Nataraja).\n\nWant to explore its Tamil inscriptions or the Chola maritime empire?`;
    }

    if (q.includes('meenakshi') || q.includes('madurai')) {
      return `🌸 The **Meenakshi Amman Temple** in Madurai is a jewel of **Dravidian architecture**, dedicated to Goddess **Meenakshi (Parvati)** and **Sundareswarar (Shiva)**. Its **14 towering Gopurams** are adorned with thousands of hand-painted mythological statues, representing 2,500 years of living Tamil heritage.\n\nWould you like to know about Dravidian architecture or Tamil festivals?`;
    }

    if (q.includes('sanchi') || q.includes('stupa')) {
      return `☸️ The **Great Stupa at Sanchi** in Madhya Pradesh is the **oldest stone structure in India**, commissioned in the **3rd century BCE by Emperor Ashoka** over Buddha's sacred relics. Its four magnificent carved gateways (*Toranas*) depict Jataka tales with astonishing artistic detail.\n\nWould you like to know about Ashoka's Brahmi edicts or the gateway carvings?`;
    }

    if (q.includes('rani ki vav') || q.includes('stepwell')) {
      return `💧 **Rani ki Vav** in Patan, Gujarat, is an inverted underground temple built in **1063 CE** by **Queen Udayamati** in memory of King Bhima I. It descends through **7 terraced levels** adorned with over 800 sculptures of Lord Vishnu's *Dashavatara*.\n\nIt is so celebrated that it is featured on the Indian **₹100 banknote**.\n\nWant to explore Gujarat's other heritage sites?`;
    }

    if (q.includes('varanasi') || q.includes('kashi')) {
      return `🪔 **Varanasi (Kashi)** is one of the world's oldest continuously inhabited cities, nestled along the holy **Ganga** in Uttar Pradesh for over **3,000 years** as the abode of Lord Shiva.\n\nFamous for its **84 historic ghats** (Dashashwamedh, Manikarnika), the evening **Ganga Aarti**, Banarasi silk weaving, and classical music heritage, it is the spiritual heart of India.\n\nWant to know about Kashi Vishwanath Temple or the Ganga Aarti?`;
    }

    // ── Arts, Festivals & Dynasties ──
    if (q.includes('dance') || q.includes('bharatnatyam') || q.includes('kathak')) {
      return `💃 India features **eight classical dance traditions**: **Bharatnatyam** (Tamil Nadu), **Kathak** (North India), **Kathakali** (Kerala), **Odissi** (Odisha), **Kuchipudi** (Andhra), **Manipuri**, **Mohiniyattam**, and **Sattriya** (Assam).\n\nEach dance form weaves ancient Natya Shastra traditions of rhythm, mudras, and divine storytelling.\n\nWould you like to explore a specific dance form in detail?`;
    }

    if (q.includes('festival') || q.includes('diwali') || q.includes('holi')) {
      return `🎉 India's festivals are joyous celebrations of history and devotion! **Diwali** celebrates the victory of light over darkness and Lord Rama's return to Ayodhya. **Holi** marks spring and the divine love of Radha-Krishna. **Durga Puja** in Bengal and **Navratri** in Gujarat celebrate the divine feminine with art and dance.\n\nWhich festival would you like to explore?`;
    }

    if (q.includes('mughal') || q.includes('chola') || q.includes('maurya')) {
      return `👑 India's great empires shaped world history: the **Mauryan Empire** (Ashoka's Ahimsa and Dhamma), the **Chola Empire** (naval expeditions across Southeast Asia and granite temples), and the **Mughal Empire** (Akbar's synthesis and Shah Jahan's marble monuments).\n\nWhich dynasty would you like to dive into?`;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  SMART CONTEXTUAL FALLBACK
    // ══════════════════════════════════════════════════════════════════════════
    if (activeEntity) {
      return `I see you're asking about **${activeEntity.name}** in ${activeEntity.city}, built around **${activeEntity.built}** by **${activeEntity.builders}**.\n\nI can tell you about its **architecture**, **inscriptions**, **history**, **sculptures**, or share **visiting tips**. Just let me know what you'd like to explore next!`;
    }

    return `That's a fascinating topic! I'd love to help you explore it, ${userName}. Could you mention a specific **monument** (like Red Fort, Taj Mahal, Khajuraho, Hampi), **dynasty** (Mughal, Chola, Maurya), **festival** (Diwali, Holi), or **art form** (Bharatnatyam, Madhubani)?\n\nYou can also ask questions like "Tell me about the Konark Sun Temple" or "Who built the Red Fort?" — I'll walk you through everything in detail!`;
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

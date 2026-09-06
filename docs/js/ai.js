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
      // 1. Try Direct live Gemini 3.6 Flash from client
      let reply = await AIGuide.callGeminiDirect(message, AIGuide.chatHistory);

      // 2. If client direct fails, try backend API
      if (!reply) {
        const res = await API.aiChat(message, AIGuide.chatHistory.slice(-10));
        if (res && res.reply) reply = res.reply;
      }

      AIGuide.hideTyping();
      if (reply && reply.trim().length > 0) {
        AIGuide.chatHistory.push({ role: 'model', text: reply.trim() });
        AIGuide.appendMessage({ role: 'model', text: reply.trim() });
      } else {
        throw new Error('Fallback needed');
      }
    } catch (err) {
      AIGuide.hideTyping();
      const fallbackReply = AIGuide.getInstantAnswer(message, AIGuide.chatHistory);
      AIGuide.chatHistory.push({ role: 'model', text: fallbackReply });
      AIGuide.appendMessage({ role: 'model', text: fallbackReply });
    }
  },

  // ─── Direct In-Browser Live Gemini 3.6-Flash Engine ───────────────────────
  async callGeminiDirect(message, history = []) {
    const key = (typeof window !== 'undefined' && (window.GEMINI_KEY || localStorage.getItem('gemini_api_key'))) ? (window.GEMINI_KEY || localStorage.getItem('gemini_api_key')) : '';
    if (!key) return null;
    const userName = (typeof Auth !== 'undefined' && Auth.currentUser?.name) ? Auth.currentUser.name.split(' ')[0] : 'Explorer';
    const sysPrompt = `You are Virasat AI (विरासत AI), India's premier, highly knowledgeable, friendly, and expert heritage guide.
You are currently in a personal session with ${userName}.
Always provide rich, natural, deeply informative, and engaging conversational responses without rigid bullet points or repetitive boilerplate.
Highlight key historical figures, dates, dynasties, architectural terms, and scriptures in **bold**.
Provide thorough, accurate, and detailed context. When asked follow-ups, maintain seamless continuity with previous questions.`;

    const contents = [
      { role: 'user', parts: [{ text: `${sysPrompt}\nPlease acknowledge and begin guiding.` }] },
      { role: 'model', parts: [{ text: `Namaste, ${userName}! I am Virasat AI, your personal guide to India's 5,000-year-old heritage.` }] }
    ];

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-8).forEach(h => {
        const role = (h.sender === 'user' || h.role === 'user') ? 'user' : 'model';
        const text = h.text || h.message || '';
        if (text) contents.push({ role, parts: [{ text }] });
      });
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const models = ['gemini-3.6-flash', 'gemini-2.5-pro'];
    for (const m of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        console.warn(`Client direct Gemini ${m} error:`, e.message);
      }
    }
    return null;
  },

  // ─── Comprehensive Multi-Domain Heritage Knowledge Engine ─────────────────
  lastEntity: null,
  sessionTopics: {}, // entityKey -> Set of covered topics

  getInstantAnswer(message, history = []) {
    let raw = message.trim();
    let q = raw.toLowerCase();

    // ── Extensive Typo Normalization ──
    q = q
      .replace(/\b(ling|longg|lon)\b/g, 'long')
      .replace(/\b(beedn|beend|ben|benn)\b/g, 'been')
      .replace(/\b(bild|biuld|build|biult|buil|bult|buld|bld)\b/g, 'built')
      .replace(/\b(artecthiure|artecthuire|architecher|architectur|arcitecture|arkitecture|artecture|architechture|artitecture|architect|artethuireand|artecthure|architecter)\b/g, 'architecture')
      .replace(/\b(scluptures|sclupture|sclptur|sclptures|sculptre|sculpter|sculpure|scuptures|sclupt|sculp)\b/g, 'sculpture')
      .replace(/\b(inscrption|inscriptin|inscripton|inscript|inscripshuns|inscriptione)\b/g, 'inscription')
      .replace(/\b(poerp|peore|porper|propr|proper)\b/g, 'proper')
      .replace(/\b(theiufnormation|theinformation|infomation|infrmation|informtion|infor)\b/g, 'information')
      .replace(/\b(detial|detaile|detales|dital|ditail)\b/g, 'detail')
      .replace(/\b(wen|whens|whn|whne)\b/g, 'when')
      .replace(/\b(hoo|whos|whoo|whoes)\b/g, 'who')
      .replace(/\b(wat|wats|whut|wot)\b/g, 'what')
      .replace(/^tel\b|^tell me\b|^tle\b/g, 'tell')
      .replace(/^abt\b|^abou\b/g, 'about')
      .replace(/\b(histry|histroy|histery|histoy)\b/g, 'history')
      .replace(/\b(it history|its histroy|about it history|about its history)\b/g, 'history')
      .replace(/\b(tempel|tempal|templee|tmple)\b/g, 'temple')
      .replace(/\b(monumnet|monumet|monumentt)\b/g, 'monument')
      .replace(/\b(festval|festivel|festivl|festivals)\b/g, 'festival')
      .replace(/\b(dynesty|dynasti|dynastie|dynasties)\b/g, 'dynasty')
      .replace(/\b(ruler|rular|ruelr|rulers)\b/g, 'ruler')
      .replace(/\b(emperor|emperer|emperur|emperors)\b/g, 'emperor')
      .replace(/\b(travel details|travel guide|how to visit|travel|visiting details|visiting tips|directions)\b/g, 'travel');

    // Get user's first name for natural conversational interaction
    const userName = (typeof Auth !== 'undefined' && Auth.currentUser?.name) ? Auth.currentUser.name.split(' ')[0] : 'Explorer';

    // ── Comprehensive Heritage Entity Research Knowledge Base ──
    const entities = [
      {
        key: 'khajuraho',
        name: 'Khajuraho Temples',
        match: ['khajuraho', 'chandela', 'kandariya', 'chhatarpur', 'lakshmana temple', 'visvanatha', 'purushartha', 'mithuna'],
        built: '950–1050 CE',
        startYear: 950,
        age: 1076,
        city: 'Chhatarpur district, Madhya Pradesh',
        overview: `🛕 The **Khajuraho Group of Monuments** in Madhya Pradesh is an internationally celebrated UNESCO World Heritage Site (inscribed 1986 under Criteria i, iii). Constructed between **950 and 1050 CE** during the apex of the **Chandela Rajput Dynasty**, these sandstone sanctuaries represent the ultimate zenith of northern Indian **Nagara-style temple architecture**. Dedicated to Shiva, Vishnu, and the Jain Tirthankaras, they embody the synthesis of spiritual transcendence (*Moksha*) with cosmological, royal, and erotic vibrancy (*Dharma, Artha, Kama*).`,
        history: `👑 **Historical Chronicles & Dynastic Context**:

• **The Chandela Golden Age:** Originating as feudatories of the imperial Gurjara-Pratiharas, the Chandela Rajputs established sovereign rule over Jejakabhukti (modern Bundelkhand) in the 10th century. Rulers like **Harshadeva**, **Yashovarmadeva** (r. 925–950 CE), **Dhangadeva** (r. 950–1002 CE), and **Vidyadhara** (r. 1003–1035 CE) transformed Khajuraho into their religious capital.
• **Royal Patronage:** Yashovarman commissioned the **Lakshmana Temple** (dedicated in 954 CE) to enshrine a sacred Vaikuntha Vishnu idol obtained from the ruler of Kashmir. King Dhanga built the **Visvanatha Temple** (1002 CE), while Vidyadhara celebrated his successful resistance against Mahmud of Ghazni by raising the monumental **Kandariya Mahadeva Temple** (~1030 CE).
• **Medieval Eclipse & Rediscovery:** Following the sack of Kalinjar in 1202 CE, Khajuraho fell into obscurity, protected by dense teak forests until British surveyor **Captain T.S. Burt** re-documented the site in 1838 with the help of local guides. Out of 85 original temples spread across 20 sq km, **25 survive today** across Western, Eastern, and Southern complexes.`,
        builders: `👑 **Builders & Guilds of Khajuraho**:

Commissioned by the **Chandela Kings** and patronized by court prime ministers like Prabhasa. Construction was executed by vast artisan guilds (*Shrenis*) under master architects (*Sutradharas*) such as **Chhichha**, who oversaw thousands of hereditary sculptors, stone masons, and iconographers working in tight accordance with classical **Vastu Shastra** canons.`,
        why: `🎯 **Theological & Cosmological Purpose**:

Khajuraho was conceived as a microcosm of the sacred universe (*Vastu Purusha Mandala*). Rejecting severe asceticism, the Chandelas subscribed to Kashmir Shaivism, Kaula-Kapalika, and Tantric-Puranic philosophies that viewed phenomenal reality and spiritual liberation as inseparable. The temples celebrate the full spectrum of human existence—devotion, warfare, music, fertility, and divine love.`,
        ageText: `⏳ **Chronology & Age**:

Construction began around **950 CE** under Yashovarman and concluded circa **1050 CE**. Measuring from 950 CE to the present year (2026), the temples are **1,076 years old** (spanning more than **10 centuries** of architectural survival).`,
        architecture: `🏛️ **Architectural Analysis & Structural Layout**:

Khajuraho represents the refined **Sandhara / Panchayatana** Nagara style elevated on a high podium (*Jagati*):
1. **Axial Alignment:** Temples follow a strict East-West axis:
   • *Ardhamandapa* (entrance portico with makara torana)
   • *Mandapa* (pillared assembly hall with pyramidal *phamsana* roof)
   • *Mahamandapa* (transept with lateral transepts and balconies / *jharokhas*)
   • *Antarala* (vestibule connecting human and divine realms)
   • *Garbhagriha* (unadorned, dark inner sanctum enshrining the deity)
   • *Pradakshina Patha* (circumambulatory ambulatory path).
2. **The Shikhara System:** The soaring superstructure of Kandariya Mahadeva reaches **31 meters (102 feet)** and is clustered with **84 miniature subordinate spires (*Urushringas*)**. These ascend rhythmically like Himalayan foothills, symbolizing the cosmic axis **Mount Meru**.
3. **Lighting & Airflow:** Perforated balconies (*Kakshasanas*) create a dramatic interplay of light and shadow, illuminating interior friezes while keeping sanctums cool.`,
        sculptures: `🎨 **Iconography, Sculptures & Decorative Friezes**:

Khajuraho's walls preserve over **20,000 sculptures** carved in high and medium relief:
• **The 90/10 Ratio:** Contrary to sensationalized myths, only about **10% of carvings are erotic (*Mithuna*)**. The remaining 90% illustrate everyday medieval life, mythological battles, musicians playing veenas and mridangams, ascetics teaching disciples, and cosmic deities.
• **Apsaras & Surasundaris:** Celestial maidens are depicted in dynamic tribhanga postures applying kajal (*anjanasana*), extracting thorns from soles, drying wet hair, writing love epistles, or adjusting anklets.
• **Mithuna Panels:** Concentrated on the junction wall (*Karpura-manjari*) linking the Mahamandapa and Garbhagriha, erotic postures symbolize Tantric union (*Yab-Yum*), the dissolving of duality (*Jivatma* and *Paramatma*), and serve as protective apotropaic talismans warding off lightning and evil spirits.`,
        inscriptions: `📜 **Epigraphy & Inscriptions**:

• **Language & Script:** Classical **Sanskrit** engraved in the northern **Kutila / Early Nagari** script.
• **Lakshmana Temple Inscription (954 CE):** A 28-line stone slab recording the Chandela genealogy from the mythical sage Chandratreya down to Yashovarman and Dhanga.
• **Visvanatha Temple Inscription (1002 CE):** Composed by court poet Rama, dedicating the temple to Shiva and recording the donation of two emerald and stone lingams by King Dhanga.`,
        materials: `🧱 **Petrography & Engineering Joinery**:

Constructed from fine-grained, buff-colored **sandstone** quarried from the Ken riverbed near Panna, resting on massive sub-foundations of hard local granite. Stones were assembled purely using **dry masonry** (no mortar) with precision mortise-and-tenon joints, iron dowels, and gravity interlocking.`,
        researchNotes: `🔬 **Archaeological & Research Notes**:

• **ASI Conservation:** Modern 3D laser-scanning and moisture-penetration monitoring by the Archaeological Survey of India (ASI).
• **Microclimate Studies:** Sandstone exfoliation due to diurnal temperature swings and fungal bio-films is currently treated using biocide preservation treatments and consolidation resins.
• **Key Academic References:** Krishna Deva (*Temples of Khajuraho*, ASI, 1990); Devangana Desai (*The Religious Imagery of Khajuraho*, 1996); Stella Kramrisch (*The Hindu Temple*, 1946).`,
        travel: `✈️ **Field Visit & Research Guide**:

• **Location:** Chhatarpur District, Madhya Pradesh (24.8318° N, 79.9199° E).
• **Transit:** Khajuraho Airport (HJR) connects Delhi/Varanasi; Khajuraho Railway Station (KURJ) connects Delhi, Bhopal, and Jaipur.
• **Timings & Fees:** Sunrise to sunset daily; ASI Western Group requires entry ticket (₹40 Indian / ₹600 Foreign). Light & Sound Show in English/Hindi every evening.
• **Research Facilities:** ASI Archaeological Museum on site houses exquisite Chandela stone sculptures and epigraphical casts.`
      },
      {
        key: 'red_fort',
        name: 'Red Fort (Lal Qila)',
        match: ['red fort', 'lal qila', 'redfort', 'lal kila', 'delhi fort', 'shahjahanabad', 'diwan-i-khas', 'diwan-i-aam'],
        built: '1638–1648 CE',
        startYear: 1638,
        age: 388,
        city: 'Old Delhi (Shahjahanabad)',
        overview: `🏰 The **Red Fort (Lal Qila)** is a monumental 17th-century Mughal imperial palace fortress in Old Delhi, designated a UNESCO World Heritage Site in 2007. Commissioned in **1638 CE** by the fifth Mughal Emperor **Shah Jahan** upon transferring his court from Agra, this red sandstone citadel served as the zenith of Indo-Islamic-Persian palatial architecture for over two centuries.`,
        history: `👑 **Historical Chronicles & Political Significance**:

• **Foundation (1638–1648 CE):** Shah Jahan laid the foundation stone on 12 May 1638 (Muharram 1048 AH) on the western bank of the Yamuna. Under the superintendence of **Ghairat Khan** and **Makramat Khan**, construction took precisely 9 years, 11 months, costing 10 million rupees.
• **Imperial Seat:** Housed emperors from Shah Jahan to Aurangzeb, Farrukhsiyar, Muhammad Shah (witnessing Nadir Shah's 1739 sack of Delhi), and Bahadur Shah Zafar II.
• **The 1857 Uprising:** The epicenter of the 1857 First War of Independence. Following British reconquest, over 80% of internal pavilion structures were demolished for military barracks.
• **National Symbol of Sovereign India:** On **15 August 1947**, Prime Minister Jawaharlal Nehru unfurled the national tricolor from the Lahori Gate ramparts, inaugurating the annual Independence Day address.`,
        builders: `👑 **Architects & Master Craftsmen**:

Designed by chief imperial architects **Ustad Ahmad Lahori** (who also designed the Taj Mahal) and **Ustad Hamid**, working with tens of thousands of masons, stone cutters from Rajasthan, and Italian/Persian lapidary specialists.`,
        why: `🎯 **Strategic & Imperial Purpose**:

Agra Fort had become congested, militarily vulnerable, and climatically harsh. Shah Jahan envisioned a spacious, planned metropolis (**Shahjahanabad**) along the perennial Yamuna, strategically positioned at the nexus of the Grand Trunk road and northern trading networks, designed to reflect the terrestrial model of Paradise (*Jannat*).`,
        ageText: `⏳ **Chronology & Age**:

Begun in **1638 CE** and inaugurated in **1648 CE**. As of 2026, the Red Fort is **388 years old** (nearly four centuries of continuous national history).`,
        architecture: `🏛️ **Architectural Layout & Spatial Geometry**:

An irregular octagonal citadel spanning **254 acres** enclosed by a 2.41 km curtain wall:
1. **Ramparts & Gates:** Soaring 18-meter riverfront to 33-meter landward walls with battlements, machicolations, and two monumental gates—**Lahori Gate** (west) and **Delhi Gate** (south).
2. **Chhatta Chowk (Meena Bazaar):** A 37-bay vaulted, two-storey covered arcade that served as the imperial silk and jewelry market.
3. **Naubat Khana (Drum House):** Entrance to inner court where royal musicians announced visitors and nobles dismounted.
4. **Diwan-i-Aam (Public Audience):** 40-pillared red sandstone hall featuring the elevated marble **Baldachin (Jharokha-i-Murassa)** throne canopy.
5. **Diwan-i-Khas (Private Council):** Pure Makrana marble pavilion where the fabled jewel-encrusted **Peacock Throne (*Takht-i-Taus*)** stood before 1739.
6. **Khas Mahal & Rang Mahal:** Private imperial apartments cooled by the **Nahr-i-Bihisht (Stream of Paradise)** channel fed by the Yamuna via the western Yamuna canal.`,
        sculptures: `🎨 **Decorative Arts, Pietra Dura & Carvings**:

• **Pietra Dura (*Parchin Kari*):** Behind the Diwan-i-Aam throne canopy sits an exceptional series of Florentine pietra dura black marble plaques depicting birds, lion-and-lamb harmony, and the Greek mythological hero **Orpheus charming beasts with his lute** (attributed to Florentine artist Austin de Bordeaux).
• **Marble Jalis:** Intricately perforated geometric and floral lattice screens carved from single marble slabs in the Khas Mahal and Hammam.
• **Nahr-i-Bihisht Lotus Basins:** Scalloped marble basins with central fountain jets designed to shimmer under candlelight.
• **Rang Mahal Ceilings:** Elaborate gilded woodwork, polychrome floral frescoes, and mirror-work (*Aina-Kari*) that reflected water cascading through floor channels.`,
        inscriptions: `📜 **Inscriptions & Persian Epigraphy**:

• **The Golden Inscription of Diwan-i-Khas:** Gilded Persian Nasta'liq calligraphy on the northern and southern arches quoting **Amir Khusrau**:
  *"Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast"*
  (If there is a paradise on the face of the earth, it is this, it is this, it is this).
• **Moti Masjid & Imperial Seals:** Quranic inscriptions and imperial chronograms etched into marble facades.`,
        materials: `🧱 **Petrography & Engineering**:

Built of fine-grained **Rajasthan Red Sandstone** (quarried from Fatehpur Sikri / Bharatpur regions) for defensive ramparts and **Makrana White Marble** (Nagaur, Rajasthan) for the royal pavilions. Foundations rest on stone rubble masonry and wooden piles embedded in the Yamuna silt.`,
        researchNotes: `🔬 **Archaeological & Academic Research**:

• **ASI Excavations:** Unearthed structural evidence of ancient **Painted Grey Ware (PGW)** culture beneath the fort's southern lawns, correlating with the mythical Mahabharata city of **Indraprastha**.
• **Conservation Projects:** Conservation of British-era colonial barracks into five modern historical museums (Subhash Chandra Bose Museum, 1857 Memorial, Azadi Ke Deewane, Yaad-e-Jallian, Drishyakala).
• **Key References:** Ebba Koch (*Mughal Architecture*, 2002); Gordon Risley Hearn (*The Seven Cities of Delhi*, 1906); ASI Architectural Survey Reports.`,
        travel: `✈️ **Field Visit & Research Guide**:

• **Location:** Netaji Subhash Marg, Chandni Chowk, Old Delhi (28.6562° N, 77.2410° E).
• **Transit:** Lal Qila Metro Station (Violet Line, Gate 4) or Chandni Chowk (Yellow Line).
• **Timings:** 9:30 AM – 4:30 PM (Closed on Mondays); Tickets online via ASI portal.
• **Special Features:** Sound & Light Show, Swatantrata Sangram Museum, Mumtaz Mahal Museum.`
      },
      {
        key: 'taj',
        name: 'Taj Mahal',
        match: ['taj mahal', 'taj', 'mumtaz', 'shah jahan', 'agra', 'mumtaz mahal', 'ustad ahmad lahori'],
        built: '1631–1653 CE',
        startYear: 1631,
        age: 395,
        city: 'Agra, Uttar Pradesh',
        overview: `🏛️ The **Taj Mahal** in Agra is globally celebrated as the supreme jewel of Indo-Islamic architecture and a UNESCO World Heritage Site (1983, Criterion i). Commissioned in **1631 CE** by the fifth Mughal Emperor **Shah Jahan** as the final resting mausoleum (*Rauza*) for his favorite consort **Arjumand Banu Begum (Mumtaz Mahal)**, this marble marvel embodies perfect bilateral symmetry, cosmic geometry, and paradise garden allegories.`,
        history: `👑 **Historical Chronicles & Primary Sources**:

• **The Tragic Impetus:** Mumtaz Mahal died on 17 June 1631 in Burhanpur during the birth of her 14th child (Gauhar Ara Begum). Her remains were temporarily interred in Burhanpur before being brought to Agra in December 1631.
• **Construction Timeline (1631–1653 CE):** Chronicled in official Mughal court annals like the *Badshahnama* of Abdul Hamid Lahori and Muhammad Salih Kambo's *Amal-i Salih*. Construction of the plinth and tomb took 12 years (~1643 CE), while auxiliary buildings, minarets, and gardens took another decade, finishing in 1653 CE at an imperial cost of 32 million rupees.
• **Post-Shah Jahan Era:** Shah Jahan was imprisoned in Agra Fort by his son Aurangzeb in 1658, gazing upon the Taj Mahal until his death in 1666, when he was interred beside Mumtaz Mahal.`,
        builders: `👑 **The Imperial Architectural Board**:

Led by chief architect **Ustad Ahmad Lahori**, with **Mir Abd-ul Karim** and **Makramat Khan** managing fiscal and logistical operations. Master calligrapher **Amanat Khan Shirazi** designed the epigraphs, Ismail Afandi (Ottoman Empire) designed the dome, and Chiranjilal of Delhi directed mosaic lapidary guilds comprising over **20,000 workers**.`,
        why: `🎯 **Theological & Philosophical Concept**:

Conceived as a physical manifestation of the **Throne of God (*Arsh*)** suspended above the Gardens of Paradise (*Jannat* / *Rawdah*) on the Day of Judgment. The four-part *Charbagh* garden divided by four water channels represents the four rivers of paradise (milk, honey, water, wine) described in Surah Muhammad.`,
        ageText: `⏳ **Chronology & Age**:

Commissioned in **1631 CE**. As of 2026, the Taj Mahal is **395 years old** (nearly 4 full centuries of architectural legacy).`,
        architecture: `🏛️ **Architectural Precision & Engineering Breakdown**:

1. **Bilateral Symmetry:** Flawless axial symmetry centered on the tomb. The complex is flanked by two identical red sandstone structures: the active **Mosque (*Masjid*)** to the west and its identical architectural mirror **Jawab (*Mehman Khana*)** to the east.
2. **The Double Dome:** A high bulbous outer dome (73 meters high) raised on an elevated cylindrical drum, with an inner dome creating balanced acoustic proportions for the tomb chamber.
3. **Seismic Minarets:** Four 40-meter minarets at the corners of the plinth, engineered with a deliberate 1.5-degree outward tilt so that in the event of an earthquake, they fall away from the central mausoleum.
4. **Subterranean Well Foundation:** The foundation along the Yamuna relies on an ingenious grid of deep masonry wells cased with timber (mahogany/sal/ebony) that requires continuous moisture from the Yamuna to prevent desiccating and structural collapse.`,
        sculptures: `🎨 **Parchin Kari Inlay & Bas-Reliefs**:

• **Parchin Kari (Pietra Dura):** 28 varieties of precious and semi-precious stones inlaid into marble surfaces:
  - Deep blue **Lapis Lazuli** from Badakhshan (Afghanistan)
  - Golden **Topaz** and **Agate** from Yemen
  - Glowing orange **Carnelian** from Arabia
  - Green **Jade** and **Chrysolite** from China
  - **Turquoise** from Tibet and **Malachite** from Russia.
• **Marble Bas-Reliefs:** Dados of the lower tomb walls feature sculpted flowering plants (tulips, lilies, daffodils) carved in naturalistic high-relief with delicate stem undulations.`,
        inscriptions: `📜 **Calligraphy & Quranic Epigraphy**:

Designed by **Amanat Khan** in flowing **Thuluth script** using inlaid black marble:
• **Optical Scaling:** The letter size increases progressively towards the top of the arches so that to a viewer standing on the ground, the script appears uniform in scale throughout.
• **Quranic Surahs:** 22 Surahs are inscribed, culminating in Surah 89 (Al-Fajr) on the Great Gate (*Darwaza-i Rauza*): *"O soul that art at rest, return to thy Lord, well-pleased with Him and He well-pleased with thee..."*`,
        materials: `🧱 **Petrography & Materials Logistics**:

• **Makrana Marble:** Pristine calcitic white marble quarried in Makrana, Rajasthan, transported 300+ km on ox carts.
• **Red Sandstone:** Quarried from Tantpur and Roopbas near Bharatpur.
• **Mortar:** Special lime mortar blended with gum, sugar, lentils (*urad dal*), and jute fiber for elasticity.`,
        researchNotes: `🔬 **Scientific Studies & Conservation**:

• **Taj Trapezium Zone (TTZ):** 10,400 sq km environmental buffer zone created by Supreme Court mandate to mitigate industrial pollution and acid-rain yellowing.
• **Mud-Pack Treatment:** Regular *Multani Mitti* (Fuller's earth) absorbent clay packs applied to safely extract atmospheric grime from marble pores without abrasion.
• **Hydrological Monitoring:** ASI and Central Pollution Control Board (CPCB) continuously monitor Yamuna riverbed water tables to preserve the timber foundation wells.`,
        travel: `✈️ **Field Visit & Research Guide**:

• **Location:** Dharmapuri, Forest Colony, Agra, Uttar Pradesh (27.1751° N, 78.0421° E).
• **Transit:** Agra Cantt (AGC) via Gatimaan / Vande Bharat Express (90 min from Delhi); Yamuna Expressway.
• **Timings:** 30 minutes before sunrise to 30 minutes before sunset (Closed Fridays for prayers). Night viewing open during 5 full-moon nights monthly.
• **Research Access:** Archaeological Museum inside the Taj complex houses original Mughal drawings and miniature portraits.`
      },
      {
        key: 'hampi',
        name: 'Hampi (Vijayanagara Empire)',
        match: ['hampi', 'vijayanagara', 'vittala', 'stone chariot', 'virupaksha', 'krishnadevaraya', 'tungabhadra', 'pampa'],
        built: '1336–1565 CE',
        startYear: 1336,
        age: 690,
        city: 'Vijayanagara district, Karnataka',
        overview: `🏛️ **Hampi** (Group of Monuments at Hampi) is a UNESCO World Heritage Site in Karnataka representing the ruined capital of the **Vijayanagara Empire** (1336–1646 CE). Spanning over **4,100 hectares (16 sq miles)** in the Tungabhadra River basin, it contains over 1,600 surviving monuments—including temples, royal palaces, civic structures, water aqueducts, and bustling market complexes carved into surreal granite boulder hills.`,
        history: `👑 **Historical Chronicles & Imperial Reign**:

• **Foundation (1336 CE):** Established by brothers **Harihara I** and **Bukka Raya I** of the Sangama Dynasty under the spiritual guidance of sage **Vidyaranya** to unify southern India against northern sultanate incursions.
• **Golden Epoch (1509–1529 CE):** Under the Tuluva Dynasty emperor **Krishnadevaraya**, Vijayanagara reached its geopolitical and artistic zenith, dominating maritime trade from Goa to coastal Odisha. European travelers (**Domingo Paes**, **Fernão Nunes**) described Hampi as larger and wealthier than Rome.
• **Battle of Talikota (1565 CE):** The combined Deccan Sultanates defeated Rama Raya; Hampi was sacked, burned, and looted for six months before being abandoned.`,
        builders: `👑 **Imperial Builders & Royal Sthapathis**:

Commissioned across three dynasties—**Sangama**, **Saluva**, and **Tuluva**—with Emperor Krishnadevaraya personally funding the Vittala temple expansion, the Krishna temple, and the giant Lakshmi Narasimha monolith.`,
        why: `🎯 **Defensive & Religious Significance**:

Strategically nestled in an impenetrable natural fortress of colossal granite hills along the sacred **Tungabhadra River (ancient Pampa Sarovar)**. Hampi revived and defended traditional Dravidian temple culture, literature, and temple banking economies across South India.`,
        ageText: `⏳ **Chronology & Age**:

Founded in **1336 CE**. As of 2026, Hampi represents **690 years** of standing civilizational legacy.`,
        architecture: `🏛️ **Dravidian Granite Architecture & Urban Planning**:

1. **Vittala Temple Complex:** Masterpiece of Vijayanagara Dravidian architecture:
   • **Garuda Stone Chariot (*Ratha*):** An architectural shrine assembled from interlocking granite slabs designed as a processional chariot pulled by two elephants.
   • **Musical Pillars (*SaReGaMa*):** 56 monolithic granite pillars in the *Mahamandapa* that resonate with distinct musical acoustic frequencies (percussion, wind, string tones) when tapped.
2. **Virupaksha Temple:** An ancient active temple dating from the 7th century with a towering 50-meter (164 ft) 9-tiered eastern *Raja Gopuram*.
3. **Royal Center:** Includes the **Lotus Mahal** (syncretic Indo-Islamic secular pavilion), the **Elephant Stables** (11 domed chambers), **Queen's Bath**, and the **Mahanavami Dibba** (massive 3-tiered ceremonial platform).`,
        sculptures: `🎨 **High-Relief Granite Sculptures & Iconography**:

• **Yali Pillars:** Rearing mythical leonine beasts (*Yalis*) with elephant trunks and lion bodies straddled by warrior riders, carved from single granite monoliths.
• **Narrative Panels:** Reliefs depicting episodes from the Ramayana, Mahabharata, Krishna Leela, and scenes of foreign Portuguese horse traders with ruffled collars.
• **Colossal Monoliths:** The 6.7-meter **Ugra Narasimha** (carved from a single boulder in 1528 CE) and the monolithic **Kadalekalu Ganesha** and **Sasivekalu Ganesha**.`,
        inscriptions: `📜 **Epigraphical Records**:

Over **1,000 stone and copper-plate inscriptions** in **Kannada**, **Telugu**, and **Sanskrit** (Nandi Nagari script). Inscriptions document land grants (*Brahmadeya*), gold endowments, diamond trading regulations, and irrigation canal charters.`,
        materials: `🧱 **Materials & Engineering**:

Built almost exclusively from local **grey and pink granite** boulders split using wooden wedges soaked in water, assembled without lime mortar using precision tongue-and-groove joints.`,
        researchNotes: `🔬 **Archaeological & Research Highlights**:

• **Vijayanagara Research Project (VRP):** Decades of international archaeological surveys mapping ancient road systems, defensive walls, and irrigation canal networks.
• **Acoustic Testing:** NDT (Non-Destructive Testing) by sonic resonance confirming harmonic mineral variations in the Vittala musical pillars.`,
        travel: `✈️ **Field Visit & Research Guide**:

• **Location:** Vijayanagara district, Karnataka (15.3350° N, 76.4600° E).
• **Transit:** Hospet Junction Railway Station (13 km); Jindal Vijayanagar Airport, Toranagallu (40 km); Hubli Airport (145 km).
• **Best Time:** November to February (Hampi Utsav held annually in Nov/Jan).
• **Research Hub:** ASI Archaeological Museum at Kamalapur housing detailed scale models and bronze collections.`
      },
      {
        key: 'konark',
        name: 'Konark Sun Temple',
        match: ['konark', 'sun temple', 'narasimhadeva', 'black pagoda', 'chandrabhaga', 'odisha', 'kalinga'],
        built: '1250 CE',
        startYear: 1250,
        age: 776,
        city: 'Puri district, Odisha',
        overview: `☀️ The **Sun Temple of Konark** (ancient *Arka Kshetra*) in Odisha is a 13th-century monument of monumental ambition and a UNESCO World Heritage Site (1984, Criteria i, iii, vi). Built circa **1250 CE** by King **Langula Narasimhadeva I** of the **Eastern Ganga Dynasty**, it was conceived as a titanic stone chariot for the Sun God Surya, complete with 24 carved wheels that function as accurate astronomical sundials.`,
        history: `👑 **Historical Chronicles & Epigraphs**:

• **Royal Patronage:** Commissioned by King Narasimhadeva I (r. 1238–1264 CE) following his military triumphs against the Delhi Sultanate forces in Bengal.
• **Primary Chronicles:** Recorded in the **Madala Panji** (temple chronicle of Puri) and the palm-leaf manuscript *Baya Chakada* (detailing 12 years of accounts, salaries, and daily stone consignments).
• **The Legend of Dharmapada:** When 1,200 sculptors led by chief architect **Bisu Maharana** failed to fix the heavy magnetic crowning finial (*Dadhinauti*), Bisu's 12-year-old son **Dharmapada** solved the mathematical lock, then leapt into the ocean from the pinnacle to save his father's team from the King's death decree.`,
        builders: `👑 **Builders & Master Sthapathis**:

Designed by master architect **Bisu Maharana** and constructed by 1,200 master craftsmen over a 12-year span, financed by 12 years of imperial revenue from the Eastern Ganga Empire.`,
        why: `🎯 **Solar Worship & Royal Legitimacy**:

Built as a cosmic tribute to **Surya** (the giver of life and healer of ailments, linking back to the legend of Samba, son of Krishna, who was cured of leprosy at the Chandrabhaga river mouth) and to project the invincible celestial authority of the Ganga monarch.`,
        ageText: `⏳ **Chronology & Age**:

Consecrated in **1250 CE**. As of 2026, Konark is **776 years old** (nearly 8 centuries of heritage).`,
        architecture: `🏛️ **Kalinga Architectural Style & Sun Chariot Concept**:

1. **Chariot Ground Plan:** The entire temple complex is designed as a chariot with **24 colossal carved wheels** (each 9 ft 9 in in diameter) drawn by **7 galloping horses** representing the days of the week and colors of sunlight.
2. **The 24 Sundial Wheels:** 8 major spokes divide the wheel into 8 three-hour periods (*Prahars*), with beads along the rim measuring time accurately down to minutes based on shadow angles.
3. **Structural Components:**
   • *Jagamohana* (Assembly Hall): The sole standing monumental pyramidal superstructure (39 m high).
   • *Rekha Deul* (Sanctum Tower): The original towering spire reached ~70 meters (230 ft) before collapsing in the 17th century.
   • *Natya Mandapa* (Dancing Hall): An open pillared hall adorned with 128 musical postures.`,
        sculptures: `🎨 **Sculptural Mastery & Chlorite Iconography**:

• **Surya Deities:** Three magnificent green chlorite statues of the Sun God positioned to catch the sun at dawn, midday, and sunset.
• **Alasa Kanyas:** Celestial nymphs playing cymbals, drums, flutes, and veenas along the upper terraces.
• **War Elephants & Gajasimhas:** Massive monolithic sculptures of rearing lions crushing war elephants at the eastern entrance.`,
        inscriptions: `📜 **Inscriptions & Epigraphical Records**:

Sanskrit and Old Odia epigraphs on copper plates (Kendupatna plates of Narasimhadeva II) documenting royal endowments to the temple of Surya at Konark.`,
        materials: `🧱 **Petrography & Heavy Engineering**:

Constructed using three stone types: **Khondalite** (weathered metamorphic rock for main walls), **Chlorite** (fine green stone for sanctum idols and doorframes), and **Laterite** (for sub-foundations). Heavy **iron beams** (up to 35 feet long and 90 kg/ft) were forged without welding to support the lintels.`,
        researchNotes: `🔬 **ASI Conservation & Sand-Filling**:

• **1901 British Stabilization:** Lt. Governor John Woodburn ordered the hollow Jagamohana filled with sand and sealed with stone masonry in 1903 to prevent internal roof collapse.
• **Modern Sand Removal:** ASI has begun using advanced robotic endoscopes and laser scanning to safely evacuate the internal sand and reinforce the inner structure from within.`,
        travel: `✈️ **Field Visit & Research Guide**:

• **Location:** Konark, Puri district, Odisha (19.8876° N, 86.0945° E).
• **Transit:** Biju Patnaik Airport, Bhubaneswar (65 km); Puri Railway Station (35 km) via the scenic Marine Drive.
• **Events:** Annual Konark Dance Festival and International Sand Art Festival every December at Chandrabhaga Beach.`
      },
      {
        key: 'brihadeeswara',
        name: 'Brihadeeswara Temple (Thanjavur)',
        match: ['brihadeeswara', 'thanjavur', 'chola', 'raja raja', 'tanjore', 'peruvudaiyar', 'big temple', 'karuvur'],
        built: '1010 CE',
        startYear: 1010,
        age: 1016,
        city: 'Thanjavur, Tamil Nadu',
        overview: `🛕 The **Brihadeeswara Temple** (*Peruvudaiyar Kovil* / The Big Temple) in Thanjavur, Tamil Nadu, is an apex masterpiece of **Dravidian Chola architecture** and the centerpiece of the UNESCO Great Living Chola Temples (1987). Completed in **1010 CE** by Emperor **Raja Raja Chola I**, this all-granite monumental temple features the tallest stone *Vimana* of its era crowned by an **80-tonne monolithic dome**.`,
        history: `👑 **Imperial Chola History & Consecration**:

• **The 25th Regnal Year:** Consecrated in **1010 CE** (275th day of Raja Raja I's 25th regnal year) to commemorate the imperial triumphs of the Chola navy across Sri Lanka, the Maldives, and Sumatra.
• **Royal Endowments:** Raja Raja I and his sister **Kundavai** endowed hundreds of kilograms of gold, silver, jewel-encrusted crowns, and the revenues of dozens of villages for perpetual maintenance.`,
        builders: `👑 **The Imperial Sthapathi**:

Chief architect **Kunjara Mallan Raja Raja Perunthachan** with assistant architects Nithi Raja Perunthachan and Ilamai Raja Perunthachan, as recorded on the temple's northern wall.`,
        why: `🎯 **Spiritual & Imperial Zenith**:

Built as the supreme dynastic monument of the Chola Empire dedicated to **Lord Shiva as Rajarajeshwaram (Lord of Raja Raja)** and as a cosmic center for classical dance, bronze casting, and Tamil literature.`,
        ageText: `⏳ **Chronology & Age**:

Consecrated in **1010 CE**. As of 2026, it is **1,016 years old** (standing proudly across more than a millennium).`,
        architecture: `🏛️ **Architectural Marvel & Dravidian Engineering**:

1. **The Soaring Vimana:** Unlike later Dravidian temples where Gopurams dominate, here the central tower (*Vimana*) rises to a colossal **66 meters (216 feet)** in 16 diminishing tiers (*talas*).
2. **The 80-Tonne Kumbam:** The crowning capstone (*Shikhara*) is a single monolithic granite block weighing **80 tonnes (80,000 kg)**. Chola engineers built a **6-kilometer-long inclined earthen ramp** from the village of Sarapallam to roll the monolith to the top using elephants and pulleys.
3. **The Monolithic Nandi:** A single-block granite Nandi bull (12 ft high, 19.5 ft long, 25 tonnes) sits in an open pavilion at the entrance.
4. **Interlocking Dry Masonry:** 130,000 tonnes of granite were assembled without cement or mortar, relying on gravity and mortise-tenon joinery.`,
        sculptures: `🎨 **Iconography, Frescoes & Dance Karanas**:

• **The 108 Dance Karanas:** Sculpted along the upper circumambulatory tier of the sanctum, depicting the classical postures of Natya Shastra performed by Lord Shiva.
• **Chola Frescoes:** Discovered beneath 17th-century Nayak paintings, these 11th-century frescoes depict Raja Raja I with sage Karuvur Devar, Nataraja in cosmic dance, and the burning of the three mythical cities (*Tripurantaka*).`,
        inscriptions: `📜 **The Most Detailed Inscriptions in India**:

Etched into the stone plinth are thousands of lines of **Tamil and Grantha epigraphs** recording the exact names, home addresses, and daily grain rations of **400 devadasis (temple dancers)**, 212 musicians, accountants, cooks, and washermen, creating an unparalleled socioeconomic record of medieval India.`,
        materials: `🧱 **Petrography & Logistics**:

Over **130,000 tonnes of hard charnockite granite** transported by river barges and elephant teams from quarries in the Pachaimalai hills over 50 km away to a completely stone-less river delta.`,
        researchNotes: `🔬 **Academic & ASI Conservation Insights**:

• **Shadow Mystery:** Due to its stepped geometry, the apex dome casts a tight shadow that falls within the temple's high plinth during midday, giving rise to the popular folklore that the tower casts no shadow.
• **Fresco Preservation:** Advanced chemical de-layering by ASI to uncover the hidden Chola fresco layer beneath later Nayaka over-paintings.`,
        travel: `✈️ **Field Visit & Research Guide**:

• **Location:** Membalam Road, Thanjavur, Tamil Nadu (10.7828° N, 79.1318° E).
• **Transit:** Tiruchirappalli International Airport (TRZ, 55 km); Thanjavur Junction Railway Station (TJ).
• **Timings:** 6:00 AM – 12:30 PM & 4:00 PM – 8:30 PM daily.
• **Research Centers:** Saraswathi Mahal Library (one of the oldest medieval libraries in Asia) and the Art Gallery at Thanjavur Maratha Palace nearby.`
      },
      {
        key: 'ellora',
        name: 'Ellora Caves (Kailasa Temple)',
        match: ['ellora', 'kailasa', 'cave 16', 'rashtrakuta', 'krishna i', 'verul', 'aurangabad', 'chhatrapati sambhaji nagar'],
        built: '756–773 CE',
        startYear: 756,
        age: 1270,
        city: 'Chhatrapati Sambhaji Nagar (Aurangabad), Maharashtra',
        overview: `🏛️ **Ellora Caves** in Maharashtra is a monumental UNESCO World Heritage Site (1983) comprising 34 rock-cut monasteries and temples spanning Hindu, Buddhist, and Jain faiths. The crowning jewel is **Cave 16 (The Kailasa Temple)**—the largest monolithic rock-cut structure on Earth, carved **top-down** from a single basalt cliff face in the 8th century CE under **Rashtrakuta King Krishna I**.`,
        history: `👑 **Rashtrakuta History & Top-Down Excavation**:

Commissioned between **756 and 773 CE** by King Krishna I (Kannada: ಕೃಷ್ಣ I) to replicate Mount Kailash. Master architect **Kokasa** and generations of sculptors excavated over **200,000 tonnes of basalt rock** by carving vertically downward from the mountain top, eliminating the need for scaffolding.`,
        builders: `👑 **Builders**:

King **Krishna I** of the Rashtrakuta Dynasty, executed by master stonecutter guilds from the Deccan.`,
        why: `🎯 **Spiritual Audacity**:

Conceived to represent the Himalayan abode of Lord Shiva in volcanic basalt, demonstrating the divine omnipotence and cosmological supremacy of the Rashtrakuta Empire.`,
        ageText: `⏳ **Age of Kailasa**:

Begun in **756 CE**. As of 2026, Kailasa is **1,270 years old** (nearly 13 centuries of standing rock marvel).`,
        architecture: `🏛️ **Monolithic Architecture**:

A multi-storeyed monolithic sanctuary twice the area of the Parthenon in Athens. Features an entry Gopuram, Nandi Mandapa, multi-pillared Sabha Mandapa, and soaring Dravidian-style Vimana, flanked by two 15-meter freestanding monolithic victory pillars (*Dhvajastambhas*) and life-sized elephants.`,
        sculptures: `🎨 **Monumental Basalt Reliefs**:

• **Ravana Shaking Mount Kailash:** Celebrated as one of the greatest dynamic sculptures in world art—capturing the frantic muscular strain of Ravana below and the effortless serenity of Shiva stabilizing the mountain with his big toe.
• **Shiva as Tripurantaka:** Dynamic relief of Shiva in a flying war chariot firing an arrow.`,
        inscriptions: `📜 **Inscriptions**:

Kannada and Sanskrit epigraphs on copper plates (Baroda copper plates of Karka II) noting: *"When the gods flying in celestial chariots saw this temple, they were astonished and said: This temple of Shiva is self-created, for such art is impossible in handiwork."*`,
        materials: `🧱 **Materials**:

Monolithic **Deccan Trap Basalt** rock carved in situ with hammer and chisel.`,
        researchNotes: `🔬 **Engineering Research**:

Studies show the builders removed an estimated 3 million cubic feet of rock without dynamite, utilizing thermal expansion (heating rock with fire and fracturing with cold water).`,
        travel: `✈️ **Field Visit**:

• **Location:** Ellora, 30 km from Chhatrapati Sambhaji Nagar (Aurangabad).
• **Timings:** Sunrise to sunset (Closed Tuesdays).`
      },
      {
        key: 'ajanta',
        name: 'Ajanta Caves',
        match: ['ajanta', 'fresco', 'padmapani', 'buddhist cave', 'chaitya', 'vihara', 'vakataka', 'harishena'],
        built: '2nd century BCE – 5th century CE',
        startYear: -200,
        age: 2226,
        city: 'Chhatrapati Sambhaji Nagar, Maharashtra',
        overview: `🎨 The **Ajanta Caves** in Maharashtra (UNESCO World Heritage Site, 1983) consist of **30 rock-cut Buddhist cave sanctuaries** dating from the 2nd century BCE to 480 CE. Nestled in a horseshoe-shaped gorge along the Waghora River, they preserve the world's most exquisite masterworks of classical Indian **mural painting (frescoes)** and Buddhist sculptural art.`,
        history: `👑 **Two Historical Phases**:

• **Phase 1 (Satavahana Era, 2nd–1st c. BCE):** Early Hinayana (Theravada) caves (9, 10, 12, 13, 15A) focusing on symbolic aniconic stupa worship.
• **Phase 2 (Vakataka Era, 5th c. CE):** Mahayana renaissance under **Emperor Harishena** of the Vakataka Dynasty, creating rich viharas and painted masterworks.
• **Rediscovery (1819):** Rediscovered on 28 April 1819 by British officer **John Smith** while tiger hunting.`,
        builders: `👑 **Builders & Monastic Guilds**:

Royal Vakataka ministers like Varahadeva (minister of Harishena) and Upendragupta (king of Rishika), with monk painters and guild lapidaries.`,
        why: `🎯 **Monastic Retreat & Spiritual Education**:

Carved as serene monsoon retreats (*Varshavasa*) for Buddhist monks situated near ancient Deccan trade routes linking the northern plains to western ports.`,
        ageText: `⏳ **Age of Ajanta**:

Oldest caves date from **200 BCE** (~2,226 years old), while the painted Mahayana caves date from **480 CE** (~1,546 years old).`,
        architecture: `🏛️ **Chaityas & Viharas**:

• *Chaitya Grihas* (Worship halls, Caves 19 & 26) with ribbed stone vaults imitating wooden beams and vaulted horseshoe sun-windows (*Chandrashalas*).
• *Viharas* (Monastic residences) with square pillared central halls and monk cells.`,
        sculptures: `🎨 **Mural Art & Iconography**:

• **Bodhisattva Padmapani (Cave 1):** The lotus-bearing Bodhisattva reflecting infinite grace and compassion.
• **Bodhisattva Vajrapani (Cave 1):** Majestic crowned protector.
• **Reclining Buddha (Cave 26):** A colossal 7-meter sculpture depicting Mahaparinirvana.`,
        inscriptions: `📜 **Inscriptions**:

Brahmi and Sanskrit donor inscriptions on cave facades recording royal endowments and verses of Buddhist philosophy.`,
        materials: `🧱 **Pigments & Plaster**:

Painted on rock plaster made of clay, cow dung, and rice husk using natural mineral pigments: **Lapis Lazuli** (blue from Badakhshan), **Red/Yellow Ochres**, **Glauconite** (green), and **Kaolin** (white).`,
        researchNotes: `🔬 **Conservation Insights**:

ASI collaborates with international conservators using micro-climate sensors and low-lux LED illumination to prevent pigment fading and micro-crack expansion.`,
        travel: `✈️ **Field Visit**:

• **Location:** 100 km from Chhatrapati Sambhaji Nagar.
• **Timings:** 9:00 AM – 5:00 PM (Closed Mondays).`
      },
      {
        key: 'rani_ki_vav',
        name: 'Rani ki Vav (The Queen’s Stepwell)',
        match: ['rani ki vav', 'stepwell', 'patan', 'udayamati', 'solanki', 'chaulukya', 'gujarat stepwell'],
        built: '1063 CE',
        startYear: 1063,
        age: 963,
        city: 'Patan, Gujarat',
        overview: `🏛️ **Rani ki Vav** (The Queen’s Stepwell) in Patan, Gujarat, is a supreme masterpiece of subterranean stepwell architecture and a UNESCO World Heritage Site (2014). Built in **1063 CE** by **Queen Udayamati** as a memorial for King Bhima I of the **Chaulukya (Solanki) Dynasty**, it is designed as an **inverted underground temple** descending through 7 stepped tiers of sculpted sanctity.`,
        history: `👑 **History & Rediscovery**:

Commissioned in memory of Bhima I (r. 1022–1064 CE). Silted over by the ancient Saraswati River in the 13th century, it remained buried under sand until the Archaeological Survey of India excavated and restored it in the 1980s.`,
        builders: `👑 **Commissioned By**:

Queen **Udayamati**, daughter of Khengara of Saurashtra, working with master Maru-Gurjara guild architects.`,
        why: `🎯 **Subterranean Temple of Sacred Water**:

Celebrates water (*Jala*) as the divine source of life, offering physical respite to desert travelers while providing spiritual merit through underground darshan.`,
        ageText: `⏳ **Age**:

Constructed in **1063 CE**. As of 2026, it is **963 years old** (nearly 10 centuries).`,
        architecture: `🏛️ **Maru-Gurjara Subterranean Architecture**:

Measures 65 m long, 20 m wide, and 28 m deep. Composed of 7 pillared storeys with stepped corridors leading to a circular draw-well at the western end.`,
        sculptures: `🎨 **Iconography & Over 800 Carvings**:

Contains over **800 major sculpted panels** depicting **Lord Vishnu in his Dashavatara forms** (Varaha, Vamana, Narasimha, Rama, Kalki), celestial Apsaras (*Solah Shringar*), and **Sheshashayi Vishnu** reclining on the multi-headed serpent Ananta at water level.`,
        inscriptions: `📜 **Inscriptions**:

Referenced in Merutunga's 1304 CE chronicle *Prabandha Chintamani*.`,
        materials: `🧱 **Materials**:

Fine Dhrangadhra sandstone carved with razor-sharp micro-detailing.`,
        researchNotes: `🔬 **Conservation**:

Featured on the reverse of the Indian ₹100 currency note.`,
        travel: `✈️ **Travel Guide**:

• **Location:** Patan, Gujarat (125 km north of Ahmedabad).
• **Timings:** 8:00 AM – 6:00 PM daily.`
      },
      {
        key: 'sanchi',
        name: 'Great Stupa at Sanchi',
        match: ['sanchi', 'stupa', 'ashoka', 'mauryan', 'torana', 'vidisha', 'satavahana'],
        built: '3rd century BCE – 1st century BCE',
        startYear: -250,
        age: 2276,
        city: 'Raisen district, Madhya Pradesh',
        overview: `☸️ The **Great Stupa at Sanchi** in Madhya Pradesh is the oldest intact stone structure in India and a UNESCO World Heritage Site (1989). Commissioned by **Emperor Ashoka the Great** in the 3rd century BCE over the sacred bone relics of the Buddha, its four magnificent **Torana gateways** represent the pinnacle of early Buddhist narrative art.`,
        history: `👑 **Mauryan Foundation & Satavahana Gateways**:

• **Ashokan Core (c. 250 BCE):** Ashoka built the original brick stupa crowned by a stone parasol (*Chhatra*).
• **Shunga & Satavahana Expansion (2nd–1st c. BCE):** Enclosed in stone casing and embellished with four 34-foot-high sculpted Toranas by guilds of Vidisha ivory carvers.`,
        builders: `👑 **Builders**:

Emperor **Ashoka**, with later gateways donated by merchant and artisan guilds (*Dantakaras* of Vidisha).`,
        why: `🎯 **Relic Shrine & Dharmachakra**:

Constructed to enshrine corporal relics of Gautama Buddha, symbolizing the parinirvana and universal teachings (*Dhamma*).`,
        ageText: `⏳ **Age**:

Founded circa **250 BCE** (~2,276 years old).`,
        architecture: `🏛️ **Cosmic Stupa Architecture**:

Consists of a hemispherical dome (*Anda*), raised terrace (*Medhi*), square railed balcony (*Harmika*), and 3-tiered umbrella (*Chhatra*) representing the Three Jewels (*Triratna*).`,
        sculptures: `🎨 **Aniconic Buddhist Art on Toranas**:

The Buddha is never depicted in human form; instead represented by symbols: **Footprints (*Paduka*)**, **Empty Throne**, **Bodhi Tree**, and **Wheel (*Dharmachakra*)**, surrounded by Yakshis and Jataka tales.`,
        inscriptions: `📜 **Inscriptions**:

Over 600 **Brahmi inscriptions** in Prakrit recording donations from monks, nuns, and common citizens.`,
        materials: `🧱 **Materials**:

Local grey and purple Vindhyan sandstone.`,
        researchNotes: `🔬 **Conservation**:

Rediscovered in 1818 by General Taylor; meticulously restored by Sir John Marshall between 1912 and 1919.`,
        travel: `✈️ **Travel Guide**:

• **Location:** 46 km northeast of Bhopal (Sanchi Railway Station / BPL Airport).
• **Timings:** Sunrise to sunset.`
      }
    ];

    // ── 1. Resolve Active Entity ──
    let activeEntity = null;

    // Direct match in current query
    for (const ent of entities) {
      if (ent.match.some(m => q.includes(m))) {
        activeEntity = ent;
        AIGuide.lastEntity = ent;
        break;
      }
    }

    // Reverse history lookup
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

    // Default to remembered lastEntity
    if (!activeEntity && AIGuide.lastEntity) {
      activeEntity = AIGuide.lastEntity;
    }

    // Fallback entity if none found
    const defaultEntity = entities[0]; // Khajuraho as default anchor
    const target = activeEntity || defaultEntity;

    // Initialize session topic tracking for entity
    if (!AIGuide.sessionTopics[target.key]) {
      AIGuide.sessionTopics[target.key] = new Set();
    }
    const covered = AIGuide.sessionTopics[target.key];

    // ── 2. Detect Intents in Query ──
    const wantsLostWax = q.includes('lost wax') || q.includes('lost-wax') || q.includes('cire perdue') || q.includes('panchaloha') || (q.includes('bronze') && (q.includes('cast') || q.includes('technique') || q.includes('nataraja') || q.includes('make') || q.includes('made')));
    const wantsApasmara = q.includes('apasmara') || q.includes('muyalaka') || (q.includes('dwarf') && (q.includes('foot') || q.includes('shiva') || q.includes('nataraja') || q.includes('under') || q.includes('symbolism'))) || (q.includes('nataraja') && q.includes('symbolism'));
    const wantsNagaraDravidianCompare = (q.includes('nagara') && q.includes('dravidian')) || ((q.includes('compare') || q.includes('comparison') || q.includes('difference')) && (q.includes('style') || q.includes('architecture') || (q.includes('khajuraho') && q.includes('thanjavur'))));
    const wantsPatronageSocioEconomic = q.includes('patronage') || q.includes('socio-economic') || q.includes('socioeconomic') || q.includes('economic') || (q.includes('funded') && (q.includes('dynast') || q.includes('condition') || q.includes('each') || q.includes('them'))) || q.includes('trade guild') || q.includes('ayyavole') || q.includes('devadana') || q.includes('brahmadeya');
    const wantsTravelersAccounts = q.includes('traveler') || q.includes('traveller') || q.includes('paes') || q.includes('nuniz') || q.includes('abdur razzaq') || q.includes('mackenzie') || q.includes('foreign account') || q.includes('primary source');

    const wantsAll = q.includes('full') || q.includes('all') || q.includes('everything') || q.includes('complete') || (q.includes('proper') && q.includes('information')) || q.includes('deep dive') || q.includes('all the information') || q.includes('research') || q.includes('student') || q.includes('more content') || q.includes('not less') || q.includes('full content');
    const wantsWhen = (q.includes('when') && (q.includes('built') || q.includes('made') || q.includes('constructed') || q.includes('founded') || q.includes('started') || q.includes('date') || q.includes('period') || q.includes('timeline') || q.includes('century') || q.includes('era') || q.includes('year') || q.includes('occupied') || q.includes('phases'))) || q.includes('when was') || q.includes('which year') || q.includes('which century') || q.includes('what time period') || q.includes('kab bana');
    const wantsAge = (q.includes('how old') || q.includes('how long') || q.includes('age') || q.includes('years old') || q.includes('how ancient') || q.includes('since when') || q.includes('since today') || q.includes('how many year') || (q.includes('long') && q.includes('been'))) && !wantsWhen;
    const wantsHistory = (q.includes('history') || q.includes('dynasty') || q.includes('ruler') || q.includes('king') || q.includes('emperor') || q.includes('chronicle')) && !wantsWhen && !wantsPatronageSocioEconomic;
    const wantsBuilder = (q.includes('who built') || q.includes('who made') || q.includes('who create') || q.includes('who construct') || q.includes('builder') || (q.includes('who') && q.includes('built')) || q.includes('king who') || q.includes('ruler who') || q.includes('architect who'));
    const wantsWhy = q.includes('why was') || q.includes('why built') || q.includes('purpose') || q.includes('reason') || q.includes('why did') || q.includes('significance') || q.includes('kyun');
    const wantsArchitecture = (q.includes('architecture') || q.includes('design') || q.includes('engineering') || q.includes('structure') || q.includes('layout') || q.includes('shikhara') || q.includes('vimana')) && !wantsNagaraDravidianCompare;
    const wantsSculptures = (q.includes('sculpture') || q.includes('carving') || q.includes('statue') || q.includes('erotic') || q.includes('mithuna') || q.includes('mural') || q.includes('painting') || (q.includes('art') && !q.includes('architecture'))) && !wantsApasmara && !wantsLostWax;
    const wantsInscriptions = q.includes('inscription') || q.includes('script') || q.includes('epigraph') || q.includes('writing') || q.includes('written') || q.includes('engrav') || q.includes('proof') || q.includes('evidence') || q.includes('source') || q.includes('record');
    const wantsMaterials = q.includes('material') || q.includes('stone') || q.includes('marble') || q.includes('granite') || q.includes('sandstone') || q.includes('made of');
    const wantsTravel = q.includes('travel') || q.includes('visit') || q.includes('ticket') || q.includes('timing') || q.includes('how to reach') || q.includes('how to go') || q.includes('where is');

    const isAffirmation = /^(yes|yeah|yep|sure|ok|okay|yes please|please|tell me|continue|go ahead|more|tell more|next)$/i.test(q) || q === 'yes please' || q === 'yes' || q === 'sure' || q === 'tell me more';

    // ── Dedicated Scholarly Deep-Dive Query Handlers ──
    if (wantsLostWax) {
      return `🔥 **The Chola Lost-Wax Casting Technique (*Cire Perdue* / *Madhuchchishtavidhana*)**:

In the master guilds of the Chola Empire (9th–13th century CE), imperial *Sthapathis* created non-reproducible bronze masterpieces according to the canonical rules of the **Shilpa Shastras**:

1. **Wax Model Sculpting:** Master artisans sculpted a precise model by hand using a pliable blend of pure **beeswax**, tree dammar resin (*kungilium*), and castor oil. Every posture, finger mudra, and sacred jewel was shaped in wax.
2. **Layered Refractory Clay Mold:** The wax sculpture was coated in three progressive layers of specialized clay:
   • *First coat:* Fine alluvial silt (*vandal*) from the Kaveri River basin to capture microscopic ornamentation.
   • *Second & Third coats:* Coarser clay mixed with charred rice husks and river sand for structural rigidity and porosity.
3. **Dewaxing (Lost Wax):** The clay block was fired in a brick kiln. The melting wax flowed out through prepared drainage ducts, leaving a hollow, heat-hardened ceramic matrix.
4. **Panchaloha Pouring:** A molten alloy of **Panchaloha** (five metals: ~85% copper, 10% brass/zinc, 4% lead/tin, with auspicious traces of gold and silver) heated above 1,000°C was poured continuously in a single uninterrupted stream into the hollow mold.
5. **Mold Destruction & Chasing:** Once cooled over several days, the clay casing was broken away—**meaning every single Chola bronze is a completely unique, unrepeatable original**. Craftsmen then spent weeks chiseling, engraving, and polishing the metal to a glowing finish.

Would you like to explore the spiritual symbolism of **Nataraja's cosmic dance** or examine the temple inscriptions of Queen Sembiyan Mahadevi next, ${userName}?`;
    }

    if (wantsApasmara) {
      return `🕉️ **Spiritual & Cosmological Symbolism of Apasmara (Muyalaka) under Nataraja's Foot**:

In the iconography of **Lord Shiva as Nataraja** performing the **Ananda Tandava** (Cosmic Dance of Bliss), the dwarf pinned beneath his right foot is **Apasmara** (known as *Muyalakan* in Tamil tradition):

• **Personification of Ignorance:** Apasmara represents *Avidya* (spiritual ignorance), *Maya* (worldly illusion), egotistical pride, and the forgetfulness of the soul's divine nature. He is sculpted smiling upwards while grasping a cobra.
• **Subdued, Not Slayed:** In Hindu philosophy, ignorance cannot be totally destroyed in the physical realm without collapsing the cosmic balance of free will and spiritual growth. Shiva therefore suppresses Apasmara beneath his right foot (*Tirobhava* / divine concealment) rather than killing him, keeping ego and delusion perpetually restrained.
• **The Five Cosmic Acts (*Pancha Kritya*):**
  1. **Srishti (Creation):** The hourglass drum (*Damaru*) in the upper right hand vibrates the primordial sound of the universe (*Nada-Brahman*).
  2. **Sthiti (Preservation):** The lower right hand is raised in the **Abhaya Mudra**, granting divine protection and refuge.
  3. **Samhara (Dissolution):** Blazing fire (*Agni*) in the upper left palm dissolves decayed forms and worldly illusions.
  4. **Tirobhava (Veiling / Restraint):** The right foot pinned on Apasmara holds spiritual blindness in check.
  5. **Anugraha (Grace / Liberation):** The lifted left foot pointing gracefully downward indicates ultimate salvation and *Moksha*.
• **The Ring of Fire (*Tiruvasi*):** The surrounding circular aureole represents the continuous, cyclical cosmos of time, energy, and cosmic space.

Would you like to know how the Chola sthapathis translated this cosmic philosophy into cast bronze and stone reliefs, ${userName}?`;
    }

    if (wantsNagaraDravidianCompare) {
      return `🏛️ **Comparative Architectural Analysis: Nagara (North Indian) vs. Dravidian (South Indian) Temple Architecture**:

| Architectural Parameter | **Nagara Style (e.g., Khajuraho, Modhera, Puri)** | **Dravidian Style (e.g., Thanjavur, Hampi, Madurai)** |
| :--- | :--- | :--- |
| **Main Tower (Superstructure)** | **Shikhara**: Curvilinear, beehive-shaped tower tapering inward gracefully. | **Vimana**: Stepped pyramidal tower rising in diminishing horizontal storeys (*talas*). |
| **Tower Finial (Apex)** | Ribbed circular stone disc (**Amalaka**) surmounted by a water-pot (**Kalasha**). | Rounded, domical or octagonal monolithic capstone (**Shikhara** / *Stupika*). |
| **Spire Clustering** | Clustered with dozens of miniature subsidiary spires (**Urushringas**) evoking Mount Meru. | Uniform stepped profile; clean geometrical elevation without subsidiary spire clusters. |
| **Gateways (*Gopurams*)** | Modest entrance porticos (*Ardhamandapa*); no giant perimeter gateways. | Soaring, multi-tiered monumental entrance towers (**Gopurams**) dominating the compound perimeter. |
| **Plinth & Perimeter** | Built on an elevated high stone platform (**Jagati**); usually lacks high boundary walls. | Enclosed within high concentric fortified enclosure walls (**Prakaras**) with pillared cloistered walkways. |
| **Sacred Water Tanks** | Water reservoirs are usually external or detached from the main plinth. | Dedicated stepped temple tank (**Kalyani** / *Pushkarani*) integrated directly within the sacred precinct. |
| **Sanctum Layout** | Unified axial continuum from porch to sanctum under a continuous stepped roofline. | Expansive detached pavilions (*Nandi Mandapa*, *Mahamandapa*, *1,000-Pillar Kalyana Mandapas*). |

Would you like to explore the intermediate hybrid **Vesara style** (Chalukyas/Hoysalas) or delve into the socio-economic funding of these temples, ${userName}?`;
    }

    if (wantsPatronageSocioEconomic) {
      return `💰 **Dynastic Patronages & Socio-Economic Foundations of Khajuraho & Thanjavur**:

The construction of these monumental wonders was powered by sophisticated medieval political, agrarian, and commercial institutions:

1. **Brihadeeswara Temple (Imperial Cholas / Thanjavur):**
   • **Agrarian Wealth of Kaveri Delta:** The Cholas built an extraordinary network of irrigation canals, stone anicuts (such as the *Kallanai*), and sluices across the fertile Kaveri Delta, generating vast agricultural yields.
   • **Imperial Conquest & Tribute:** Emperor Raja Raja Chola I redirected immense royal war treasuries and tributes from Sri Lanka, the Cheras, and Pandyas directly into the temple treasury.
   • **Maritime Trade Guilds:** Powerful autonomous merchant corporations like the **Ayyavole 500** (*Ainurruvar*) and **Manigramam** conducted lucrative trade across Southeast Asia (Srivijaya) and Song Dynasty China, channeling customs duties and endowments into temple foundations.
   • **Temple as Economic Engine:** The temple operated as the kingdom's central bank—lending gold at fixed interest, employing over **600 specialized staff** (musicians, dancers, accountants, metal-smiths), and managing extensive tax-free *Devadana* land grants.

2. **Khajuraho Temples (Chandela Rajputs / Bundelkhand):**
   • **Sovereign Legitimization:** As former feudatories of the Gurjara-Pratiharas, Chandela monarchs (Yashovarman, Dhanga, Vidyadhara) built monumental temples to declare royal sovereignty (*Chhatrapati*) and cosmological legitimacy over Central India.
   • **Trade Corridors:** Khajuraho was strategically situated along trade routes linking the Gangetic plains to the Malwa plateau and the Deccan, collecting transit tolls.
   • **Agrarian & Mineral Charters:** Financed through royal *Brahmadeya* and *Shasana* copper-plate endowments, timber concessions, and agricultural harvests along the Ken and Betwa river basins.

Would you like to examine the specific copper-plate land charters or the epigraphical payrolls discovered at these sites?`;
    }

    if (wantsTravelersAccounts) {
      return `📜 **Primary Foreign Accounts & Chronicles of Hampi (Vijayanagara)**:

Hampi's imperial scale and wealth were chronicled by prominent international travelers:

• **Abdur Razzaq (Persian Envoy, 1443 CE):** Sent by Timurid ruler Shah Rukh, he recorded: *"The city of Bijanagar is such that the eye has not seen nor the ear heard of any place to equal it upon the whole earth. It is so built that it has seven concentric rings of fortified walls."*
• **Domingo Paes (Portuguese Merchant, 1520 CE):** Described Hampi under Krishnadevaraya as *"as large as Rome, very beautiful to the sight... the city is full of people and the king has an incredible multitude of troops."* He was astonished by merchants openly measuring out rubies, diamonds, and pearls in the bazaar streets.
• **Fernão Nuniz (Portuguese Chronicler, 1535 CE):** Detailed the imperial administration, military levies, royal diamond mines, and the grand nine-day Mahanavami festival celebrations.
• **Colin Mackenzie (1800 CE):** British surveyor and antiquarian who created the first modern archaeological map and collected historic local manuscripts (*Kaifiyats*) that inaugurated modern archaeological fieldwork.

Would you like to explore the ASI archaeological excavations or the epigraphical records found across the Tungabhadra basin?`;
    }

    // ── 3. Comprehensive Master Research Dossier if user asks for "full / all / research / deep dive" ──
    if (wantsAll && !isAffirmation) {
      const fullDossier = [
        target.overview,
        target.history,
        target.why,
        target.architecture,
        target.sculptures,
        target.inscriptions,
        target.materials,
        target.researchNotes,
        target.travel
      ].filter(Boolean);

      covered.add('history');
      covered.add('architecture');
      covered.add('sculptures');
      covered.add('inscriptions');
      covered.add('materials');
      covered.add('researchNotes');
      covered.add('travel');

      return `🎓 **Comprehensive Academic & Research Dossier: ${target.name}**\n\n` + fullDossier.join('\n\n') + `\n\nWould you like further academic analysis on its **epigraphical translations**, **structural conservation**, or **comparative dynastic history**, ${userName}?`;
    }

    // ── 4. Multi-Topic Composition ──
    const sections = [];

    if (wantsWhen) {
      sections.push(`⏳ **Construction Timeline & Historical Era of ${target.name}**:\n\n• **Built:** **${target.built}**\n• **Historical Period:** Consecrated / founded around **${target.startYear > 0 ? target.startYear + ' CE' : Math.abs(target.startYear) + ' BCE'}** (~**${target.age} years old**).\n• **Era Context:** Developed across the flourishing epoch of its ruling dynasty in ${target.city}.`);
      covered.add('when');
    }

    if (wantsAge && !wantsWhen && target.ageText) {
      sections.push(target.ageText);
      covered.add('age');
    }

    if (wantsWhy && target.why) {
      sections.push(target.why);
      covered.add('why');
    }

    if (wantsBuilder && target.builders) {
      sections.push(target.builders);
      covered.add('builders');
    }

    if (wantsHistory && !wantsBuilder && !wantsWhen && target.history) {
      sections.push(target.history);
      covered.add('history');
    }

    if (wantsArchitecture && target.architecture) {
      sections.push(target.architecture);
      covered.add('architecture');
    }

    if (wantsSculptures && target.sculptures) {
      sections.push(target.sculptures);
      covered.add('sculptures');
    }

    if (wantsInscriptions && target.inscriptions) {
      sections.push(target.inscriptions);
      covered.add('inscriptions');
    }

    if (wantsMaterials && target.materials) {
      sections.push(target.materials);
      covered.add('materials');
    }

    if (wantsTravel && target.travel) {
      sections.push(target.travel);
      covered.add('travel');
    }

    // If specific sections matched, deliver them with a natural follow-up prompt
    if (sections.length > 0) {
      let reply = sections.join('\n\n');
      // Add natural follow-up suggesting un-covered topics
      const suggestions = [];
      if (!covered.has('architecture')) suggestions.push('architecture');
      if (!covered.has('sculptures')) suggestions.push('sculptures');
      if (!covered.has('inscriptions')) suggestions.push('inscriptions');
      if (!covered.has('travel')) suggestions.push('travel guide');

      if (suggestions.length > 0) {
        reply += `\n\nWould you like to explore its **${suggestions.slice(0, 2).join('** or **')}** next, ${userName}?`;
      }
      return reply;
    }

    // ── 5. Affirmative Follow-up Continuation ("yes please", "sure", "tell me") ──
    if (isAffirmation) {
      // Find the next best topic to share
      if (!covered.has('architecture') && target.architecture) {
        covered.add('architecture');
        return `${target.architecture}\n\nShall I share visiting tips and travel details for ${target.name}?`;
      }
      if (!covered.has('sculptures') && target.sculptures) {
        covered.add('sculptures');
        return `${target.sculptures}\n\nWould you like to know about its inscriptions or travel guide?`;
      }
      if (!covered.has('history') && target.history) {
        covered.add('history');
        return `${target.history}\n\nWould you like to explore its architecture or sculptures next?`;
      }
      if (!covered.has('inscriptions') && target.inscriptions) {
        covered.add('inscriptions');
        return `${target.inscriptions}\n\nWould you like travel and ticket details for visiting?`;
      }
      if (!covered.has('travel') && target.travel) {
        covered.add('travel');
        return `${target.travel}\n\nWhat other heritage site would you like to explore next, ${userName}?`;
      }
    }

    // ── 6. Direct Entity Mention Overview ──
    if (activeEntity && target.overview) {
      covered.add('overview');
      return `${target.overview}\n\nWould you like to explore its **history**, **architecture**, **sculptures**, or **travel guide**?`;
    }

    // ── 6. Greetings & Personalization ──
    if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
      return `🙏 **Namaste, ${userName}!** Welcome to Virasat AI — your personal guide to India's 5,000 years of heritage.\n\nAsk me about any **monument**, **dynasty**, **festival**, or **ancient art form** — or continue asking about **${target.name}**!\n\nWhat would you like to discover today?`;
    }

    // ── 7. Dynamic Smart Context Response ──
    return `🏛️ Regarding **${target.name}** in ${target.city}:\n\n${target.overview || target.details}\n\nWould you like to know about its **history**, **architecture**, **sculptures**, **inscriptions**, or **travel tips**?`;
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

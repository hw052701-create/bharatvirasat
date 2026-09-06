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

    // ── Comprehensive Heritage Entity Knowledge Base ──
    const entities = [
      {
        key: 'khajuraho',
        name: 'Khajuraho Temples',
        match: ['khajuraho', 'chandela', 'kandariya', 'chhatarpur', 'lakshmana temple', 'visvanatha'],
        built: '950–1050 CE',
        startYear: 950,
        age: 1076,
        city: 'Chhatarpur district, Madhya Pradesh',
        overview: `🛕 The **Khajuraho Temples** in Madhya Pradesh are among India's most sublime architectural treasures. Built between **950 and 1050 CE** by the **Chandela Rajput dynasty**, these Nagara-style sandstone temples celebrate the four *Purusharthas* — Dharma, Artha, Kama, and Moksha. The crown jewel is the towering **Kandariya Mahadeva Temple**, dedicated to Lord Shiva, sculpted with 84 mini-spires mimicking sacred Mount Kailash.`,
        history: `👑 **Historical Chronicles of Khajuraho**:\n\nThe temples were built during the golden age of the **Chandela Rajput Dynasty** (10th–11th centuries CE), who ruled the Jejakabhukti region (Bundelkhand). Rulers like **King Harshadeva**, **Yashovarmadeva** (who built Lakshmana Temple in 954 CE), **King Dhanga** (Visvanatha Temple in 1002 CE), and **King Vidyadhara** (Kandariya Mahadeva in 1030 CE) patronized vast guilds of *Sutradharas* (master sculptors).\n\nOut of an original **85 temples** spread over 20 sq km, **25 magnificent temples survive today**, preserved under UNESCO World Heritage protection.`,
        builders: `👑 **Builders of Khajuraho**:\n\nCommissioned by the **Chandela Rajput Dynasty** between **950 and 1050 CE** at their sacred cultural capital in Bundelkhand. Key royal visionaries included **King Yashovarman**, **King Dhanga**, and **King Vidyadhara**, with master architect **Chhichha** leading guilds of thousands of stonemasons.`,
        why: `🎯 **Why Khajuraho was built**:\n\nThe Chandela kings built these temples as monumental spiritual offerings celebrating the cosmic harmony of life. Unlike conventional secluded shrines, Khajuraho integrated worldly celebration, royal rituals, classical arts, music, and spiritual liberation into a unified architectural universe.`,
        ageText: `⏳ **Age of Khajuraho Temples**:\n\nConstruction began in **950 CE** (completed ~1050 CE). From 950 CE to the present year (2026), the temples are approximately **1,076 years old** — spanning over **10 centuries** of standing history!`,
        architecture: `🏛️ **Architecture & Layout of Khajuraho**:\n\nBuilt in the classical **Nagara (North Indian)** architectural style on an elevated stone terrace (*Jagati*). Each temple follows a harmonious linear progression: the *Ardhamandapa* (entrance porch), *Mandapa* (pillared hall), *Mahamandapa* (great hall with ambulatory pathway), and the *Garbhagriha* (inner sanctum) under the soaring *Shikhara*.\n\nThe shikhara features a rhythmic cluster of miniature spires (*Urushringas*) that ascend organically like the peaks of the Himalayas, symbolizing the cosmic mountain **Mount Meru**.`,
        sculptures: `🎨 **Sculptures & Art of Khajuraho**:\n\nContrary to popular misconceptions, only about **10% of Khajuraho's carvings depict erotic themes (*Mithuna*)**. The remaining 90% vividly depict everyday medieval life — celestial dancers (*Apsaras* applying kajal, writing letters, or plucking thorns from their feet), royal musicians, marching armies, celestial deities, and animals.\n\nEvery carving reflects extraordinary anatomical grace and fluid movement chiseled with surgical precision from golden-buff sandstone.`,
        inscriptions: `📜 **Inscriptions at Khajuraho**:\n\nWritten in classical **Sanskrit** using the medieval northern **Kutila (early Nagari)** script. The stone plinth inscriptions on the **Lakshmana Temple** (dated 954 CE) and **Visvanatha Temple** (dated 1002 CE) record Chandela royal genealogy, military triumphs, and dedicate the temples to Vishnu and Shiva.`,
        materials: `🧱 **Materials & Construction**:\n\nCrafted from fine-grained golden **sandstone** quarried from the riverbeds of Panna, set upon massive granite foundations without mortar using mortise-and-tenon interlocking joints.`,
        travel: `✈️ **Travel Guide for Khajuraho**:\n\n• **Location:** Chhatarpur district, Madhya Pradesh.\n• **How to Reach:** Khajuraho Airport (HJR) connects directly to Delhi and Varanasi; Khajuraho Railway Station connects across India.\n• **Best Time:** October to March (mild, pleasant weather). Don't miss the famous **Khajuraho Dance Festival** held every February!\n• **Timings:** Open daily from sunrise to sunset. Guided evening Sound & Light Shows are held in English and Hindi.`
      },
      {
        key: 'red_fort',
        name: 'Red Fort (Lal Qila)',
        match: ['red fort', 'lal qila', 'redfort', 'lal kila', 'delhi fort'],
        built: '1638–1648 CE',
        startYear: 1638,
        age: 388,
        city: 'Old Delhi (Shahjahanabad)',
        overview: `🏰 The **Red Fort (Lal Qila)** in Old Delhi is one of India's most iconic historic fortresses. Commissioned between **1638 and 1648 CE** by Mughal Emperor **Shah Jahan** when shifting the imperial capital from Agra to Shahjahanabad, its massive red sandstone bastions have guarded Delhi for nearly four centuries.`,
        history: `👑 **History of the Red Fort**:\n\nCommissioned by Mughal Emperor **Shah Jahan** in **1638 CE** when he decided to move the Mughal capital from Agra to his new planned city, **Shahjahanabad** (Old Delhi). Chief architects **Ustad Ahmad** and **Ustad Hamid** supervised 10 years of construction along the Yamuna riverbank.\n\nThe fort served as the imperial throne of Mughal emperors until 1857. On **15 August 1947**, Prime Minister Jawaharlal Nehru hoisted independent India's tricolor from its ramparts, establishing an annual national tradition.`,
        builders: `👑 **Builders of the Red Fort**:\n\nCommissioned by Mughal Emperor **Shah Jahan** in **1638 CE** with court architects **Ustad Ahmad** and **Ustad Hamid**, built by thousands of stonemasons and artisans over a 10-year span.`,
        why: `🎯 **Why the Red Fort was built**:\n\nShah Jahan needed a larger, grander, and more strategically fortified administrative capital. Agra had become overcrowded and difficult to expand, while Delhi offered direct access to northern trade routes and the sacred Yamuna river for water supply and natural defense.`,
        ageText: `⏳ **Age of the Red Fort**:\n\nConstruction began in **1638 CE** and was completed in **1648 CE**. As of 2026, the Red Fort is approximately **388 years old** (nearly 4 centuries).`,
        architecture: `🏛️ **Architecture & Layout of the Red Fort**:\n\nAn octagonal citadel enclosed by 2 kilometers of red sandstone battlements. Key royal complexes include the *Chhatta Chowk* (vaulted bazaar), *Diwan-i-Aam* (Hall of Public Audience with marble throne canopy), *Diwan-i-Khas* (Hall of Private Audience), *Rang Mahal*, and the stream of paradise canal (*Nahr-i-Bihisht*).`,
        sculptures: `🎨 **Sculptures, Palatial Inlay & Artwork of Red Fort**:\n\nWhile Islamic Mughal traditions avoid figurative deity idols, the Red Fort features some of the finest decorative art in world architecture:\n\n• **Pietra Dura (*Parchin Kari*) Inlay:** The royal chambers in the *Diwan-i-Khas* and *Khas Mahal* are lined with pure white Makrana marble inlaid with thousands of semi-precious stones (onyx, jasper, carnelian, lapis lazuli) forming intricate floral scrollwork.\n• **The Orpheus Panel:** Behind the Emperor's marble Baldachin throne in the *Diwan-i-Aam* sits a celebrated Florentine pietra dura panel depicting the Greek mythological musician **Orpheus calming beasts with his lute**.\n• **Carved Marble Screens (*Jalis*):** The *Khas Mahal* and *Hammam* feature geometrically perforated screens carved with razor-sharp symmetry that diffuse harsh sunlight into soft ambient illumination.\n• **Lotus Fountains & Canals:** The *Nahr-i-Bihisht* (Stream of Paradise) channels water through scalloped marble lotus fountains (*Katora*) carved in low relief, cooling the royal chambers naturally.\n• **Ceiling Splendour:** The *Rang Mahal* (Palace of Colors) was famed for its gilded woodwork, mirror mosaic (*Aina-Kari*), and painted floral ceilings.`,
        inscriptions: `📜 **Inscriptions at Red Fort**:\n\nThe famous Persian couplet in gold calligraphy by Amir Khusrau overlooks the Diwan-i-Khas archway: *"Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast"* — **If there is a paradise on earth, it is this, it is this, it is this.**`,
        materials: `🧱 **Materials of the Red Fort**:\n\nMassive exterior ramparts constructed from Rajasthan **red sandstone**, with internal royal chambers paved in pure white **Makrana marble** inlaid with semi-precious stones.`,
        travel: `✈️ **Travel Details for Red Fort**:\n\n• **Location:** Netaji Subhash Marg, Chandni Chowk, Old Delhi.\n• **Nearest Metro:** Lal Qila Metro Station (Violet Line) or Chandni Chowk (Yellow Line).\n• **Timings:** 9:30 AM – 4:30 PM (Closed on Mondays).\n• **Explorer Tip:** Combine your visit with Chandni Chowk street food and the historic Jama Masjid next door.`
      },
      {
        key: 'taj',
        name: 'Taj Mahal',
        match: ['taj mahal', 'taj', 'mumtaz', 'shah jahan', 'agra'],
        built: '1631–1653 CE',
        startYear: 1631,
        age: 395,
        city: 'Agra, Uttar Pradesh',
        overview: `🏛️ The **Taj Mahal** in Agra is a globally renowned masterpiece of Indo-Islamic architecture. Commissioned in **1631 CE** by Emperor **Shah Jahan** as a mausoleum for his beloved wife **Mumtaz Mahal**, it is crafted from pure white Makrana marble and inlaid with 28 varieties of semi-precious gems.`,
        history: `👑 **History of the Taj Mahal**:\n\nFollowing Empress **Mumtaz Mahal's** death in Burhanpur in 1631, Emperor **Shah Jahan** summoned over **20,000 master artisans** from India, Persia, and the Ottoman Empire. Led by chief architect **Ustad Ahmad Lahori**, construction took 22 years (1631–1653 CE) at an estimated cost of 32 million rupees of that era.`,
        builders: `👑 **Builders of Taj Mahal**:\n\nCommissioned by Mughal Emperor **Shah Jahan** for Empress **Mumtaz Mahal**, designed by master architect **Ustad Ahmad Lahori** with master calligrapher **Amanat Khan**.`,
        why: `🎯 **Why the Taj Mahal was built**:\n\nBuilt as an eternal monument of boundless love and a terrestrial recreation of the gardens of Paradise (*Jannat*) for Empress Mumtaz Mahal.`,
        ageText: `⏳ **Age of the Taj Mahal**:\n\nCommissioned in **1631 CE**. As of 2026, the Taj Mahal is **395 years old** (nearly four centuries).`,
        architecture: `🏛️ **Architecture of the Taj Mahal**:\n\nA triumph of bilateral symmetry. Features a 73-meter central double dome, four 40-meter minarets tilted slightly outward for seismic protection, and a subterranean foundation of moisture-retaining ebony wood wells along the Yamuna.`,
        sculptures: `🎨 **Art & Inlay of Taj Mahal**:\n\nAdorned with delicate *Parchin Kari* (*pietra dura*) inlay using lapis lazuli from Afghanistan, carnelian from Arabia, jade from China, and jasper from Punjab.`,
        inscriptions: `📜 **Calligraphy Inscriptions**:\n\n22 Quranic Surahs inscribed in elegant Thuluth script in black jasper by Amanat Khan, with letters optically enlarged toward the top so they appear uniform from the ground.`,
        materials: `🧱 **Materials Used**:\n\nPristine translucent white **Makrana marble** from Rajasthan, red sandstone for auxiliary mosque and guest house, and 28 types of precious stones.`,
        travel: `✈️ **Travel Guide for Taj Mahal**:\n\n• **Location:** Agra, Uttar Pradesh (2 hours from Delhi via Yamuna Expressway or Vande Bharat Express).\n• **Timings:** 30 minutes before sunrise to 30 minutes before sunset (Closed Fridays).\n• **Best Time:** Sunrise for soft pink hues, or night viewing during the 5 nights of the full moon.`
      },
      {
        key: 'hampi',
        name: 'Hampi (Vijayanagara Empire)',
        match: ['hampi', 'vijayanagara', 'vittala', 'stone chariot', 'virupaksha', 'krishnadevaraya', 'tungabhadra'],
        built: '1336 CE (14th century)',
        startYear: 1336,
        age: 690,
        city: 'Vijayanagara district, Karnataka',
        overview: `🏛️ **Hampi** in Karnataka was the capital of the mighty **Vijayanagara Empire** (14th–16th centuries). It features over 1,600 surviving monuments, including the iconic Stone Chariot, musical granite pillars, and royal palaces set against surreal boulder hills along the Tungabhadra River.`,
        history: `👑 **History of Hampi**:\n\nFounded in **1336 CE** by warrior brothers **Harihara I** and **Bukka Raya I**. Under **Emperor Krishnadevaraya** (1509–1529 CE), Hampi became one of the world's richest cities, trading diamonds and silks with Persia and Portugal.`,
        builders: `👑 **Builders of Hampi**:\n\nBuilt and expanded by the Sangama, Saluva, and Tuluva dynasties of the **Vijayanagara Empire**, especially Emperor Krishnadevaraya.`,
        why: `🎯 **Why Hampi was built**:\n\nEstablished as a fortified capital to defend South India's culture and heritage, nestled among impenetrable granite boulder hills and the sacred Tungabhadra River.`,
        ageText: `⏳ **Age of Hampi**:\n\nFounded in **1336 CE**. As of 2026, Hampi's heritage spans **690 years** (nearly 7 centuries).`,
        architecture: `🏛️ **Architecture of Hampi**:\n\nDravidian granite architecture featuring colossal multi-tiered Gopurams, open *Mahamandapas*, the monolithic **Garuda Stone Chariot**, and 56 musical resonant pillars.`,
        sculptures: `🎨 **Sculptures & Reliefs**:\n\nVivid high-relief carvings of Ramayana and Mahabharata episodes, royal processions, and mythical Yali beasts carved directly into solid granite.`,
        inscriptions: `📜 **Inscriptions at Hampi**:\n\nKannada, Sanskrit, and Telugu inscriptions on stone tablets and temple plinths detailing royal endowments, market trade, and temple rituals.`,
        materials: `🧱 **Materials**:\n\nLocal hard grey and pink granite boulders interlocked with precision masonry.`,
        travel: `✈️ **Travel Guide for Hampi**:\n\n• **Location:** Vijayanagara district, Karnataka.\n• **Nearest Hub:** Hospet Railway Station (13 km) or Jindal Vijayanagar Airport (Toranagallu, 40 km).\n• **Best Time:** November to February. Rent a bicycle or e-rickshaw to explore the vast 4,100-hectare site.`
      },
      {
        key: 'konark',
        name: 'Konark Sun Temple',
        match: ['konark', 'sun temple', 'narasimhadeva', 'black pagoda', 'chandrabhaga'],
        built: '1250 CE',
        startYear: 1250,
        age: 776,
        city: 'Puri district, Odisha',
        overview: `☀️ The **Konark Sun Temple** in Odisha, built in **1250 CE** by King **Langula Narasimhadeva I**, is designed as a colossal celestial chariot for the **Sun God Surya** — complete with 24 carved stone wheels that function as precise astronomical sundials.`,
        history: `👑 **History of Konark**:\n\nBuilt in the 13th century by the Eastern Ganga Dynasty. 1,200 master sculptors worked for 12 years under chief architect **Bisu Maharana** and his prodigy son **Dharmapada**, who solved the engineering lock of the pinnacle dome.`,
        builders: `👑 **Builders of Konark**:\n\nKing **Langula Narasimhadeva I** of the Eastern Ganga Dynasty in 1250 CE.`,
        why: `🎯 **Why Konark was built**:\n\nCommissioned to celebrate military victories against medieval invaders and to invoke the health and cosmic power of Surya the Sun God.`,
        ageText: `⏳ **Age of Konark**:\n\nBuilt in **1250 CE**. As of 2026, Konark is **776 years old** (nearly 8 centuries).`,
        architecture: `🏛️ **Architecture of Konark**:\n\nKalinga-style architecture designed as a 24-wheeled chariot with 7 galloping horses, aligned precisely to catch the first rays of the morning dawn.`,
        sculptures: `🎨 **Sculptures of Konark**:\n\nIntricate chlorite carvings of dancers (*Natya Mandapa*), musicians, celestial nymphs (*Alasa Kanyas*), and cosmic deities.`,
        inscriptions: `📜 **Inscriptions & Chronicles**:\n\nOdia palm-leaf *Madala Panji* chronicles and temple stone epigraphs recording construction logistics and solar rituals.`,
        materials: `🧱 **Materials**:\n\nGreen Chlorite for deities, Khondalite for walls, and Laterite for base plinths.`,
        travel: `✈️ **Travel Guide for Konark**:\n\n• **Location:** 35 km from Puri, 65 km from Bhubaneswar (BBI Airport).\n• **Best Time:** September to March. Enjoy the annual Konark Dance Festival in December along the Marine Drive.`
      },
      {
        key: 'brihadeeswara',
        name: 'Brihadeeswara Temple',
        match: ['brihadeeswara', 'thanjavur', 'chola', 'raja raja', 'tanjore', 'peruvudaiyar'],
        built: '1010 CE',
        startYear: 1010,
        age: 1016,
        city: 'Thanjavur, Tamil Nadu',
        overview: `🛕 The **Brihadeeswara Temple** in Thanjavur, completed in **1010 CE** by Chola Emperor **Raja Raja Chola I**, is a monumental Dravidian granite sanctuary crowned by an 80-tonne monolithic dome raised without mortar.`,
        history: `👑 **History of Brihadeeswara**:\n\nBuilt to celebrate 25 victorious years of Raja Raja Chola I's naval empire across South India, Sri Lanka, and Southeast Asia.`,
        builders: `👑 **Builders**:\n\nEmperor **Raja Raja Chola I** and master royal architect **Kunjara Mallan Raja Raja Perunthachan**.`,
        why: `🎯 **Why it was built**:\n\nBuilt as the supreme cultural and spiritual citadel of the Chola Empire dedicated to Lord Shiva as Nataraja.`,
        ageText: `⏳ **Age of Brihadeeswara**:\n\nConsecrated in **1010 CE**. As of 2026, it is **1,016 years old** (over 10 centuries).`,
        architecture: `🏛️ **Architecture**:\n\nPure Dravidian granite architecture with a 66-meter *Vimana* tower, huge *Nandi* bull monolith, and expansive pillared cloister halls.`,
        sculptures: `🎨 **Sculptures & Chola Frescoes**:\n\nRich Chola frescoes depicting Lord Shiva and 108 classical *Karanas* (dance postures) of Bharatnatyam.`,
        inscriptions: `📜 **Inscriptions**:\n\nExtensive Tamil and Grantha stone inscriptions recording names of all 400+ temple dancers, musicians, and village endowments.`,
        materials: `🧱 **Materials**:\n\n130,000 tonnes of hard granite transported over 50 km and assembled without mortar.`,
        travel: `✈️ **Travel Guide for Brihadeeswara**:\n\n• **Location:** Thanjavur, Tamil Nadu (Nearest airport: Tiruchirappalli TRZ, 55 km).\n• **Best Time:** October to March.`
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
    const wantsAll = q.includes('full') || q.includes('all') || q.includes('everything') || q.includes('complete') || (q.includes('proper') && q.includes('information')) || q.includes('deep dive') || q.includes('all the information');
    const wantsAge = q.includes('how old') || q.includes('how long') || q.includes('age') || q.includes('years old') || q.includes('how ancient') || q.includes('since when') || q.includes('since today') || q.includes('how many year') || (q.includes('long') && q.includes('been'));
    const wantsHistory = q.includes('history') || q.includes('dynasty') || q.includes('ruler') || q.includes('king') || q.includes('emperor') || q.includes('chronicle');
    const wantsBuilder = q.includes('who built') || q.includes('who made') || q.includes('who create') || q.includes('who construct') || q.includes('builder') || (q.includes('who') && q.includes('built')) || (q.includes('when') && q.includes('built'));
    const wantsWhy = q.includes('why was') || q.includes('why built') || q.includes('purpose') || q.includes('reason') || q.includes('why did') || q.includes('significance') || q.includes('kyun');
    const wantsArchitecture = q.includes('architecture') || q.includes('design') || q.includes('engineering') || q.includes('structure') || q.includes('layout') || q.includes('shikhara') || q.includes('vimana');
    const wantsSculptures = q.includes('sculpture') || q.includes('carving') || q.includes('statue') || q.includes('erotic') || q.includes('mithuna') || q.includes('mural') || q.includes('painting') || (q.includes('art') && !q.includes('architecture')) || (q.includes('detail') && covered.has('sculptures'));
    const wantsInscriptions = q.includes('inscription') || q.includes('script') || q.includes('epigraph') || q.includes('writing') || q.includes('written') || q.includes('engrav');
    const wantsMaterials = q.includes('material') || q.includes('stone') || q.includes('marble') || q.includes('granite') || q.includes('sandstone') || q.includes('made of');
    const wantsTravel = q.includes('travel') || q.includes('visit') || q.includes('ticket') || q.includes('timing') || q.includes('how to reach') || q.includes('how to go') || q.includes('where is');

    const isAffirmation = /^(yes|yeah|yep|sure|ok|okay|yes please|please|tell me|continue|go ahead|more|tell more|next)$/i.test(q) || q === 'yes please' || q === 'yes' || q === 'sure' || q === 'tell me more';

    // ── 3. Comprehensive Master Dossier if user asks for "full / all / everything / deep dive" ──
    if (wantsAll && !isAffirmation) {
      const fullDossier = [
        target.overview,
        target.history,
        target.architecture,
        target.sculptures,
        target.inscriptions,
        target.travel
      ].filter(Boolean);

      covered.add('history');
      covered.add('architecture');
      covered.add('sculptures');
      covered.add('inscriptions');
      covered.add('travel');

      return `🏰 **Complete Master Heritage Guide: ${target.name}**\n\n` + fullDossier.join('\n\n') + `\n\nIs there any specific legend, hidden room, or architectural mystery about **${target.name}** you'd like to explore further, ${userName}?`;
    }

    // ── 4. Multi-Topic Composition ──
    const sections = [];

    if (wantsAge && target.ageText) {
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

    if (wantsHistory && !wantsBuilder && target.history) {
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

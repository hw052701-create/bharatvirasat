// ── ai.js — Virasat AI Guide Module ───────────────────────────────────────
const AIGuide = {
  chatHistory: [],

  // ─── Render AI Page ───────────────────────────────────────────────────────
  render() {
    document.getElementById('app-content').innerHTML = `
      <div class="ai-header">
        <div class="ai-avatar">🪷</div>
        <h2>Virasat AI</h2>
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
            <div class="msg-avatar ai-msg-avatar">🪷</div>
            <div class="msg-bubble ai-bubble">
              <b>Namaste! I'm Virasat AI 🙏</b><br><br>
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
    return `
      <div class="chat-msg ${isUser ? 'user' : ''}">
        <div class="msg-avatar ${isUser ? 'user-msg-avatar' : 'ai-msg-avatar'}">
          ${isUser ? Auth.getInitials(Auth.currentUser?.name) : '🪷'}
        </div>
        <div class="msg-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}">
          ${AIGuide.formatMarkdown(msg.text)}
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
      return `🙏 **Namaste! I am Virasat AI (विरासत AI)**, your expert companion for Indian heritage, culture, and history.\n\nI can help you discover:\n• **42+ UNESCO World Heritage Sites** & ASI protected monuments across India\n• **Royal Dynasties** (Mughal, Chola, Maurya, Gupta, Vijayanagara, Maratha)\n• **Classical Dance & Music** (Bharatnatyam, Kathak, Carnatic, Hindustani)\n• **Living Festivals** (Diwali, Holi, Navratri, Durga Puja, Pongal, Onam)\n• **Ancient Temple Architecture** (Nagara, Dravidian, Vesara styles)\n\nWhat would you like to explore today?`;
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
    return `🏛️ **Indian Heritage Insights: "${cleanWord}"**\n\nIndia preserves over 5,000 years of civilization with **42 UNESCO World Heritage Sites**, thousands of ASI protected monuments, and rich intangible traditions.\n\n• **Discover Monuments:** Use the **Explore** tab to browse architectural masterpieces and historical dynasties.\n• **Earn Badges:** Visit sites with GPS in **GeoHunt** to unlock explorer achievements.\n• **Ask Virasat AI:** Ask about specific rulers (Ashoka, Akbar, Cholas), temples (Konark, Meenakshi), caves (Ajanta, Ellora), or festivals!\n\nWould you like a detailed historical legend, travel guide, or quiz about this?`;
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
    const s = (site || '').toLowerCase();
    if (s.includes('ajanta')) {
      return `Two thousand years ago, deep within the horseshoe canyon of the Waghora River in Maharashtra, Buddhist monks and guild artisans chiseled thirty grand sanctuaries into raw basalt cliffs.\n\nWorking by the gentle glow of brass lamps and sunlight reflected through silver mirrors, they painted the life of the Buddha and vibrant Jataka tales with mineral pigments made of lapis lazuli, red ochre, and crushed leaves.\n\nWhen dynastic fortunes shifted, the jungle reclaimed the gorge for over a millennium—until 1819, when a British tiger hunter named John Smith spotted the arched entrance of Cave 10 hidden beneath tangled vines, awakening ancient India's greatest painted treasure to the world.`;
    }
    if (s.includes('ellora')) {
      return `In the 8th century CE, King Krishna I of the Rashtrakuta Dynasty envisioned a temple so grand that it would rival Mount Kailash itself. Master architect Kokasa made a daring vow: rather than stacking stone upon stone, his artisans would carve the entire temple top-down from a single volcanic mountain.\n\nOver two centuries, generations of sculptors chipped away 200,000 tonnes of solid rock with mere chisels and hammers. When finished, Cave 16—the Kailasa Temple—stood as a monolithic marvel with life-sized carved elephants and multi-story galleries that defies the limits of human imagination.`;
    }
    if (s.includes('konark')) {
      return `In 1250 CE along the windswept shores of Odisha, King Narasimhadeva I summoned 1,200 of the finest sculptors in the realm to build a cosmic chariot for Surya, the Sun God. Designed with 24 colossal carved wheels that tell exact time by sunlight shadows, the temple was nearly complete except for the crowning Kalasa dome, which puzzled the master builders for 12 long years.\n\nLegend tells of Dharmapada, the 12-year-old son of chief architect Bisu Maharana, who climbed the towering peak and positioned the missing stone with mathematical precision, sacrificing his life into the roaring ocean to preserve the honor of his father and fellow artisans.`;
    }
    if (s.includes('taj')) {
      return `In 1631, on the tranquil banks of the Yamuna River in Agra, Mughal Emperor Shah Jahan vowed to build a resting place of sublime beauty for his beloved empress, Mumtaz Mahal.\n\nFor 22 years, over 20,000 craftsmen, lapidaries, and calligraphers from across Central Asia and India joined hands. Translucent Makrana marble was inlaid with 28 varieties of semi-precious stones—jasper from Punjab, jade from China, turquoise from Tibet, and lapis lazuli from Afghanistan—creating an ethereal monument that shifts color from soft rose at dawn to gleaming gold beneath the full moonlight.`;
    }
    if (s.includes('hampi')) {
      return `In the 14th century, along the rugged boulder-strewn banks of the Tungabhadra River, brothers Harihara and Bukka founded Vijayanagara—the City of Victory. At its zenith, Hampi was one of the wealthiest metropolises on earth, where European and Persian travelers wrote of open-air street markets trading diamonds, rubies, and silk by the measure.\n\nToday, its sacred ruins—the musical pillars of Vittala Temple, the monolithic Stone Chariot, and the towering Virupaksha Gopuram—still whisper legends of emperors who balanced cosmic arts with warrior valor.`;
    }
    if (s.includes('vav') || s.includes('rani')) {
      return `In 1063 CE in Patan, Gujarat, Queen Udayamati of the Chaulukya dynasty commissioned a subterranean masterpiece in loving memory of her late husband, King Bhima I. Unlike traditional temples reaching toward the sky, Rani ki Vav is an inverted temple descending seven levels into the mother earth.\n\nAdorned with over 500 principal sculptures and a thousand minor carvings of Lord Vishnu in his Dashavatara forms, it elevated water conservation into an exquisite sanctum of devotion, resilience, and architectural perfection.`;
    }
    if (s.includes('red fort') || s.includes('lal qila')) {
      return `In 1638, Shah Jahan resolved to shift his imperial capital from Agra to Delhi, designing the octagonal red sandstone fortress of Shahjahanabad. Within its fortified ramparts stood the Diwan-i-Khas, where the fabled Peacock Throne once rested beneath silver ceilings.\n\nOn its marble arch, poet Amir Khusrau's famous Persian verses are inscribed in gold: "Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast" (If there is a paradise on earth, it is this, it is this, it is this).`;
    }
    if (s.includes('sanchi')) {
      return `Following the devastating battle of Kalinga, Emperor Ashoka renounced conquest through war and embraced the path of Dhamma and peace. In the 3rd century BCE, he selected the tranquil hilltop of Sanchi in Madhya Pradesh to enshrine sacred relics of Gautama Buddha under a massive stone hemisphere.\n\nCenturies later, the Satavahana artisans added four magnificent Torana gateways, each carved with intricate depictions of elephants, winged lions, and Jataka legends, creating a lasting beacon of universal harmony.`;
    }
    return `Centuries ago in the golden heart of India, master architects, scholars, and devoted artisans gathered to create ${site || 'this timeless monument'}.\n\nUnder the starlit skies of ancient Bharat, every stone was inscribed with royal grandeur, cosmic philosophy, and unmatched devotion. Legends tell of master craftsmen whose dedication defied time itself, leaving behind an enduring cultural marvel that continues to inspire pilgrims and travelers from all corners of the world.`;
  },

  async fetchStory() {
    const siteInput = document.getElementById('story-site-input');
    const site = siteInput ? siteInput.value.trim() : 'Ajanta Caves';
    if (!site) return;

    document.getElementById('modal-content').innerHTML = `
      <div style="text-align:center;padding:2rem">
        <div class="typing-indicator" style="justify-content:center">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        <p style="color:var(--text-secondary);margin-top:1rem;font-size:0.9rem">Summoning ancient legends for <b>${site}</b>...</p>
      </div>`;

    try {
      const res = await API.generateStory(site);
      const storyText = (res && res.story) ? res.story : AIGuide.getStoryFallback(site);
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">📖 The Legend of ${site}</h3>
        <p style="line-height:1.85;color:var(--text-secondary);font-style:italic;font-size:0.92rem">${storyText.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')}</p>
        <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
          <button class="btn-secondary" style="flex:1" onclick="AIGuide.startStory('${site.replace(/'/g, "\\'")}')">
            <i class="fas fa-redo"></i> Another Story
          </button>
          <button class="btn-primary" style="flex:1" onclick="App.closeModal()">
            <span>Close</span>
          </button>
        </div>`;
    } catch {
      const fallbackStory = AIGuide.getStoryFallback(site);
      document.getElementById('modal-content').innerHTML = `
        <h3 style="margin-bottom:1rem">📖 The Legend of ${site}</h3>
        <p style="line-height:1.85;color:var(--text-secondary);font-style:italic;font-size:0.92rem">${fallbackStory.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')}</p>
        <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
          <button class="btn-secondary" style="flex:1" onclick="AIGuide.startStory('${site.replace(/'/g, "\\'")}')">
            <i class="fas fa-redo"></i> Try Another
          </button>
          <button class="btn-primary" style="flex:1" onclick="App.closeModal()">
            <span>Close</span>
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

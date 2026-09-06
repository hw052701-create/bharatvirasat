const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth');

const geminiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiKey);

// ─── System Prompt — Personalized per user session ───────────────────────────
function getSystemPrompt(userName) {
  const name = userName ? userName.split(' ')[0] : 'Explorer';
  return `You are Virasat AI (विरासत AI), a premium, expert heritage and culture guide for India.
You are currently in a personal 1-on-1 session with ${name}.
You specialize in Indian history, architecture, monuments, UNESCO World Heritage Sites, festivals, art forms, and cultural traditions.
You are part of BharatVirasat — India's premier AI-powered heritage discovery platform.

Response Style (CRITICAL — follow this exactly):
- Write in natural, flowing conversational paragraphs — like a knowledgeable friend explaining things over coffee.
- Do NOT use rigid bullet-point lists or "• Key: Value" format. Instead, weave facts naturally into readable paragraphs.
- Use **bold** to highlight key names, dates, and important terms within sentences.
- Start each response with a relevant emoji and the topic in bold as a natural opening line.
- Keep responses to 2-3 short paragraphs maximum. Be concise but rich.
- End with a natural follow-up question like "Would you like to know more about..." or "Shall I tell you about..."

Conversation Rules:
- Address ${name} by name occasionally (not every message) to keep it personal.
- Be warm, professional, deeply knowledgeable — like a museum curator giving a private tour.
- When answering follow-up questions, always resolve "it", "its", "this", "that" from earlier conversation context.
- If asked in Hindi or any Indian language, respond fluently in that language.`;
}

// ─── Conversational Fallback Engine ──────────────────────────────────────────
const serverSessionTopics = {};

function getFallbackChat(message, history = [], userName = 'Explorer') {
  let raw = (message || '').trim();
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

  const displayName = userName ? userName.split(' ')[0] : 'Explorer';

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

console.log("Entities template ready, length:", entitiesCode.length);
fs.writeFileSync(path.join(__dirname, 'scratch_entities.js'), entitiesCode);


  // ── 1. Resolve Active Entity ──
  let activeEntity = null;

  for (const ent of entities) {
    if (ent.match.some(m => q.includes(m))) {
      activeEntity = ent;
      break;
    }
  }

  if (!activeEntity && history && Array.isArray(history)) {
    const reversedHistory = [...history].reverse();
    for (const item of reversedHistory) {
      const text = (item.text || item.message || '').toLowerCase();
      for (const ent of entities) {
        if (ent.match.some(m => text.includes(m))) {
          activeEntity = ent;
          break;
        }
      }
      if (activeEntity) break;
    }
  }

  const target = activeEntity || entities[0];
  const userKey = displayName || 'default';
  if (!serverSessionTopics[userKey]) serverSessionTopics[userKey] = {};
  if (!serverSessionTopics[userKey][target.key]) serverSessionTopics[userKey][target.key] = new Set();
  const covered = serverSessionTopics[userKey][target.key];

  // ── 2. Detect Intents in Query ──
  const wantsAll = q.includes('full') || q.includes('all') || q.includes('everything') || q.includes('complete') || (q.includes('proper') && q.includes('information')) || q.includes('deep dive') || q.includes('all the information') || q.includes('research') || q.includes('student') || q.includes('more content') || q.includes('not less') || q.includes('full content');
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

    return `🎓 **Comprehensive Academic & Research Dossier: ${target.name}**\n\n` + fullDossier.join('\n\n') + `\n\nWould you like further academic analysis on its **epigraphical translations**, **structural conservation**, or **comparative dynastic history**, ${displayName}?`;
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

  if (sections.length > 0) {
    let reply = sections.join('\n\n');
    const suggestions = [];
    if (!covered.has('architecture')) suggestions.push('architecture');
    if (!covered.has('sculptures')) suggestions.push('sculptures');
    if (!covered.has('inscriptions')) suggestions.push('inscriptions');
    if (!covered.has('travel')) suggestions.push('travel guide');

    if (suggestions.length > 0) {
      reply += `\n\nWould you like to explore its **${suggestions.slice(0, 2).join('** or **')}** next, ${displayName}?`;
    }
    return reply;
  }

  // ── 5. Affirmative Follow-up Continuation ("yes please", "sure") ──
  if (isAffirmation) {
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
      return `${target.travel}\n\nWhat other heritage site would you like to explore next, ${displayName}?`;
    }
  }

  // ── 6. Direct Entity Mention ──
  if (activeEntity && target.overview) {
    covered.add('overview');
    return `${target.overview}\n\nWould you like to explore its **history**, **architecture**, **sculptures**, or **travel guide**?`;
  }

  // ── 7. Greetings ──
  if (/^(hi|hello|hey|namaste|pranam|hola|greetings)/i.test(q) || q === 'hi' || q === 'hello') {
    return `🙏 **Namaste, ${displayName}!** Welcome to Virasat AI — your personal guide to India's 5,000 years of heritage.\n\nAsk me about any **monument**, **dynasty**, **festival**, or **ancient art form** — or continue asking about **${target.name}**!\n\nWhat would you like to discover today?`;
  }

  return `🏛️ Regarding **${target.name}** in ${target.city}:\n\n${target.overview || target.details}\n\nWould you like to know about its **history**, **architecture**, **sculptures**, **inscriptions**, or **travel tips**?`;
}

// ─── Helper to get working Gemini model ─────────────────────────────────────
function getGeminiModel() {
  if (!geminiKey) return null;
  try {
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (e) {
    try {
      return genAI.getGenerativeModel({ model: 'gemini-pro' });
    } catch (err) {
      return null;
    }
  }
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], userName } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Try Gemini API first if key configured
    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const sysPrompt = getSystemPrompt(userName);
          let fullPrompt = `${sysPrompt}\n\n`;

          if (history && Array.isArray(history) && history.length > 0) {
            fullPrompt += 'Recent conversation history:\n';
            history.slice(-6).forEach(h => {
              const role = h.sender === 'user' ? (userName || 'User') : 'Virasat AI';
              const text = h.text || h.message || '';
              if (text) fullPrompt += `${role}: ${text}\n`;
            });
            fullPrompt += '\n';
          }

          fullPrompt += `Current user query: "${message}"\nVirasat AI response:`;

          const result = await model.generateContent(fullPrompt);
          const replyText = result.response.text();
          if (replyText && replyText.trim().length > 0) {
            return res.json({ success: true, reply: replyText.trim(), source: 'gemini_live' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini chat API error (using fallback):', geminiErr.message);
      }
    }

    // High quality intelligent fallback engine
    const reply = getFallbackChat(message, history);
    return res.json({ success: true, reply, source: 'virasat_knowledge_engine' });
  } catch (error) {
    console.error('AI chat error:', error);
    const reply = getFallbackChat(req.body?.message || '', req.body?.history || []);
    res.json({ success: true, reply, source: 'virasat_knowledge_engine' });
  }
});

// ─── POST /api/ai/monument-info ───────────────────────────────────────────────
router.post('/monument-info', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Monument name required' });

    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const prompt = `You are Virasat AI. Provide an engaging, informative 2-paragraph overview of the Indian heritage site or monument: "${name}". Highlight its historical era, builders, architectural significance, and cultural importance. Use markdown bold for key terms.`;
          const result = await model.generateContent(prompt);
          const replyText = result.response.text();
          if (replyText && replyText.trim().length > 0) {
            return res.json({ success: true, info: replyText.trim(), source: 'gemini_live' });
          }
        }
      } catch (err) {
        console.warn('Gemini monument-info failed, using fallback:', err.message);
      }
    }

    const info = getFallbackChat(name);
    return res.json({ success: true, info, source: 'virasat_knowledge_engine' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get monument info', message: error.message });
  }
});

// ─── POST /api/ai/quiz ────────────────────────────────────────────────────────
router.post('/quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'medium' } = req.body;

    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const prompt = `Generate a 5-question multiple choice quiz on Indian heritage ${topic ? `about "${topic}"` : 'covering famous monuments, empires, temples, and traditions'} at difficulty level: ${difficulty}.
Return ONLY a valid JSON array of objects with format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation"
  }
]
Do not include backticks, markdown, or any surrounding text.`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({ success: true, questions: parsed, source: 'gemini_live' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini quiz generation failed, using randomized pool:', geminiErr.message);
      }
    }

    const questionPool = [
      { question: 'Which emperor built the Taj Mahal in memory of his wife Mumtaz Mahal?', options: ['Akbar', 'Shah Jahan', 'Babur', 'Humayun'], correct: 1, explanation: 'Shah Jahan built the Taj Mahal between 1631 and 1653 CE in Agra.' },
      { question: 'Hampi was the ancient capital of which legendary South Indian empire?', options: ['Chola Empire', 'Vijayanagara Empire', 'Maurya Empire', 'Maratha Empire'], correct: 1, explanation: 'Hampi was the capital of the Vijayanagara Empire during the 14th to 16th centuries.' },
      { question: 'Which Sun Temple is designed as a colossal stone chariot with 24 carved wheels?', options: ['Meenakshi Temple', 'Konark Sun Temple', 'Khajuraho Temple', 'Brihadeeswara Temple'], correct: 1, explanation: 'Konark Sun Temple in Odisha was built in the 13th century by King Narasimhadeva I.' },
      { question: 'Where are the 2,000-year-old rock-cut Buddhist murals of Ajanta located?', options: ['Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Rajasthan'], correct: 1, explanation: 'Ajanta Caves are located in the Aurangabad district of Maharashtra.' },
      { question: 'Which classical dance originated in the sacred temples of Tamil Nadu?', options: ['Kathak', 'Bharatnatyam', 'Kathakali', 'Odissi'], correct: 1, explanation: 'Bharatnatyam is an ancient classical dance form originating in Tamil Nadu temples.' },
      { question: 'Who commissioned the Great Stupa at Sanchi in the 3rd century BCE?', options: ['Chandragupta Maurya', 'Emperor Ashoka', 'Kanishka', 'Harshavardhana'], correct: 1, explanation: 'Emperor Ashoka built the Great Stupa at Sanchi over sacred relics of the Buddha.' },
      { question: 'What primary material gives Delhi’s Red Fort its distinctive color?', options: ['White Marble', 'Red Sandstone', 'Granite', 'Basalt'], correct: 1, explanation: 'Shah Jahan built the Red Fort with red sandstone quarried from Rajasthan.' },
      { question: 'The Brihadeeswara Temple in Thanjavur was built by which Chola emperor?', options: ['Raja Raja Chola I', 'Rajendra Chola', 'Karikala Chola', 'Kulothunga Chola'], correct: 0, explanation: 'Raja Raja Chola I built the Brihadeeswara temple in 1010 CE entirely from granite.' }
    ];

    const shuffled = [...questionPool].sort(() => 0.5 - Math.random()).slice(0, 5);
    res.json({ success: true, questions: shuffled, source: 'offline_pool' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz', message: error.message });
  }
});

// ─── Detailed Historical Storytelling Engine ────────────────────────────────
function getDetailedStory(site) {
  const s = (site || '').toLowerCase().trim();

  if (s.includes('khajuraho') || s.includes('chandela') || s.includes('kandariya')) {
    return `In the misty autumn of **950 CE**, nestled beneath the craggy Vindhya hills in the heart of Bundelkhand, **King Yashovarman** and the visionary rulers of the **Chandela Rajput Dynasty** gazed upon a vast sacred clearing. Here, they resolved to translate the entire cosmic order—from the mortal realm to the highest heavenly spheres—into living stone.\n\nOver the course of a glorious century, master architects (*Sutradharas*) like **Chhichha** led guilds of thousands of stonemasons who quarried golden-hued sandstone from the Panna riverbeds. Guided by ancient **Vastu Shastra** and the **Nagara** architectural canon, they raised 85 towering temples. The jewel among them was the soaring **Kandariya Mahadeva Temple**, dedicated to Lord Shiva, designed with a rhythmic cluster of 84 miniature spires (*Urushringas*) that mirrored the sacred peaks of **Mount Kailash**.\n\nOn the exterior walls, sculptors breathed life into the four **Purusharthas** (the fundamental goals of human existence): *Dharma* (righteousness), *Artha* (wealth), *Kama* (love, passion, and artistic beauty), and *Moksha* (ultimate liberation). Celestial dancers (*Apsaras*) applying *kajal*, musicians playing classical *veenas*, royal warriors, and divine couples (*Mithuna*) were carved with such breathtaking anatomical grace that the stone itself seemed to pulse with life.\n\nAs dynasties waned and medieval trade routes shifted, the dense teak jungle slowly enveloped the sacred valley for nearly four centuries. It was not until **1838**, when British surveyor **Captain T.S. Burt** followed local tribal guides deep into the forest, that Khajuraho's 25 surviving sanctuaries were rediscovered—standing as an eternal tribute to the unbound imagination and spiritual harmony of medieval India.`;
  }

  if (s.includes('taj') || s.includes('mumtaz') || s.includes('shah jahan') || s.includes('agra')) {
    return `In the sweltering monsoon of **1631 CE**, an overwhelming stillness fell upon the royal camp at Burhanpur. Empress **Mumtaz Mahal**, the beloved companion and confidante of Mughal Emperor **Shah Jahan**, had passed away. Consumed by inconsolable grief, the Emperor resolved to channel his heartbreak into the most sublime monument human hands had ever fashioned—a terrestrial reflection of the gardens of Paradise (*Jannat*).\n\nOn the banks of the sacred **Yamuna River in Agra**, master architect **Ustad Ahmad Lahori** assembled a guild of more than **20,000 artisans**, sculptors, calligraphers, and lapidaries from across India, Persia, the Ottoman Empire, and Central Asia. Massive blocks of translucent, flawless **white Makrana marble** were brought across Rajasthan on teams of specially harnessed bullocks and elephants. The tomb was engineered upon a subterranean network of moisture-retaining **ebony wood wells**, while its four 40-meter minarets were deliberately tilted outward by a fraction of a degree—an ingenious safeguard ensuring they would fall away from the sanctum in the event of an earthquake.\n\nFor 22 tireless years, the artisans practiced the delicate art of *Parchin Kari* (*pietra dura* inlay), embedding 28 varieties of rare semi-precious gems into floral arabesques: deep blue **lapis lazuli** from Afghanistan, glowing **carnelian** from Arabia, green **jade** from China, and fiery **jasper** from Punjab. Calligrapher **Amanat Khan** inscribed 22 Surahs from the Holy Quran in flowing **Thuluth script**, with letters calibrated in ascending scale so that to the mortal eye looking upward, the sacred verses appear in immaculate optical harmony.\n\nToday, the **Taj Mahal** stands not merely as a marble tomb, but as an eternal poem of love and devotion that softly transforms its hues with the shifting heavens—blushing soft rose at dawn, glowing crystalline white under the midday sun, and gleaming like pure molten gold beneath the full moon.`;
  }

  if (s.includes('konark') || s.includes('sun temple') || s.includes('odisha') || s.includes('narasimha')) {
    return `In **1250 CE**, where the roaring waves of the Bay of Bengal met the sacred Chandrabhaga River, King **Langula Narasimhadeva I** of the Eastern Ganga Dynasty made an imperial vow. To celebrate his glorious victories and offer gratitude for the blessings of **Surya**, the Supreme Sun God, he commanded the creation of a temple the likes of which mortal eyes had never seen: a colossal celestial stone chariot surging out of the sea toward the rising dawn.\n\nChief architect **Bisu Maharana** led a legion of **1,200 master sculptors** who laboured through twelve grueling years. From heavy Khondalite and Chlorite stones, they carved **24 monumental wheels**, each nearly ten feet in diameter and pulled by seven galloping steeds representing the seven days of the week and the seven colors of sunlight. Each wheel was sculpted with such astronomical precision that the shadows cast by the sun across the intricate hub and eight spokes functioned as an exact sundial, measuring time down to the minute.\n\nYet as the twelfth year drew to a close, a crisis gripped the shore. The massive magnetic iron-clamped crowning dome (*Kalasa*) could not be balanced atop the towering spire, and the King issued a terrifying ultimatum to finish the temple by sunrise or face execution. That fateful night, **Dharmapada**, the 12-year-old son of Bisu Maharana who had grown up studying the sacred architectural treatises, stepped into the sanctum. With brilliant mathematical insight, the young prodigy climbed the dizzying heights and locked the crowning stone into flawless alignment. Then, to protect his father's honor and save the lives of the 1,200 craftsmen from the king's wrath, the brave boy leaped from the temple pinnacle into the raging sea.\n\nThough ocean tides and centuries have weathered its majestic assembly hall (*Jagamohana*), the **Konark Sun Temple** remains one of humanity's grandest achievements—a breathtaking hymn in stone celebrating cosmic rhythm, solar power, and boundless human devotion.`;
  }

  if (s.includes('ellora') || s.includes('kailasa') || s.includes('rashtrakuta') || s.includes('krishna i')) {
    return `In the 8th century CE, amidst the dramatic basalt cliffs of the Deccan plateau in Maharashtra, **King Krishna I** of the **Rashtrakuta Dynasty** conceived an architectural audacity that defied every law of conventional building. Rather than assembling blocks of quarried stone, he declared that his artisans would sculpt an entire sacred mountain out of a single volcanic cliff face to recreate **Mount Kailash**, the mystical abode of Lord Shiva.\n\nMaster architect **Kokasa** made a daring vow: his sculptors would work exclusively **top-down**, carving into the living cliff without the aid of scaffolding or mortar. For over a century, generations of master craftsmen swung iron chisels and hammers beneath the blistering Deccan sun, cutting deep vertical trenches into the mountain and excavating more than **200,000 tonnes of solid basalt rock**.\n\nFrom the living mountain emerged **Cave 16 (The Kailasa Temple)**—a breathtaking monolithic complex twice the footprint of the Parthenon in Athens. Artisans carved multi-story pillared galleries, life-sized elephants that appear to lift the temple on their massive backs, and monumental high-relief panels. The most dramatic among them depicts the demon king **Ravana shaking Mount Kailash**, capturing the trembling fury of the mountain and the calm, effortless grace of Shiva pinning him down with a single toe.\n\nWhen the temple was originally completed, it was coated in brilliant white plaster so that it gleamed like the snow-capped Himalayas in the Indian sun. Even after a thousand years, Kailasa stands as an unfathomable engineering and spiritual marvel—a monument that seems not built by mortal hands, but summoned directly from the stone by divine will.`;
  }

  if (s.includes('ajanta') || s.includes('fresco') || s.includes('padmapani') || s.includes('buddhist cave')) {
    return `Between the **2nd century BCE and the 5th century CE**, in a dramatic crescent-shaped volcanic gorge carved by the Waghora River, Buddhist monks and guild artisans discovered an oasis of profound stillness. Here, sheltered from worldly turmoil, they carved **30 magnificent cave temples and monastic halls** (*Chaityas* and *Viharas*) deep into the raw basalt cliffs of Maharashtra.\n\nWorking in semi-darkness, the ancient painters devised an ingenious lighting system, using polished brass plates and silver mirrors placed at cave entrances to reflect soft natural daylight into the deepest chambers. Upon walls prepared with a plaster of river clay, rice husk, and cow dung, they painted with natural mineral pigments: crushed **lapis lazuli** from Badakhshan for celestial blues, rich **red and yellow ochres** from local volcanic soil, and carbon lampblack.\n\nTheir brushes brought the **Jataka tales** of the Buddha's previous incarnations alive with extraordinary emotional depth and fluidity. In Cave 1, the timeless mural of **Bodhisattva Padmapani** captures the pinnacle of classical Indian art—holding a delicate blue lotus with eyes cast down in boundless compassion for all living beings, wearing pearl necklaces that seem to catch the ambient lamp glow.\n\nWhen royal patronage waned with the fall of the **Vakataka Dynasty**, the lush monsoon jungle slowly concealed the cave entrances under thick curtains of creepers and wild trees. For nearly a thousand years, the painted Buddhas rested in secret peace until **April 1819**, when British cavalry officer **John Smith**, tracking a tiger through the Waghora ravine, spotted the top arch of Cave 10—reawakening the greatest painted heritage of the ancient world.`;
  }

  if (s.includes('hampi') || s.includes('vijayanagara') || s.includes('vittala') || s.includes('krishnadevaraya')) {
    return `In the year **1336 CE**, amidst a surreal landscape of giant granite boulders along the sacred **Tungabhadra River**, two warrior brothers named **Harihara** and **Bukka** founded the capital of the **Vijayanagara Empire**—the legendary 'City of Victory'. Under the golden reign of **Emperor Krishnadevaraya** in the 16th century, Hampi flourished as one of the largest, wealthiest, and most cosmopolitan metropolises on earth.\n\nForeign travelers like the Persian ambassador **Abdur Razzaq** and Portuguese merchant **Domingo Paes** wrote in sheer astonishment that Hampi's bustling bazaars traded diamonds, pearls, rubies, and emeralds openly by the measure, like common grain. The empire fostered a radiant renaissance of Kannada, Telugu, and Sanskrit literature, while royal *Sthapathis* carved grand temples that blended Dravidian grandeur with bold sculptural vigor.\n\nAt the **Vittala Temple Complex**, artisans created the iconic **Monolithic Stone Chariot**, dedicated to Garuda, and sculpted fifty-six **musical pillars** (*SaReGaMa pillars*) from single resonant granite blocks that produced distinct notes of classical Indian music when gently tapped by royal musicians. Across the river, the sky-piercing Gopuram of the ancient **Virupaksha Temple** watched over sacred festivals where decorated royal elephants marched in gold-embroidered silks.\n\nThough the imperial capital fell in the battle of 1565, the ruins of Hampi spread across 4,100 hectares remain alive with majestic power—where wind whistling through granite colonnades and sacred chants echoing across the Tungabhadra still narrate the golden epoch of South India's greatest empire.`;
  }

  if (s.includes('brihadeeswara') || s.includes('thanjavur') || s.includes('chola') || s.includes('raja raja')) {
    return `In **1010 CE**, to commemorate the 25th victorious year of his imperial reign, the great Chola Emperor **Raja Raja Chola I** laid the final sanctified stone of the **Brihadeeswara Temple** (*Peruvudaiyar Kovil*) in Thanjavur, Tamil Nadu. Having built a naval empire whose fleets held sway across the Bay of Bengal to Sumatra and Malaya, the Emperor resolved to build the world's most formidable granite temple in tribute to Lord Shiva as the Cosmic Dancer, **Nataraja**.\n\nIn a flat alluvial delta completely devoid of natural stone, the Chola engineers transported over **130,000 tonnes of hard granite** from quarries over 50 kilometers away. The soaring central tower (*Vimana*) was raised to a dizzying **66 meters (216 feet)**, making it the tallest architectural structure of its era. Atop this colossal tower rests the **Kumbam**—a single monolithic granite capstone weighing an astonishing **80 tonnes**.\n\nTo lift this immense monolith to the summit, master builders constructed a monumental inclined earth ramp that stretched nearly **6 kilometers** through the countryside, where regiments of royal elephants, oxen, and thousands of workers hauled the granite block inch by inch. The entire temple was constructed without mortar, using precisely interlocked tongue-and-groove granite blocks that have withstood numerous earthquakes and monsoons for over a millennium.\n\nWithin its circumambulatory halls, Chola artists painted vibrant frescoes, while royal inscriptions etched deeply into the stone plinths meticulously recorded the names of every dancer, musician, architect, and cook who served the temple. The Brihadeeswara Temple stands today as the supreme triumph of **Dravidian architecture**—a monumental granite symphony of imperial power, architectural genius, and unyielding devotion.`;
  }

  if (s.includes('rani ki vav') || s.includes('stepwell') || s.includes('patan') || s.includes('udayamati')) {
    return `In **1063 CE**, following the demise of King Bhima I of the Chaulukya (Solanki) Dynasty, **Queen Udayamati** resolved to build a memorial unlike any other in royal history. While kings raised towers reaching toward the heavens, the Queen commissioned an **inverted subterranean temple** in Patan, Gujarat, that plunged seven magnificent levels deep into the womb of the earth to honor the sacred life-giving gift of water.\n\nKnown as **Rani ki Vav** (The Queen's Stepwell), this subterranean marvel was designed as an architectural sanctuary along the ancient Saraswati River. Descending through stepped terraces and intricately pillared pavilions, visitors are surrounded by more than **800 major sculptures** and 1,000 minor carvings of extraordinary sophistication, depicting **Lord Vishnu in his Dashavatara forms**—from Matsya and Kurma to the majestic sleeping form of *Sheshashayi Vishnu* resting upon the cosmic serpent.\n\nWhen the Saraswati River altered its course and flooded the plains in the 13th century, silt and fine sand completely buried the stepwell, sealing it in a natural subterranean time capsule for nearly seven centuries. When the **Archaeological Survey of India** meticulously excavated the monument in the late 20th century, the carvings emerged in pristine, razor-sharp condition—looking as though the master Solanki sculptors had laid down their chisels only yesterday.`;
  }

  if (s.includes('red fort') || s.includes('lal qila') || s.includes('delhi')) {
    return `In **1638 CE**, Mughal Emperor **Shah Jahan** decided to shift his imperial throne from Agra to Delhi, designing a brand-new planned capital city named **Shahjahanabad**. For ten years along the Yamuna riverbank, master builders and stonemasons raised the soaring, octagonal bastions of the **Red Fort (Lal Qila)** using glowing red sandstone quarried from Rajasthan.\n\nBehind its formidable two-kilometer battlements lay a majestic world of marble palaces, canal-cooled courtyards, and fragrant *Charbagh* gardens. In the **Diwan-i-Khas** (Hall of Private Audience), the Emperor held council upon the fabled **Peacock Throne**, encrusted with diamonds, emeralds, pearls, and the legendary **Koh-i-Noor diamond**, beneath silver ceilings inlaid with gold.\n\nOn the marble archway overlooking the hall, court poet **Amir Khusrau's** celebrated Persian couplet was inscribed in gleaming gold calligraphy: *"Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast"*—**If there is a paradise on earth, it is this, it is this, it is this.** Over three centuries, the fort witnessed the zenith of Mughal majesty, the upheavals of 1857, and finally the historic dawn of **15 August 1947**, when Prime Minister Jawaharlal Nehru raised independent India's tricolor flag from its ramparts—sealing its place as the living heartbeat of the nation.`;
  }

  if (s.includes('varanasi') || s.includes('kashi') || s.includes('banaras') || s.includes('ghat')) {
    return `Long before recorded history began, upon the sacred crescent where the river **Ganga** turns northward toward the Himalayas, the eternal city of **Kashi (Varanasi)** was founded as the terrestrial abode of **Lord Shiva**. Renowned by ancient chroniclers as *Avimukta*—the city never forsaken by the divine—Varanasi has sustained an unbroken rhythm of life, philosophy, and prayer for over **3,000 years**.\n\nAlong its sacred riverfront, **84 historic stone ghats** slope gently into the holy waters. At **Dashashwamedh Ghat**, legend recounts that Lord Brahma performed ten royal horse sacrifices to welcome Shiva back to the city. At **Manikarnika Ghat**, sacred funeral pyres have burned continuously across millennia, embodying the ultimate Hindu belief in *Moksha*—liberation from the eternal cycle of rebirth.\n\nThrough narrow, labyrinthine alleys scented with marigolds, camphor, and freshly brewed chai, generations of poets like **Kabir** and **Tulsidas** composed immortal verses, while master weavers crafted shimmering **Banarasi silk** brocaded with real gold threads. As twilight falls each evening, the ringing of hundreds of brass temple bells and the rhythmic waving of towering multi-tiered brass oil lamps during the **Ganga Aarti** illuminate the river, reaffirming Mark Twain's famous words: *"Varanasi is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together."*`;
  }

  if (s.includes('sanchi') || s.includes('stupa') || s.includes('ashoka')) {
    return `In the 3rd century BCE, following the catastrophic bloodbath of the Kalinga War, a profound transformation gripped the heart of the mighty Mauryan Emperor **Ashoka**. Renouncing territorial conquest through war (*Digvijaya*), the Emperor embraced the Buddhist path of moral victory through righteousness (*Dhammavijaya*). On a serene, secluded hilltop at **Sanchi** in Madhya Pradesh, he commissioned the construction of a great hemispherical stone dome to enshrine sacred bone relics of **Gautama Buddha**.\n\nTwo centuries later, under the **Satavahana Dynasty**, guilds of ivory carvers and sculptors from nearby Vidisha added four magnificent **Torana gateways** facing the four cardinal directions. These 34-foot-high gateways were carved with breathtaking density: playful elephants holding lotus flowers, celestial guardians (*Yakshis*) gracefully suspended from mango boughs, and vivid narrative panels recounting the Buddha's life and Jataka tales.\n\nIntriguingly, the Buddha himself was never depicted in human form on these ancient toranas—instead, his presence was reverently symbolized through footprints (*Paduka*), an empty throne beneath the Bodhi tree, the wheel of law (*Dharmachakra*), and the umbrella of spiritual royalty (*Chhatra*). Sanchi stands today as India's oldest surviving stone structure, a timeless sanctuary of inner peace and universal compassion.`;
  }

  // Universal Deep Historical Narrative Fallback
  return `Centuries ago in the golden heart of India, visionary rulers, master sthapathis, and devoted guilds of craftsmen gathered to breathe life into **${site || 'this timeless monument'}**.\n\nWorking under the starlit skies of ancient Bharat, hundreds of stone carvers, metal casters, and painters chipped away at raw granite, sandstone, and marble. Guided by sacred geometric canons and Vedic philosophy, every arch was calibrated to capture the cosmic movement of constellations, while every sculpted pillar mirrored the spiritual harmony between nature, humanity, and the divine.\n\nLegends recount the immense devotion of those master artisans who poured their lifetimes into this creation, leaving behind inscriptions in classical Sanskrit, Prakrit, or Persian that whisper forgotten tales of royal valor, celestial music, and spiritual enlightenment. Today, as travelers and pilgrims walk through its historic corridors, the stones continue to echo with the enduring soul of India's 5,000-year-old civilization.`;
}

// ─── POST /api/ai/story ───────────────────────────────────────────────────────
router.post('/story', async (req, res) => {
  try {
    const { site } = req.body;
    const targetSite = site ? site.trim() : 'Ajanta Caves';

    if (geminiKey) {
      try {
        const model = getGeminiModel();
        if (model) {
          const prompt = `You are Virasat AI, an acclaimed Indian heritage historian and master storyteller.
Write an exceptionally rich, poetic, and historically immersive narrative story (3 to 4 vivid paragraphs, ~350-450 words) about the Indian heritage site or monument: "${targetSite}".

Narrative Structure:
1. The Dawn of Vision: Set the atmospheric scene back in the historical era (the weather, riverbanks, sounds of chisels striking stone, scents of sandalwood and brass lamps, courtly atmosphere, and the visionary ruler, queen, or monastic master who conceived the monument).
2. The Miracle of Creation: Detail the feats of master architects (sthapathis/ustads) and devoted artisans, the sourcing of rare materials (Makrana marble, granite monoliths, volcanic basalt, lapis lazuli pigments), the engineering triumphs, and human sacrifices or devotion behind every carved pillar, dome, or mural.
3. Legends & Sacred Mysteries: Recount the enduring folktales, spiritual symbolism, inscriptions, astronomical alignments, or intriguing mysteries that have been passed down across generations.
4. Timeless Legacy: Conclude with how this sanctum or fortress stands today as an eternal testament to Bharat's cultural and architectural soul.

Formatting: Use rich markdown with **bold** highlights for key historical figures, dates, dynasties, architectural styles, and Sanskrit/Persian terms. Do NOT use bullet points — write in sweeping, evocative prose.`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text && text.trim().length > 0) {
            return res.json({ success: true, story: text.trim(), source: 'gemini_live' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini story generation failed, using rich fallback:', geminiErr.message);
      }
    }

    const story = getDetailedStory(targetSite);
    res.json({ success: true, story, source: 'virasat_storyteller_engine' });
  } catch (error) {
    console.error('Story route error:', error);
    const story = getDetailedStory(req.body?.site || 'Indian Monument');
    res.json({ success: true, story, source: 'virasat_storyteller_engine' });
  }
});

module.exports = router;


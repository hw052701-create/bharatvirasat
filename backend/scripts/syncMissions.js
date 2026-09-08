const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://bharatvirasat:BharatVirasat2026@ac-9axbwyz-shard-00-00.i9yzfym.mongodb.net:27017,ac-9axbwyz-shard-00-01.i9yzfym.mongodb.net:27017,ac-9axbwyz-shard-00-02.i9yzfym.mongodb.net:27017/bharatvirasat?ssl=true&authSource=admin&replicaSet=atlas-70d9au-shard-0';

const newMissions = [
  {
    title: 'Golden Sanctuary Explorer',
    description: 'Visit Sri Harmandir Sahib (Golden Temple) in Amritsar and discover the spiritual sanctity of Amrit Sarovar.',
    type: 'quiz',
    difficulty: 'easy',
    rewardPoints: 150,
    rewardBadge: { name: 'Golden Pilgrim', icon: '🪷' },
    location: { lat: 31.6200, lng: 74.8765 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Imperial Citadel of Agra Fort',
    description: 'Explore the red sandstone walls and marble courtyards of the Mughal imperial fortress.',
    type: 'quiz',
    difficulty: 'medium',
    rewardPoints: 180,
    rewardBadge: { name: 'Citadel Master', icon: '🏰' },
    location: { lat: 27.1795, lng: 78.0211 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Queen’s Subterranean Stepwell',
    description: 'Uncover the 7-tier architectural masterpiece of Rani ki Vav in Patan, Gujarat.',
    type: 'quiz',
    difficulty: 'medium',
    rewardPoints: 200,
    rewardBadge: { name: 'Stepwell Scholar', icon: '💧' },
    location: { lat: 23.8589, lng: 72.1014 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Invincible Ramparts of Kumbhalgarh',
    description: 'Walk the 36-kilometer Great Wall of India at Kumbhalgarh Fort in the Aravalli Hills.',
    type: 'quiz',
    difficulty: 'hard',
    rewardPoints: 250,
    rewardBadge: { name: 'Highland Guardian', icon: '🛡️' },
    location: { lat: 25.1479, lng: 73.5877 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Jallianwala Memorial Pilgrimage',
    description: 'Honor the martyrs of the 1919 freedom struggle in the historic city of Amritsar.',
    type: 'checkin',
    difficulty: 'easy',
    rewardPoints: 120,
    rewardBadge: { name: 'Freedom Sentinel', icon: '🕊️' },
    location: { lat: 31.6206, lng: 74.8801 },
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Nawabi Grandeur of Bara Imambara',
    description: 'Explore the gravity-defying central vault and the intricate labyrinths of Bhool Bhulaiya.',
    type: 'quiz',
    difficulty: 'medium',
    rewardPoints: 175,
    rewardBadge: { name: 'Awadh Connoisseur', icon: '🏛️' },
    location: { lat: 26.8688, lng: 80.9129 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Harappan Maritime Gateway of Lothal',
    description: 'Discover the world’s oldest known tidal dockyard and ancient Indus Valley trade port in Gujarat.',
    type: 'quiz',
    difficulty: 'hard',
    rewardPoints: 220,
    rewardBadge: { name: 'Indus Navigator', icon: '⚓' },
    location: { lat: 22.5225, lng: 72.2492 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Solar Chariot of Modhera Sun Temple',
    description: 'Witness the geometry where equinox rays illuminate the sanctum of Surya Deva in Mehsana.',
    type: 'quiz',
    difficulty: 'medium',
    rewardPoints: 190,
    rewardBadge: { name: 'Solar Disciple', icon: '☀️' },
    location: { lat: 23.5835, lng: 72.1332 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Ram Tirath Hermitage of Valmiki',
    description: 'Pay homage to the sacred ashram of Maharishi Valmiki and birth site of Luv and Kush in Amritsar.',
    type: 'checkin',
    difficulty: 'easy',
    rewardPoints: 130,
    rewardBadge: { name: 'Ramayana Scholar', icon: '🏹' },
    location: { lat: 31.6833, lng: 74.7500 },
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Pride of Mewar: Chittorgarh Fort',
    description: 'Stand atop India’s largest fortress and explore Vijay Stambha (Tower of Victory).',
    type: 'quiz',
    difficulty: 'hard',
    rewardPoints: 260,
    rewardBadge: { name: 'Mewar Sovereign', icon: '🚩' },
    location: { lat: 24.8879, lng: 74.6453 },
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
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Moorish Palace & Royal Minaret',
    description: 'Discover the Indo-Saracenic and French-inspired Moorish Mosque of Kapurthala, Punjab.',
    type: 'quiz',
    difficulty: 'medium',
    rewardPoints: 170,
    rewardBadge: { name: 'Kapurthala Scholar', icon: '🕌' },
    location: { lat: 31.3800, lng: 75.3800 },
    quiz: [
      {
        question: 'Moorish Mosque in Kapurthala was modeled after which famous world monument?',
        options: ['Grand Mosque of Marrakech (Morocco)', 'Hagia Sophia', 'Blue Mosque', 'Cordoba Mosque'],
        answer: 0
      },
      {
        question: 'Which ruler commissioned the Moorish Mosque for his Muslim subjects in 1930?',
        options: ['Maharaja Jagatjit Singh', 'Maharaja Bhupinder Singh', 'Maharaja Ranjit Singh', 'Nawab of Bahawalpur'],
        answer: 0
      }
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  },
  {
    title: 'Astronomical Mysteries of Jantar Mantar',
    description: 'Decode the world’s largest stone sundial (Vrihat Samrat Yantra) in Jaipur, Rajasthan.',
    type: 'quiz',
    difficulty: 'medium',
    rewardPoints: 210,
    rewardBadge: { name: 'Cosmic Astronomer', icon: '🔭' },
    location: { lat: 26.9248, lng: 75.8246 },
    quiz: [
      {
        question: 'Who founded and designed the astronomical observatory of Jantar Mantar Jaipur?',
        options: ['Sawai Jai Singh II', 'Man Singh I', 'Rana Kumbha', 'Mirza Raja Jai Singh'],
        answer: 0
      },
      {
        question: 'The giant sundial at Jaipur can measure local solar time with an accuracy of:',
        options: ['2 seconds', '5 minutes', '1 hour', '15 seconds'],
        answer: 0
      }
    ],
    isActive: true,
    radius: 300,
    completedBy: []
  }
];

async function syncMissions() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  console.log('Inserting / updating missions in MongoDB...');
  
  for (const m of newMissions) {
    await db.collection('missions').updateOne(
      { title: m.title },
      { $set: m },
      { upsert: true }
    );
  }
  
  const allMissions = await db.collection('missions').find({}).toArray();
  console.log('Total missions now in MongoDB:', allMissions.length);
  allMissions.forEach(m => console.log(' ->', m.title, `(${m.location.lat}, ${m.location.lng})`));
  await mongoose.disconnect();
}

syncMissions();

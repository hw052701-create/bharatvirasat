const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://bharatvirasat:BharatVirasat2026@ac-9axbwyz-shard-00-00.i9yzfym.mongodb.net:27017,ac-9axbwyz-shard-00-01.i9yzfym.mongodb.net:27017,ac-9axbwyz-shard-00-02.i9yzfym.mongodb.net:27017/bharatvirasat?ssl=true&authSource=admin&replicaSet=atlas-70d9au-shard-0';

async function seedCommunity() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();
  const heritages = await db.collection('heritages').find({}).toArray();

  const userMap = {};
  users.forEach(u => {
    userMap[u.name] = u;
  });

  const naitik = userMap['Naitik Dhiman'] || users[0];
  const kush = userMap['Kush Sahu'] || users[1];
  const tanya = userMap['Tanya Maheshwari'] || users[2];
  const vasu = userMap['Vasudev Singh'] || users[3];
  const shourya = userMap['Shourya Vikram Shukla'] || users[4];
  const suhani = userMap['Suhani'] || users[5];

  const goldenTemple = heritages.find(h => h.name.includes('Harmandir') || h.name.includes('Golden Temple'));
  const raniKiVav = heritages.find(h => h.name.includes('Rani') || h.name.includes('Patan'));
  const agraFort = heritages.find(h => h.name.includes('Agra Fort'));
  const kumbhalgarh = heritages.find(h => h.name.includes('Kumbhalgarh'));

  const initialPosts = [
    {
      author: naitik._id,
      type: 'story',
      content: 'Early morning experience at Sri Harmandir Sahib (Golden Temple) in Amritsar. Watching the reflection of the golden sanctum in the sacred Amrit Sarovar while the morning Gurbani echoes is truly breathtaking and spiritually transcendent. An absolute must-visit for every heritage lover!',
      images: ['https://commons.wikimedia.org/wiki/Special:Redirect/file/Golden%20Temple.jpg'],
      heritage: goldenTemple ? goldenTemple._id : null,
      tags: ['GoldenTemple', 'Amritsar', 'PunjabHeritage', 'SpiritualIndia'],
      likes: [kush._id, tanya._id, vasu._id, shourya._id, suhani._id],
      comments: [
        {
          author: tanya._id,
          text: 'The evening illumination is equally magical! The community langar service here is an extraordinary living tradition.',
          createdAt: new Date(Date.now() - 3600000 * 5)
        },
        {
          author: vasu._id,
          text: 'Did you get a chance to visit the Akal Takht and the central museum adjacent to it? Truly rich historical collections.',
          createdAt: new Date(Date.now() - 3600000 * 2)
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24)
    },
    {
      author: tanya._id,
      type: 'discovery',
      content: 'Explored the 7 subterranean tiers of Rani ki Vav in Patan, Gujarat! The Maru-Gurjara style stone carvings of Lord Vishnu in his Dashavatara forms are carved with such microscopic precision. It is hard to believe this was built almost 1,000 years ago in 1063 CE.',
      images: ['https://commons.wikimedia.org/wiki/Special:Redirect/file/Rani_ki_vav7%2C_patan%2C_gujarat.jpg'],
      heritage: raniKiVav ? raniKiVav._id : null,
      tags: ['RaniKiVav', 'GujaratTourism', 'UNESCOHeritage', 'AncientEngineering'],
      likes: [naitik._id, kush._id, shourya._id, suhani._id],
      comments: [
        {
          author: kush._id,
          text: 'The inverted temple concept is genius architecture! The geometry of the steps creates such mesmerizing symmetry.',
          createdAt: new Date(Date.now() - 3600000 * 8)
        },
        {
          author: suhani._id,
          text: 'The Sheshashayi Vishnu sculpture at the lower level is stunning. Great captures!',
          createdAt: new Date(Date.now() - 3600000 * 3)
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 18)
    },
    {
      author: shourya._id,
      type: 'story',
      content: 'Standing on top of Kumbhalgarh Fort and witnessing the 36-kilometer Great Wall of India snaking across the misty Aravalli mountains! Birthplace of Maharana Pratap and a fortress that stood undefeated in history.',
      images: ['https://commons.wikimedia.org/wiki/Special:Redirect/file/Kumbhalgarh%20Fort%2C%20Rajsamand%20District%2C%20Rajasthan.jpg'],
      heritage: kumbhalgarh ? kumbhalgarh._id : null,
      tags: ['Kumbhalgarh', 'Rajasthan', 'GreatWallOfIndia', 'RajputHistory'],
      likes: [naitik._id, tanya._id, vasu._id, kush._id],
      comments: [
        {
          author: naitik._id,
          text: 'The view from Badal Mahal on the highest point is unforgettable. Excellent exploration!',
          createdAt: new Date(Date.now() - 3600000 * 4)
        },
        {
          author: kush._id,
          text: 'The evening sound and light show at the fort brings the entire Mewar history alive!',
          createdAt: new Date(Date.now() - 3600000 * 1)
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 12)
    }
  ];

  console.log('Clearing old posts and inserting curated community stories...');
  await db.collection('posts').deleteMany({});
  const result = await db.collection('posts').insertMany(initialPosts);
  console.log(`✅ Successfully seeded ${result.insertedCount} community stories with comments from real existing team accounts!`);

  await mongoose.disconnect();
}

seedCommunity();

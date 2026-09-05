const mongoose = require('mongoose');

const MissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['checkin', 'quiz', 'photo', 'explore'],
    default: 'checkin'
  },
  heritage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heritage'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  radius: { type: Number, default: 200 }, // meters to be considered "arrived"
  rewardPoints: { type: Number, default: 100 },
  rewardBadge: {
    name: String,
    icon: String
  },
  quiz: [{
    question: String,
    options: [String],
    answer: Number // index of correct option
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  completedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mission', MissionSchema);

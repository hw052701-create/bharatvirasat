const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 1
  },
  points: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  completedMissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission'
  }],
  visitedSites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heritage'
  }],
  savedSites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heritage'
  }],
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Level up logic
UserSchema.methods.addPoints = function(pts) {
  this.points += pts;
  this.level = Math.floor(this.points / 500) + 1;
};

module.exports = mongoose.model('User', UserSchema);

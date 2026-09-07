const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Heritage = require('../models/Heritage');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/user/profile ────────────────────────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('completedMissions', 'title rewardPoints')
      .populate('visitedSites', 'name state images');

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── PUT /api/user/profile ────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, state, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (state) updates.state = state;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── POST /api/user/save-site ─────────────────────────────────────────────────
router.post('/save-site', authMiddleware, async (req, res) => {
  try {
    const { siteId } = req.body;
    const user = await User.findById(req.user._id);
    const isSaved = user.savedSites.includes(siteId);

    if (isSaved) {
      user.savedSites = user.savedSites.filter(id => id.toString() !== siteId);
    } else {
      user.savedSites.push(siteId);
    }

    await user.save();
    res.json({ success: true, saved: !isSaved });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save site' });
  }
});

// ─── POST /api/user/award-points ──────────────────────────────────────────────
router.post('/award-points', authMiddleware, async (req, res) => {
  try {
    const { points, reason } = req.body;
    const pts = parseInt(points, 10) || 0;
    if (pts <= 0) return res.status(400).json({ error: 'Invalid points' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.addPoints(pts);
    await user.save();

    res.json({
      success: true,
      points: user.points,
      level: user.level,
      message: `Awarded +${pts} points`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to award points' });
  }
});

// ─── POST /api/user/sync-points ───────────────────────────────────────────────
router.post('/sync-points', authMiddleware, async (req, res) => {
  try {
    const { points } = req.body;
    const clientPoints = parseInt(points, 10) || 0;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (clientPoints > user.points) {
      user.points = clientPoints;
      user.level = Math.floor(user.points / 500) + 1;
      await user.save();
    }

    res.json({ success: true, points: user.points, level: user.level });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync points' });
  }
});

// ─── GET /api/user/leaderboard ────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const leaders = await User.find()
      .select('name points level badges avatar state')
      .sort({ points: -1 })
      .limit(20);
    res.json({ success: true, data: leaders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;

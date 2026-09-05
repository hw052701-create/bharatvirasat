const express = require('express');
const router = express.Router();
const Mission = require('../models/Mission');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/geohunt/missions ────────────────────────────────────────────────
router.get('/missions', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const missions = await Mission.find({ isActive: true })
      .populate('heritage', 'name images state')
      .sort({ rewardPoints: -1 });

    // Mark which missions user has completed
    const completedIds = req.user.completedMissions.map(id => id.toString());
    const missionsWithStatus = missions.map(m => ({
      ...m.toObject(),
      completed: completedIds.includes(m._id.toString()),
      distance: lat && lng ? calcDistance(parseFloat(lat), parseFloat(lng), m.location.lat, m.location.lng) : null
    }));

    res.json({ success: true, data: missionsWithStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch missions', message: error.message });
  }
});

// ─── POST /api/geohunt/checkin ────────────────────────────────────────────────
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    const { missionId, lat, lng } = req.body;

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });

    // Check if already completed
    const alreadyCompleted = mission.completedBy.some(
      c => c.user.toString() === req.user._id.toString()
    );
    if (alreadyCompleted) {
      return res.status(400).json({ error: 'Mission already completed' });
    }

    // Verify location (within radius)
    const dist = calcDistance(parseFloat(lat), parseFloat(lng), mission.location.lat, mission.location.lng);
    const distMeters = dist * 1000;

    if (distMeters > mission.radius) {
      return res.status(400).json({
        error: 'Too far from mission location',
        distance: Math.round(distMeters),
        required: mission.radius
      });
    }

    // Complete mission
    mission.completedBy.push({ user: req.user._id });
    await mission.save();

    // Award points and badge to user
    const user = await User.findById(req.user._id);
    user.addPoints(mission.rewardPoints);
    user.completedMissions.push(mission._id);

    if (mission.rewardBadge && mission.rewardBadge.name) {
      const hasBadge = user.badges.some(b => b.name === mission.rewardBadge.name);
      if (!hasBadge) {
        user.badges.push({ name: mission.rewardBadge.name, icon: mission.rewardBadge.icon });
      }
    }

    await user.save();

    res.json({
      success: true,
      message: `Mission completed! You earned ${mission.rewardPoints} points!`,
      pointsEarned: mission.rewardPoints,
      newTotal: user.points,
      newLevel: user.level,
      badge: mission.rewardBadge
    });
  } catch (error) {
    res.status(500).json({ error: 'Check-in failed', message: error.message });
  }
});

// ─── POST /api/geohunt/quiz-submit ───────────────────────────────────────────
router.post('/quiz-submit', authMiddleware, async (req, res) => {
  try {
    const { missionId, answers } = req.body;

    const mission = await Mission.findById(missionId);
    if (!mission || mission.type !== 'quiz') {
      return res.status(404).json({ error: 'Quiz mission not found' });
    }

    // Score the quiz
    let correct = 0;
    const results = mission.quiz.map((q, i) => {
      const isCorrect = answers[i] === q.answer;
      if (isCorrect) correct++;
      return { question: q.question, correct: isCorrect, correctAnswer: q.options[q.answer] };
    });

    const score = Math.round((correct / mission.quiz.length) * 100);
    const passed = score >= 60;

    if (passed) {
      // Award partial points based on score
      const pointsEarned = Math.round(mission.rewardPoints * score / 100);
      const user = await User.findById(req.user._id);
      user.addPoints(pointsEarned);

      const alreadyCompleted = mission.completedBy.some(c => c.user.toString() === req.user._id.toString());
      if (!alreadyCompleted) {
        mission.completedBy.push({ user: req.user._id });
        user.completedMissions.push(mission._id);
        await mission.save();
      }
      await user.save();

      return res.json({ success: true, score, passed, correct, results, pointsEarned, newTotal: user.points });
    }

    res.json({ success: true, score, passed, correct, results, pointsEarned: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Quiz submission failed', message: error.message });
  }
});

// ─── GET /api/geohunt/leaderboard ────────────────────────────────────────────
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

// ─── Helper: Haversine Distance (km) ─────────────────────────────────────────
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;

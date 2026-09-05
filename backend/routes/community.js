const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/community ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const query = type ? { type } : {};

    const posts = await Post.find(query)
      .populate('author', 'name avatar level badges')
      .populate('heritage', 'name state')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);
    res.json({ success: true, data: posts, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// ─── POST /api/community ──────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, images, heritage, tags, type } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const post = await Post.create({
      author: req.user._id,
      content,
      images: images || [],
      heritage: heritage || null,
      tags: tags || [],
      type: type || 'story'
    });

    await post.populate('author', 'name avatar level badges');
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post', message: error.message });
  }
});

// ─── POST /api/community/:id/like ─────────────────────────────────────────────
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const liked = post.likes.includes(req.user._id);
    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ success: true, liked: !liked, likeCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// ─── POST /api/community/:id/comment ─────────────────────────────────────────
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({ author: req.user._id, text });
    await post.save();
    await post.populate('comments.author', 'name avatar');

    res.json({ success: true, comment: post.comments[post.comments.length - 1] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;

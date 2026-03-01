const express = require('express');
const db = require('../database/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/stats', requireAuth, (req, res) => {
  res.json(db.getStats(req.user.id));
});

router.get('/', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  res.json(db.getHistory(req.user.id, limit));
});

module.exports = router;

const express = require('express');
const db = require('../database/db');

const router = express.Router();

router.get('/stats', (_req, res) => {
  res.json(db.getStats());
});

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  res.json(db.getHistory(limit));
});

module.exports = router;

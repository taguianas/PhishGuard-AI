const jwt = require('jsonwebtoken');

const SECRET = process.env.NEXTAUTH_SECRET;

module.exports = function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, SECRET);
    // NextAuth v5 stores user id in token.id (via jwt callback) or token.sub
    req.user = { id: payload.id || payload.sub };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

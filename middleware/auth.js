const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.header('Authorization');
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Geen token, toegang geweigerd' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Ongeldige token' });
  }
}

module.exports = auth;
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Expected format: "Bearer <token>"
  const authHeader = req.headers['authorization']; 
  const token = authHeader && authHeader.split(' ')[1];


  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
const jwt = require('jsonwebtoken');
exports.protect = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authenticated' });
  try {
    req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); // { id, role }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' });
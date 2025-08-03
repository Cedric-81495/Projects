// server/middleware/auth.js
import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];

  if (!bearerHeader || !bearerHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  const token = bearerHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // e.g. { userId: ... }
    next();
  } catch (err) {
    next({
      statusCode: 403,
      message: 'Invalid or expired token'
    });
  }
};

export default verifyToken;

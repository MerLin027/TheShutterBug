import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

export const protect = async (req, res, next) => {
  let token;

  // Note the trailing space: 'Bearer' alone also matched 'Bearerxyz', which
  // then failed safely a step later (split(' ')[1] is undefined and jwt.verify
  // throws a 401) but for the wrong reason.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await AdminUser.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch {
      // jwt.verify threw (expired, malformed, etc.)
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // No Authorization header / not a Bearer token
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const jwt          = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User         = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('No token provided. Please log in.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User account not found.');
    }
    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account is deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    // If jwt.verify itself threw (expired/invalid), catch it here
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Session expired. Please log in again.');
    }
    throw err; // re-throw our own errors
  }
});

module.exports = { protect };

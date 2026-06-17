const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.is_active = 1 AND u.deleted_at IS NULL`,
      [decoded.userId]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.',
      });
    }

    const user = users[0];

    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned.',
        reason: user.ban_reason,
      });
    }

    if (user.is_suspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily suspended.',
        reason: user.suspension_reason,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    logger.error('Auth middleware error:', error);
    next(error);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.',
        required: roles,
        current: req.user.role_name,
      });
    }

    next();
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    query(
      `SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = 1`,
      [decoded.userId]
    ).then(users => {
      if (users.length) req.user = users[0];
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

module.exports = { authenticate, authorize, optionalAuth };

const { ROLES } = require('../config/constants');

/**
 * authorize(...roles)
 * Admin ALWAYS passes — no need to list admin explicitly.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error('Not authenticated'));
  }
  // Admin bypasses all role restrictions
  if (req.user.role === ROLES.ADMIN) return next();

  if (!roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error(`Access denied. Required role: ${roles.join(' or ')}`));
  }
  next();
};

/**
 * requireApproval
 * Admin always passes. Approved users pass.
 * Unapproved non-admin users are blocked.
 */
const requireApproval = (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error('Not authenticated'));
  }
  // Admin always approved
  if (req.user.role === ROLES.ADMIN) return next();
  // Approved users pass
  if (req.user.isApproved) return next();

  res.status(403);
  return next(new Error('Your account is pending admin approval.'));
};

const isAdmin        = authorize(ROLES.ADMIN);
const isManufacturer = authorize(ROLES.MANUFACTURER);
const isDistributor  = authorize(ROLES.DISTRIBUTOR);
const isSeller       = authorize(ROLES.MANUFACTURER, ROLES.DISTRIBUTOR);
const isBuyer        = authorize(ROLES.PHARMACY, ROLES.HOSPITAL, ROLES.DISTRIBUTOR);

module.exports = {
  authorize,
  requireApproval,
  isAdmin,
  isManufacturer,
  isDistributor,
  isSeller,
  isBuyer,
};

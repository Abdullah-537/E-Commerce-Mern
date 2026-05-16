const ApiError = require('../utils/ApiError');

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log(`[AUTH] Missing user session`);
      return next(ApiError.unauthorized('Not authorized'));
    }

    if (!roles.includes(req.user.role)) {
      console.log(`[AUTH] Access Denied for ${req.user.role} on ${req.originalUrl}`);
      return next(ApiError.forbidden('Access denied'));
    }

    console.log(`[AUTH] Access Granted for ${req.user.role} on ${req.originalUrl}`);
    next();
  };
};

module.exports = roleMiddleware;
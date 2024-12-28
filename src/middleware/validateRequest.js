const { validationResult } = require('express-validator');
const HttpStatusCodes = require('../constants/http');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: errors.array() });
  }
  return next();
};

module.exports = validateRequest; 
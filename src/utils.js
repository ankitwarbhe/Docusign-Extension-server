const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('./config');

function generateAuthorizationCode() {
  return crypto.randomBytes(32).toString('hex');
}

function generateAccessToken(clientId, scope) {
  return jwt.sign(
    { 
      clientId,
      scope,
      type: 'access_token'
    },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpiration }
  );
}

function validateClient(clientId, clientSecret) {
  const client = db.clients.get(clientId);
  return client && client.clientSecret === clientSecret;
}

module.exports = {
  generateAuthorizationCode,
  generateAccessToken,
  validateClient
};
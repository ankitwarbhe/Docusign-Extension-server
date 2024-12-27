const config = {
  clientId: 'example-client-id',
  clientSecret: 'example-client-secret',
  jwtSecret: 'your-jwt-secret-key',
  authorizationCodeExpiration: 600, // 10 minutes
  accessTokenExpiration: 3600 // 1 hour
};

module.exports = config;
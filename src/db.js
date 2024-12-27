// In-memory storage for demo purposes
// In production, use a proper database
const db = {
  authorizationCodes: new Map(),
  accessTokens: new Map(),
  clients: new Map([
    ['example-client-id', {
      clientId: 'example-client-id',
      clientSecret: 'example-client-secret',
      redirectUris: ['http://localhost:3000/callback']
    }]
  ])
};

module.exports = db;
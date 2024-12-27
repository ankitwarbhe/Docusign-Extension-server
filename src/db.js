// In-memory storage for demo purposes
// In production, use a proper database
const db = {
  authorizationCodes: new Map(),
  accessTokens: new Map(),
  clients: new Map([
    ['example-client-id', {
      clientId: '7b2e685bf08b5cb99c36518619c024c1ed1333e8f4eaae4ef5c5d4e29ca0b70e7dcf21e0fa08a0b29b076e9d5cd420cce6eba1f4f433e906cdc6c743907ef696',
      clientSecret: '4f70c91e5390f5b0fd9bbc28e5b9f9ad8f9341ac5c42ad33f295387333eb10106555fa52957427c01038bcfc05264f8b895422fd8d01ca1448b3c16c5d9bd6aa',
      redirectUris: ['https://extensionesign-server.vercel.app/callback']
    }]
  ])
};

module.exports = db;
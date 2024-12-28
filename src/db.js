// In-memory storage for demo purposes
// In production, use a proper database
const db = {
  authorizationCodes: new Map(),
  accessTokens: new Map(),
  refreshTokens: new Map(),
  clients: new Map([
    ['7b2e685bf08b5cb99c36518619c024c1ed1333e8f4eaae4ef5c5d4e29ca0b70e7dcf21e0fa08a0b29b076e9d5cd420cce6eba1f4f433e906cdc6c743907ef696', {
      clientId: '7b2e685bf08b5cb99c36518619c024c1ed1333e8f4eaae4ef5c5d4e29ca0b70e7dcf21e0fa08a0b29b076e9d5cd420cce6eba1f4f433e906cdc6c743907ef696',
      clientSecret: '4f70c91e5390f5b0fd9bbc28e5b9f9ad8f9341ac5c42ad33f295387333eb10106555fa52957427c01038bcfc05264f8b895422fd8d01ca1448b3c16c5d9bd6aa',
      redirectUris: [
        'https://extensionesign-server.vercel.app/callback',
        'http://localhost:3000/callback',
        'https://oauth.pstmn.io/v1/callback',
        'https://demo.services.docusign.net/act-gateway/v1.0/oauth/callback'
      ]
    }]
  ]),
  archives: new Map(),

  // Token management methods
  storeAccessToken(token, data) {
    this.accessTokens.set(token, {
      ...data,
      created: Date.now()
    });
    return true;
  },

  getAccessToken(token) {
    const tokenData = this.accessTokens.get(token);
    if (!tokenData) return null;
    
    // Check if token is expired
    const expiresAt = tokenData.created + (tokenData.expiresIn * 1000);
    if (Date.now() > expiresAt) {
      this.accessTokens.delete(token);
      return null;
    }
    
    return tokenData;
  },

  storeRefreshToken(token, data) {
    this.refreshTokens.set(token, {
      ...data,
      created: Date.now()
    });
    return true;
  },

  getRefreshToken(token) {
    return this.refreshTokens.get(token);
  },

  revokeToken(token) {
    this.accessTokens.delete(token);
    this.refreshTokens.delete(token);
    return true;
  }
};

module.exports = db;
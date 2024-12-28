const Redis = require('ioredis');

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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
  async storeAccessToken(token, data) {
    try {
      await redis.set(
        `access_token:${token}`,
        JSON.stringify({
          ...data,
          created: Date.now()
        }),
        'EX',
        data.expiresIn
      );
      return true;
    } catch (error) {
      console.error('Redis store access token error:', error);
      // Fallback to in-memory storage
      this.accessTokens.set(token, {
        ...data,
        created: Date.now()
      });
      return true;
    }
  },

  async getAccessToken(token) {
    try {
      const data = await redis.get(`access_token:${token}`);
      if (!data) return null;
      
      const tokenData = JSON.parse(data);
      const expiresAt = tokenData.created + (tokenData.expiresIn * 1000);
      
      if (Date.now() > expiresAt) {
        await redis.del(`access_token:${token}`);
        return null;
      }
      
      return tokenData;
    } catch (error) {
      console.error('Redis get access token error:', error);
      // Fallback to in-memory storage
      return this.accessTokens.get(token);
    }
  },

  async storeRefreshToken(token, data) {
    try {
      await redis.set(
        `refresh_token:${token}`,
        JSON.stringify({
          ...data,
          created: Date.now()
        }),
        'EX',
        data.expiresIn
      );
      return true;
    } catch (error) {
      console.error('Redis store refresh token error:', error);
      // Fallback to in-memory storage
      this.refreshTokens.set(token, {
        ...data,
        created: Date.now()
      });
      return true;
    }
  },

  async getRefreshToken(token) {
    try {
      const data = await redis.get(`refresh_token:${token}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Redis get refresh token error:', error);
      // Fallback to in-memory storage
      return this.refreshTokens.get(token);
    }
  },

  async revokeToken(token) {
    try {
      await Promise.all([
        redis.del(`access_token:${token}`),
        redis.del(`refresh_token:${token}`)
      ]);
      return true;
    } catch (error) {
      console.error('Redis revoke token error:', error);
      // Fallback to in-memory storage
      this.accessTokens.delete(token);
      this.refreshTokens.delete(token);
      return true;
    }
  }
};

module.exports = db;
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./db');
const { generateAuthorizationCode, generateAccessToken, validateClient } = require('./utils');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const clients = new Map([
  ['7b2e685bf08b5cb99c36518619c024c1ed1333e8f4eaae4ef5c5d4e29ca0b70e7dcf21e0fa08a0b29b076e9d5cd420cce6eba1f4f433e906cdc6c743907ef696', {
    clientId: '7b2e685bf08b5cb99c36518619c024c1ed1333e8f4eaae4ef5c5d4e29ca0b70e7dcf21e0fa08a0b29b076e9d5cd420cce6eba1f4f433e906cdc6c743907ef696',
    clientSecret: '4f70c91e5390f5b0fd9bbc28e5b9f9ad8f9341ac5c42ad33f295387333eb10106555fa52957427c01038bcfc05264f8b895422fd8d01ca1448b3c16c5d9bd6aa',
    redirectUris: [
      'https://extensionesign-server.vercel.app/callback',
      'http://localhost:3000/callback',
      'https://oauth.pstmn.io/v1/callback'
    ]
  }]
]);

// Authorization endpoint
app.get('/oauth2/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // Validate client and redirect URI
  const client = db.clients.get(client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  // Generate authorization code
  const code = generateAuthorizationCode();
  
  // Store the authorization code with associated data
  db.authorizationCodes.set(code, {
    clientId: client_id,
    scope,
    expiresAt: Date.now() + (config.authorizationCodeExpiration * 1000)
  });

  // Redirect back to client with code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', code);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
});

// Token endpoint
app.post('/oauth2/token', (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  // Validate client credentials
  if (!validateClient(client_id, client_secret)) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  if (grant_type === 'authorization_code') {
    // Validate authorization code
    const codeData = db.authorizationCodes.get(code);
    if (!codeData || 
        codeData.clientId !== client_id || 
        Date.now() > codeData.expiresAt) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // Generate access token
    const accessToken = generateAccessToken(client_id, codeData.scope);

    // Store token
    db.accessTokens.set(accessToken, {
      clientId: client_id,
      scope: codeData.scope,
      expiresAt: Date.now() + (config.accessTokenExpiration * 1000)
    });

    // Remove used authorization code
    db.authorizationCodes.delete(code);

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: config.accessTokenExpiration,
      scope: codeData.scope
    });
  }

  res.status(400).json({ error: 'unsupported_grant_type' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth 2.0 server running on port ${PORT}`);
});
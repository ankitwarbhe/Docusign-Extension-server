const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./db');
const { generateAuthorizationCode, generateAccessToken, validateClient } = require('./utils');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Authorization endpoint with debug logging
app.get('/oauth2/authorize', (req, res) => {
  console.log('Received authorize request:', req.query);
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // Validate client and redirect URI
  const client = db.clients.get(client_id);
  console.log('Found client:', client ? 'yes' : 'no');
  console.log('Redirect URI valid:', client && client.redirectUris.includes(redirect_uri) ? 'yes' : 'no');
  
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    console.log('Invalid client or redirect URI');
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

module.exports = app;
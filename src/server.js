const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./db');
const { generateAuthorizationCode, generateAccessToken, validateClient } = require('./utils');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);
  next();
});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Root route for testing
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    routes: ['/oauth2/authorize', '/oauth2/token']
  });
});

// Authorization endpoint with debug logging
app.get('/oauth2/authorize', (req, res) => {
  try {
    console.log('Authorize endpoint accessed');
    console.log('Query parameters:', req.query);
    
    const { client_id, redirect_uri, response_type, scope, state } = req.query;

    if (!client_id || !redirect_uri || !response_type) {
      console.log('Missing required parameters');
      return res.status(400).json({ 
        error: 'invalid_request',
        missing_params: {
          client_id: !client_id,
          redirect_uri: !redirect_uri,
          response_type: !response_type
        }
      });
    }

    // Validate client and redirect URI
    const client = db.clients.get(client_id);
    console.log('Client lookup result:', {
      clientFound: !!client,
      validRedirectUri: client?.redirectUris.includes(redirect_uri)
    });
    
    if (!client || !client.redirectUris.includes(redirect_uri)) {
      console.log('Invalid client or redirect URI');
      return res.status(400).json({ 
        error: 'invalid_client',
        details: {
          client_exists: !!client,
          valid_redirect_uri: client?.redirectUris.includes(redirect_uri)
        }
      });
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
  } catch (error) {
    console.error('Error in authorize endpoint:', error);
    res.status(500).json({ error: 'server_error', message: error.message });
  }
});

// Token endpoint
app.post('/oauth2/token', (req, res) => {
  try {
    console.log('Token endpoint accessed');
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body:', req.body);
    console.log('Raw request body:', req.rawBody);
    
    const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

    console.log('Parsed parameters:', {
      grant_type,
      code,
      client_id,
      client_secret: client_secret ? '[REDACTED]' : undefined,
      redirect_uri
    });

    // Check for required parameters
    if (!grant_type || !client_id || !client_secret) {
      console.log('Missing required parameters:', {
        grant_type: !grant_type,
        client_id: !client_id,
        client_secret: !client_secret
      });
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters',
        missing_params: {
          grant_type: !grant_type,
          client_id: !client_id,
          client_secret: !client_secret,
          code: grant_type === 'authorization_code' && !code,
          redirect_uri: grant_type === 'authorization_code' && !redirect_uri
        }
      });
    }

    // Validate client credentials
    const client = db.clients.get(client_id);
    console.log('Client validation:', {
      clientExists: !!client,
      secretMatches: client?.clientSecret === client_secret,
      clientId
    });

    if (!client || client.clientSecret !== client_secret) {
      return res.status(401).json({ 
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    if (grant_type === 'authorization_code') {
      // Validate authorization code
      const codeData = db.authorizationCodes.get(code);
      console.log('Authorization code validation:', {
        codeExists: !!codeData,
        clientMatches: codeData?.clientId === client_id,
        notExpired: codeData && Date.now() <= codeData.expiresAt,
        code,
        storedCodes: Array.from(db.authorizationCodes.keys())
      });

      if (!codeData || 
          codeData.clientId !== client_id || 
          Date.now() > codeData.expiresAt) {
        return res.status(400).json({ 
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code'
        });
      }

      // Generate access token
      const accessToken = generateAccessToken(client_id, codeData.scope);
      console.log('Generated access token');

      // Store token
      db.accessTokens.set(accessToken, {
        clientId: client_id,
        scope: codeData.scope,
        expiresAt: Date.now() + (config.accessTokenExpiration * 1000)
      });

      // Remove used authorization code
      db.authorizationCodes.delete(code);

      const response = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: config.accessTokenExpiration,
        scope: codeData.scope
      };
      console.log('Sending response:', { ...response, access_token: '[REDACTED]' });
      return res.json(response);
    }

    return res.status(400).json({ 
      error: 'unsupported_grant_type',
      error_description: 'Only authorization_code grant type is supported'
    });
  } catch (error) {
    console.error('Error in token endpoint:', error);
    res.status(500).json({ 
      error: 'server_error', 
      error_description: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'server_error', 
    message: err.message,
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    error: 'not_found',
    message: 'The requested resource was not found',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth 2.0 server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /');
  console.log('- GET  /oauth2/authorize');
  console.log('- POST /oauth2/token');
});

module.exports = app;
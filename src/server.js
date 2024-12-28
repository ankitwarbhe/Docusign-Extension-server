const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const config = require('./config');
const db = require('./db');
const { generateAuthorizationCode, generateAccessToken, generateRefreshToken, validateClient } = require('./utils');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);
  if (req.body) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
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
    
    let client_id, client_secret;
    
    // Check for Basic auth
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
      console.log('Found Basic auth header');
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      [client_id, client_secret] = credentials.split(':');
      console.log('Extracted client_id from Basic auth');
    } else {
      // Fall back to body parameters
      client_id = req.body.client_id;
      client_secret = req.body.client_secret;
    }

    const { grant_type, code, redirect_uri } = req.body;

    console.log('Parsed parameters:', {
      grant_type,
      code,
      client_id: client_id ? '[PRESENT]' : undefined,
      client_secret: client_secret ? '[PRESENT]' : undefined,
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
      client_id: client_id ? '[PRESENT]' : undefined
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
        providedCode: code,
        storedCodes: Array.from(db.authorizationCodes.keys()),
        storedData: codeData ? {
          clientId: codeData.clientId,
          scope: codeData.scope,
          expiresAt: new Date(codeData.expiresAt).toISOString()
        } : null,
        currentTime: new Date().toISOString()
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

      // Generate refresh token if offline access was requested
      const refreshToken = generateRefreshToken(client_id, codeData.scope);
      console.log('Generated refresh token');

      // Store tokens
      db.accessTokens.set(accessToken, {
        clientId: client_id,
        scope: codeData.scope,
        expiresAt: Date.now() + (config.accessTokenExpiration * 1000)
      });

      // Store refresh token
      db.refreshTokens = db.refreshTokens || new Map();
      db.refreshTokens.set(refreshToken, {
        clientId: client_id,
        scope: codeData.scope,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      });

      // Remove used authorization code
      db.authorizationCodes.delete(code);

      const response = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: config.accessTokenExpiration,
        scope: codeData.scope,
        refresh_token: refreshToken
      };
      console.log('Sending response:', { 
        ...response, 
        access_token: '[REDACTED]',
        refresh_token: '[REDACTED]'
      });
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

// SpecifiedArchive endpoint
app.post('/api/specified-archive', async (req, res) => {
  try {
    console.log('SpecifiedArchive endpoint accessed');
    console.log('Request headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Verify Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Missing or invalid authorization token'
      });
    }

    const token = authHeader.split(' ')[1];
    const tokenData = db.accessTokens.get(token);
    console.log('Token validation:', {
      tokenExists: !!tokenData,
      notExpired: tokenData && Date.now() <= tokenData.expiresAt
    });

    if (!tokenData || Date.now() > tokenData.expiresAt) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Token expired or invalid'
      });
    }

    // Validate request body
    const { files, order, overwrite, parent, metadata } = req.body;
    console.log('Parsed request body:', {
      filesCount: files?.length,
      order,
      overwrite,
      parent,
      hasMetadata: !!metadata
    });
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Files array is required and must not be empty'
      });
    }

    // Validate each file object
    const invalidFiles = files.filter(file => 
      !file.name || !file.content || !file.contentType || !file.path
    );

    if (invalidFiles.length > 0) {
      console.log('Invalid files found:', invalidFiles.map(f => f.name));
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Each file must have name, content, contentType, and path',
        invalid_files: invalidFiles.map(f => f.name)
      });
    }

    // Process the archive request
    const archiveId = crypto.randomBytes(16).toString('hex');
    console.log('Generated archive ID:', archiveId);

    const processedFiles = files.map(file => ({
      ...file,
      id: crypto.randomBytes(8).toString('hex'),
      status: 'processed',
      timestamp: new Date().toISOString()
    }));

    // Store the archive data
    db.archives = db.archives || new Map();
    const archiveData = {
      id: archiveId,
      files: processedFiles,
      order: order || 0,
      overwrite: overwrite || false,
      parent: parent,
      metadata: metadata || {},
      status: 'completed',
      createdAt: new Date().toISOString(),
      userId: tokenData.clientId
    };
    db.archives.set(archiveId, archiveData);
    console.log('Stored archive data with ID:', archiveId);

    // Return success response
    const response = {
      id: archiveId,
      files: processedFiles,
      status: 'completed',
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };
    console.log('Sending response for archive:', archiveId);
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in SpecifiedArchive endpoint:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred while processing the archive',
      message: error.message,
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
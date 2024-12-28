const { Router } = require('express');
const { generateAuthorizationCode, generateAccessToken, generateRefreshToken } = require('../utils');
const db = require('../db');
const config = require('../config');
const Paths = require('../constants/paths');

const router = Router();

router.get(Paths.Auth.Authorize.Get, (req, res) => {
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

router.post(Paths.Auth.Token.Post, async (req, res) => {
  try {
    console.log('Token endpoint accessed');
    console.log('Request headers:', req.headers);
    
    let client_id, client_secret;
    
    // Check for Basic auth
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
      console.log('Found Basic auth header');
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      [client_id, client_secret] = credentials.split(':');
      console.log('Extracted client credentials from Basic auth');
    } else {
      // Fall back to body parameters
      client_id = req.body.client_id;
      client_secret = req.body.client_secret;
    }

    const { grant_type, code, redirect_uri } = req.body;

    // Validate client credentials
    const client = db.clients.get(client_id);
    if (!client || client.clientSecret !== client_secret) {
      return res.status(401).json({ 
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    if (grant_type === 'authorization_code') {
      // Validate authorization code
      const codeData = db.authorizationCodes.get(code);
      if (!codeData || 
          codeData.clientId !== client_id || 
          Date.now() > codeData.expiresAt) {
          return res.status(400).json({ 
            error: 'invalid_grant',
            error_description: 'Invalid or expired authorization code'
          });
      }

      // Generate tokens
      const accessToken = generateAccessToken(client_id, codeData.scope);
      const refreshToken = generateRefreshToken(client_id, codeData.scope);

      // Store tokens
      await db.storeAccessToken(accessToken, {
        clientId: client_id,
        scope: codeData.scope,
        expiresIn: config.accessTokenExpiration
      });

      await db.storeRefreshToken(refreshToken, {
        clientId: client_id,
        scope: codeData.scope,
        expiresIn: 30 * 24 * 60 * 60 // 30 days
      });

      // Remove used authorization code
      db.authorizationCodes.delete(code);

      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: config.accessTokenExpiration,
        scope: codeData.scope
      });
    } else if (grant_type === 'refresh_token') {
      const refresh_token = req.body.refresh_token;
      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Refresh token is required'
        });
      }

      // Validate refresh token
      const refreshTokenData = await db.getRefreshToken(refresh_token);
      if (!refreshTokenData || refreshTokenData.clientId !== client_id) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const accessToken = generateAccessToken(client_id, refreshTokenData.scope);
      
      // Store new access token
      await db.storeAccessToken(accessToken, {
        clientId: client_id,
        scope: refreshTokenData.scope,
        expiresIn: config.accessTokenExpiration
      });

      return res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: config.accessTokenExpiration,
        scope: refreshTokenData.scope
      });
    }

    return res.status(400).json({ 
      error: 'unsupported_grant_type',
      error_description: 'Supported grant types: authorization_code, refresh_token'
    });
  } catch (error) {
    console.error('Error in token endpoint:', error);
    res.status(500).json({ 
      error: 'server_error', 
      error_description: error.message
    });
  }
});

module.exports = router; 
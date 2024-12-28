const express = require('express');
const bodyParser = require('body-parser');
const { expressjwt: jwt } = require('express-jwt');
const { validationResult, checkSchema } = require('express-validator');
const config = require('./config');
const apiRouter = require('./api.router');
const authRouter = require('./controllers/auth.controller');

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

// Parse URL-encoded bodies and JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    routes: ['/oauth2/*', '/api/verify/*', '/api/auth/*']
  });
});

// Mount routers
app.use('/api', apiRouter);
// Support both /oauth2 and /api/auth paths for OAuth endpoints
app.use('/oauth2', authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }
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

module.exports = app;
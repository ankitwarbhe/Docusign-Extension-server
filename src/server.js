const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const { validationResult, checkSchema } = require('express-validator');
const config = require('./config');

const app = express();
const router = express.Router();

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

// JWT authentication middleware
const authenticateJWT = jwt.expressjwt({
  secret: process.env.JWT_SECRET_KEY || config.jwtSecret,
  algorithms: ['HS256']
});

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

// Validation schemas
const validationSchemas = {
  bankAccountOwner: {
    accountNumber: { exists: true, errorMessage: 'Account number is required' },
    accountType: { isIn: { options: [['checking', 'savings']], errorMessage: 'Account type must be checking or savings' } },
    routingNumber: { exists: true, errorMessage: 'Routing number is required' },
    firstName: { exists: true, errorMessage: 'First name is required' },
    lastName: { exists: true, errorMessage: 'Last name is required' }
  },
  bankAccount: {
    accountNumber: { exists: true, errorMessage: 'Account number is required' },
    accountType: { isIn: { options: [['checking', 'savings']], errorMessage: 'Account type must be checking or savings' } },
    routingNumber: { exists: true, errorMessage: 'Routing number is required' }
  },
  email: {
    email: { exists: true, isEmail: true, errorMessage: 'Invalid email format.' }
  },
  businessFEIN: {
    businessName: { exists: true, errorMessage: 'Business name is required' },
    fein: { exists: true, errorMessage: 'FEIN is required' }
  },
  phoneNumber: {
    region: { exists: true, errorMessage: 'Region is required' },
    phoneNumber: { exists: true, errorMessage: 'Phone number is required' }
  },
  ssn: {
    socialSecurityNumber: { exists: true, errorMessage: 'SSN is required' },
    firstName: { exists: true, errorMessage: 'First name is required' },
    lastName: { exists: true, errorMessage: 'Last name is required' },
    dateOfBirth: { exists: true, isISO8601: true, errorMessage: 'Date of birth must be in ISO 8601 format' }
  },
  postalAddress: {
    street1: { exists: true, errorMessage: 'Street1 is required' },
    locality: { exists: true, errorMessage: 'Locality is required' },
    postalCode: { exists: true, errorMessage: 'Postal code is required' },
    countryOrRegion: { exists: true, errorMessage: 'Country or region is required' },
    subdivision: { exists: true, errorMessage: 'Subdivision is required' }
  }
};

// Sample databases remain the same...

// Verification endpoints
router.post('/verifyBankAccountOwner', 
  authenticateJWT,
  checkSchema(validationSchemas.bankAccountOwner),
  validateRequest,
  async (req, res) => {
    try {
      const { accountNumber, routingNumber, accountType, firstName, lastName } = req.body;
      const accountFound = SAMPLE_BANK_ACCOUNTS.find(acc => 
        acc.accountNumber === accountNumber && 
        acc.routingNumber === routingNumber && 
        acc.accountType === accountType
      );
      if (!accountFound) {
        throw new Error("No match found for provided bank account details");
      }
      return res.json({ verified: true });
    } catch (err) {
      return res.json({ verified: false, verifyFailureReason: err.message });
    }
  }
);

// Add other verification endpoints following the same pattern...

// Mount the router
app.use('/api', router);

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
module.exports = app;
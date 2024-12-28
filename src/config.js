const config = {
  // OAuth settings
  authorizationCodeExpiration: 600, // 10 minutes
  accessTokenExpiration: 3600, // 1 hour
  jwtSecret: process.env.JWT_SECRET || 'bc97aeda1a6e78c3c806461dae5958564ac22191932cf6c5e0f26f7470296e328f1509dbffcf9762a94313bc49c63197544ef95ab774d9647bd084d2d2fd82f9',

  // Database configuration
  database: {
    supabase: {
      tables: {
        students: {
          name: process.env.SUPABASE_STUDENTS_TABLE || 'students',
          columns: {
            id: process.env.SUPABASE_STUDENTS_ID_COLUMN || 'id',
            email: process.env.SUPABASE_STUDENTS_EMAIL_COLUMN || 'emails'
          }
        }
      }
    }
  },

  // Email verification settings
  emailVerification: {
    // Email format validation
    validation: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMessage: 'Invalid email format'
    },

    // Redis storage settings
    storage: {
      prefix: 'verified_email:',
      expirationSeconds: 24 * 60 * 60  // 24 hours
    },

    // Response messages
    messages: {
      success: 'Email verified successfully',
      notFound: 'Email not found in students database',
      invalidFormat: 'Invalid email format',
      databaseError: 'Error checking email in database',
      storageError: 'Failed to store email verification',
      invalidToken: 'Token expired or invalid',
      missingToken: 'Missing or invalid authorization token',
      invalidBody: 'Invalid request body format',
      missingEmail: 'Email is required and must be a string'
    }
  }
};

module.exports = config;
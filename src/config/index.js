const config = {
  database: {
    supabase: {
      tables: {
        students: {
          name: 'students',
          columns: {
            id: 'id',
            email: 'emails'  // Column name in Supabase is 'emails'
          }
        }
      }
    }
  },
  emailVerification: {
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    messages: {
      invalidFormat: "Invalid email format.",
      databaseError: "Error checking email in database",
      notFound: "No match found for provided email details",
      storageError: "Failed to store verification details"
    },
    storage: {
      prefix: 'email_verification_'
    }
  }
};

module.exports = config; 
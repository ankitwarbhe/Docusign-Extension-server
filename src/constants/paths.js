const Paths = {
  Verify: {
    Base: '/verify',
    BankAccountOwner: {
      Post: '/bankAccountOwner'
    },
    BankAccount: {
      Post: '/bankAccount'
    },
    Email: {
      Post: '/email'
    },
    BusinessFEIN: {
      Post: '/businessFEIN'
    },
    PhoneNumber: {
      Post: '/phoneNumber'
    },
    SSN: {
      Post: '/ssn'
    },
    PostalAddress: {
      Post: '/postalAddress'
    },
    TypeaheadAddress: {
      Post: '/typeaheadAddress'
    }
  },
  Auth: {
    Base: '/auth',
    Authorize: {
      Get: '/authorize'
    },
    Token: {
      Post: '/token'
    }
  }
};

module.exports = Paths; 
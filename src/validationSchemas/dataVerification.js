const bankAccountOwnerBody = {
  accountNumber: { isString: true },
  accountType: { isIn: { options: [['checking', 'savings']] } },
  routingNumber: { isString: true },
  firstName: { isString: true },
  lastName: { isString: true }
};

const bankAccountBody = {
  accountNumber: { isString: true },
  accountType: { isIn: { options: [['checking', 'savings']] } },
  routingNumber: { isString: true }
};

const emailBody = {
  email: { isString: true }
};

const businessFEINBody = {
  businessName: { isString: true },
  fein: { isString: true }
};

const phoneNumberBody = {
  region: { isString: true },
  phoneNumber: { isString: true }
};

const ssnBody = {
  socialSecurityNumber: { isString: true },
  firstName: { isString: true },
  lastName: { isString: true },
  dateOfBirth: { isString: true }
};

const postalAddressBody = {
  street1: { isString: true },
  street2: { isString: true, optional: true },
  locality: { isString: true },
  postalCode: { isString: true },
  countryOrRegion: { isString: true },
  subdivision: { isString: true }
};

module.exports = {
  bankAccountOwnerBody,
  bankAccountBody,
  emailBody,
  businessFEINBody,
  phoneNumberBody,
  ssnBody,
  postalAddressBody
}; 
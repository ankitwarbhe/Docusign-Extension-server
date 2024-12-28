const supabase = require('../supabase');
const config = require('../config');
const db = require('../db');

// Sample databases for verification
const SAMPLE_BANK_ACCOUNTS = [
  {
    accountNumber: '1234567890',
    accountType: 'checking',
    routingNumber: '987654321',
    firstName: 'John',
    lastName: 'Doe'
  }
];

const SAMPLE_BUSINESS_FEINS = [
  {
    businessName: 'VistaPeak Ventures',
    fein: '11-1111111'
  }
];

const SAMPLE_PHONE_NUMBERS = [
  {
    region: 'US',
    phoneNumber: '1234567890'
  }
];

const SAMPLE_SSNS = [
  {
    socialSecurityNumber: '123-45-6789',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01'
  }
];

const SAMPLE_ADDRESSES = [
  {
    street1: '123 Main St',
    street2: 'Apt 4B',
    locality: 'San Francisco',
    postalCode: '94105',
    countryOrRegion: 'US',
    subdivision: 'CA'
  }
];

// Verification functions
const verifyBankAccountOwner = async (req, res) => {
  try {
    const { accountNumber, routingNumber, accountType, firstName, lastName } = req.body;
    const accountFound = SAMPLE_BANK_ACCOUNTS.find(acc => 
      acc.accountNumber === accountNumber && 
      acc.routingNumber === routingNumber && 
      acc.accountType === accountType &&
      acc.firstName === firstName &&
      acc.lastName === lastName
    );
    if (!accountFound) {
      throw new Error("No match found for provided bank account owner details");
    }
    return res.json({ verified: true });
  } catch (err) {
    return res.json({ verified: false, verifyFailureReason: err.message });
  }
};

const verifyBankAccount = async (req, res) => {
  try {
    const { accountNumber, routingNumber, accountType } = req.body;
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
};

const verifyEmail = async (req, res) => {
  const { email } = req.body;
  try {
    // Regular expression to check if the email is in a valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format.");
    }

    // Check if the email exists in Supabase students table
    const { data: students, error } = await supabase
      .from('students')
      .select('id, emails')
      .eq('emails', email);

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error("Error checking email in database");
    }

    if (!students || students.length === 0) {
      throw new Error("No match found for provided email details");
    }

    const student = students[0];

    // Store verification in Redis for future reference
    const verificationId = `${email}_${Date.now()}`;
    await db.storeVerifiedEmail(verificationId, {
      email,
      studentId: student.id
    });

    return res.json({ verified: true });
  } catch (err) {
    console.error(`Encountered an error verifying email: ${err.message}`);
    return res.json({
      verified: false,
      verifyFailureReason: err.message
    });
  }
};

const verifyBusinessFEIN = async (req, res) => {
  try {
    const { businessName, fein } = req.body;
    const businessFound = SAMPLE_BUSINESS_FEINS.find(business => 
      business.businessName === businessName && 
      business.fein === fein
    );
    if (!businessFound) {
      throw new Error("No match found for provided business FEIN details");
    }
    return res.json({ verified: true });
  } catch (err) {
    return res.json({ verified: false, verifyFailureReason: err.message });
  }
};

const verifyPhoneNumber = async (req, res) => {
  try {
    const { region, phoneNumber } = req.body;
    const phoneFound = SAMPLE_PHONE_NUMBERS.find(phone => 
      phone.region === region && 
      phone.phoneNumber === phoneNumber
    );
    if (!phoneFound) {
      throw new Error("No match found for provided phone number details");
    }
    return res.json({ verified: true });
  } catch (err) {
    return res.json({ verified: false, verifyFailureReason: err.message });
  }
};

const verifySSN = async (req, res) => {
  try {
    const { socialSecurityNumber, firstName, lastName, dateOfBirth } = req.body;
    const ssnFound = SAMPLE_SSNS.find(ssn => 
      ssn.socialSecurityNumber === socialSecurityNumber && 
      ssn.firstName === firstName &&
      ssn.lastName === lastName &&
      ssn.dateOfBirth === dateOfBirth
    );
    if (!ssnFound) {
      throw new Error("No match found for provided SSN details");
    }
    return res.json({ verified: true });
  } catch (err) {
    return res.json({ verified: false, verifyFailureReason: err.message });
  }
};

const verifyPostalAddress = async (req, res) => {
  try {
    const { street1, street2, locality, postalCode, countryOrRegion, subdivision } = req.body;
    const addressFound = SAMPLE_ADDRESSES.find(addr => 
      addr.street1 === street1 &&
      (!street2 || addr.street2 === street2) &&
      addr.locality === locality &&
      addr.postalCode === postalCode &&
      addr.countryOrRegion === countryOrRegion &&
      addr.subdivision === subdivision
    );
    if (!addressFound) {
      throw new Error("No match found for provided postal address details");
    }
    return res.json({ 
      verified: true,
      verifiedAddress: addressFound
    });
  } catch (err) {
    return res.json({ verified: false, verifyFailureReason: err.message });
  }
};

const verifyTypeaheadPostalAddress = async (req, res) => {
  try {
    const { street1, street2, locality, postalCode, countryOrRegion, subdivision } = req.body;
    const suggestions = SAMPLE_ADDRESSES.filter(addr => 
      addr.street1.includes(street1) &&
      (!street2 || addr.street2.includes(street2)) &&
      addr.locality.includes(locality) &&
      addr.postalCode.includes(postalCode) &&
      addr.countryOrRegion === countryOrRegion &&
      addr.subdivision === subdivision
    );
    return res.json({ suggestions });
  } catch (err) {
    return res.json({ failureReason: err.message });
  }
};

module.exports = {
  verifyBankAccountOwner,
  verifyBankAccount,
  verifyEmail,
  verifyBusinessFEIN,
  verifyPhoneNumber,
  verifySSN,
  verifyPostalAddress,
  verifyTypeaheadPostalAddress
}; 
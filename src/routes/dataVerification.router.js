const { Router } = require('express');
const { expressjwt: jwt } = require('express-jwt');
const { checkSchema } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const config = require('../config');

const {
  verifyBankAccountOwner,
  verifyBankAccount,
  verifyEmail,
  verifyBusinessFEIN,
  verifyPhoneNumber,
  verifySSN,
  verifyPostalAddress,
  verifyTypeaheadPostalAddress
} = require('../services/verification.service');

const {
  bankAccountOwnerBody,
  bankAccountBody,
  emailBody,
  businessFEINBody,
  phoneNumberBody,
  ssnBody,
  postalAddressBody
} = require('../validationSchemas/dataVerification');

const router = Router();

// JWT authentication middleware
const authenticateJWT = jwt({
  secret: process.env.JWT_SECRET_KEY || config.jwtSecret,
  algorithms: ['HS256']
});

router.post(
  '/bankAccountOwner',
  authenticateJWT,
  checkSchema(bankAccountOwnerBody, ['body']),
  validateRequest,
  verifyBankAccountOwner
);

router.post(
  '/bankAccount',
  authenticateJWT,
  checkSchema(bankAccountBody, ['body']),
  validateRequest,
  verifyBankAccount
);

router.post(
  '/email',
  authenticateJWT,
  checkSchema(emailBody, ['body']),
  validateRequest,
  verifyEmail
);

router.post(
  '/businessFEIN',
  authenticateJWT,
  checkSchema(businessFEINBody, ['body']),
  validateRequest,
  verifyBusinessFEIN
);

router.post(
  '/phoneNumber',
  authenticateJWT,
  checkSchema(phoneNumberBody, ['body']),
  validateRequest,
  verifyPhoneNumber
);

router.post(
  '/ssn',
  authenticateJWT,
  checkSchema(ssnBody, ['body']),
  validateRequest,
  verifySSN
);

router.post(
  '/postalAddress',
  authenticateJWT,
  checkSchema(postalAddressBody, ['body']),
  validateRequest,
  verifyPostalAddress
);

router.post(
  '/typeaheadAddress',
  authenticateJWT,
  checkSchema(postalAddressBody, ['body']),
  validateRequest,
  verifyTypeaheadPostalAddress
);

module.exports = router; 
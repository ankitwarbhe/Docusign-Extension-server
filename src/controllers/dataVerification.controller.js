const { Router } = require('express');
const { expressjwt: jwt } = require('express-jwt');
const { checkSchema } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const config = require('../config');
const Paths = require('../constants/paths');

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
  secret: config.jwtSecret,
  algorithms: ['HS256']
});

router.post(
  Paths.Verify.BankAccountOwner.Post,
  authenticateJWT,
  checkSchema(bankAccountOwnerBody, ['body']),
  validateRequest,
  verifyBankAccountOwner
);

router.post(
  Paths.Verify.BankAccount.Post,
  authenticateJWT,
  checkSchema(bankAccountBody, ['body']),
  validateRequest,
  verifyBankAccount
);

router.post(
  Paths.Verify.Email.Post,
  authenticateJWT,
  checkSchema(emailBody, ['body']),
  validateRequest,
  verifyEmail
);

router.post(
  Paths.Verify.BusinessFEIN.Post,
  authenticateJWT,
  checkSchema(businessFEINBody, ['body']),
  validateRequest,
  verifyBusinessFEIN
);

router.post(
  Paths.Verify.PhoneNumber.Post,
  authenticateJWT,
  checkSchema(phoneNumberBody, ['body']),
  validateRequest,
  verifyPhoneNumber
);

router.post(
  Paths.Verify.SSN.Post,
  authenticateJWT,
  checkSchema(ssnBody, ['body']),
  validateRequest,
  verifySSN
);

router.post(
  Paths.Verify.PostalAddress.Post,
  authenticateJWT,
  checkSchema(postalAddressBody, ['body']),
  validateRequest,
  verifyPostalAddress
);

router.post(
  Paths.Verify.TypeaheadAddress.Post,
  authenticateJWT,
  checkSchema(postalAddressBody, ['body']),
  validateRequest,
  verifyTypeaheadPostalAddress
);

module.exports = router; 
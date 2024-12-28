# DocuSign Extension Server

A Node.js server that provides data verification services for DocuSign extensions. This server implements various verification endpoints for validating emails, bank accounts, business FEINs, phone numbers, SSNs, and postal addresses.

## Features

- OAuth2 authentication flow
- Email verification with Supabase integration
- Bank account and owner verification
- Business FEIN verification
- Phone number verification
- SSN verification
- Postal address verification with typeahead support
- Redis-based token and verification storage

## Prerequisites

- Node.js (v14 or higher)
- Redis server
- Supabase account and project
- Environment variables configured

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000
JWT_SECRET=your_jwt_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_STUDENTS_TABLE=students
SUPABASE_STUDENTS_ID_COLUMN=id
SUPABASE_STUDENTS_EMAIL_COLUMN=emails

# Redis
REDIS_URL=your_redis_url
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/docusign-extension-server.git
cd docusign-extension-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

## API Documentation

### OAuth2 Endpoints

#### Authorization
```
GET /oauth2/authorize
```
Initiates the OAuth2 authorization flow.

#### Token Exchange
```
POST /oauth2/token
```
Exchanges authorization code for access and refresh tokens.

### Verification Endpoints

All verification endpoints require a valid Bearer token in the Authorization header.

#### Email Verification
```
POST /api/verify/email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Bank Account Owner Verification
```
POST /api/verify/bankAccountOwner
Content-Type: application/json

{
  "accountNumber": "1234567890",
  "routingNumber": "987654321",
  "accountType": "checking",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Bank Account Verification
```
POST /api/verify/bankAccount
Content-Type: application/json

{
  "accountNumber": "1234567890",
  "routingNumber": "987654321",
  "accountType": "checking"
}
```

#### Business FEIN Verification
```
POST /api/verify/businessFEIN
Content-Type: application/json

{
  "businessName": "VistaPeak Ventures",
  "fein": "11-1111111"
}
```

#### Phone Number Verification
```
POST /api/verify/phoneNumber
Content-Type: application/json

{
  "region": "US",
  "phoneNumber": "1234567890"
}
```

#### SSN Verification
```
POST /api/verify/ssn
Content-Type: application/json

{
  "socialSecurityNumber": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01"
}
```

#### Postal Address Verification
```
POST /api/verify/postalAddress
Content-Type: application/json

{
  "street1": "123 Main St",
  "street2": "Apt 4B",
  "locality": "San Francisco",
  "postalCode": "94105",
  "countryOrRegion": "US",
  "subdivision": "CA"
}
```

#### Typeahead Postal Address
```
POST /api/verify/typeaheadPostalAddress
Content-Type: application/json

{
  "street1": "123",
  "locality": "San",
  "postalCode": "941",
  "countryOrRegion": "US",
  "subdivision": "CA"
}
```

### Response Format

All verification endpoints return responses in the following format:

```json
{
  "verified": true|false,
  "verifyFailureReason": "Error message if verification fails"
}
```

## Error Handling

The server implements comprehensive error handling for:
- Invalid request formats
- Authentication failures
- Database errors
- Validation errors
- Storage errors

## Security

- JWT-based authentication
- Request validation using express-validator
- Secure token storage in Redis
- Environment variable configuration
- CORS protection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
const config = {
  clientId: '7b2e685bf08b5cb99c36518619c024c1ed1333e8f4eaae4ef5c5d4e29ca0b70e7dcf21e0fa08a0b29b076e9d5cd420cce6eba1f4f433e906cdc6c743907ef696',
  clientSecret: '4f70c91e5390f5b0fd9bbc28e5b9f9ad8f9341ac5c42ad33f295387333eb10106555fa52957427c01038bcfc05264f8b895422fd8d01ca1448b3c16c5d9bd6aa',
  jwtSecret: 'bc97aeda1a6e78c3c806461dae5958564ac22191932cf6c5e0f26f7470296e328f1509dbffcf9762a94313bc49c63197544ef95ab774d9647bd084d2d2fd82f9',
  authorizationCodeExpiration: 600, // 10 minutes
  accessTokenExpiration: 3600 // 1 hour
};

module.exports = config;
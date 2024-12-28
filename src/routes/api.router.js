const { Router } = require('express');
const Paths = require('../constants/paths');
const dataVerificationRouter = require('./controllers/dataVerification.controller');
const authRouter = require('./controllers/auth.controller');

const apiRouter = Router();

apiRouter.use(Paths.Verify.Base, dataVerificationRouter);
apiRouter.use(Paths.Auth.Base, authRouter);

module.exports = apiRouter; 
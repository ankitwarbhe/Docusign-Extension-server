import { Router } from 'express';
import Paths from '../constants/paths';
import archiveRouter from './archive.controller';
import authRouter from './auth.controller';

const apiRouter = Router();

apiRouter.use(Paths.Archive.Base, archiveRouter);

apiRouter.use(Paths.Auth.Base, authRouter);

export default apiRouter;

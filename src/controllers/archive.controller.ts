import { Router } from 'express';

import Paths from '../constants/paths';
import { archiveFile } from '../services/archive.service';
import { expressjwt as jwt } from 'express-jwt';
import { checkSchema } from 'express-validator';
import { archiveFileBody } from '../validationSchemas/archive';
import checkValidationErrors from '../middleware/checkValidationErrors';
import env from '../env';

const archiveRouter = Router();

archiveRouter.post(
  Paths.Archive.File.Post,
  jwt({
    secret: env.JWT_SECRET_KEY,
    algorithms: ['HS256'],
  }),
  checkSchema(archiveFileBody, ['body']),
  checkValidationErrors,
  archiveFile,
);

export default archiveRouter;

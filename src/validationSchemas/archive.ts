import { Schema } from 'express-validator';

export const archiveFileBody: Schema = {
  files: { isArray: { options: [{ min: 1 }] } },
  'files.*.name': { trim: true, isString: true },
  'files.*.content': { trim: true, isString: true },
  'files.*.contentType': { isIn: { options: [['bytes', 'url']] } },
  'files.*.path': { trim: true, isString: true },
  'files.*.pathTemplateValues': { isArray: true, optional: true },
  'files.*.pathTemplateValues.*': { trim: true, isString: true },
  order: { isInt: true, optional: true },
  overwrite: { isBoolean: true, optional: true },
  parent: { isString: true, optional: true },
  metadata: { isObject: true, optional: true },
};

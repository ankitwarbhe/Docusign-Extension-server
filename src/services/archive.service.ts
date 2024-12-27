import path from 'path';
import { ArchiveFileBody, ArchiveFileResponse } from '../models/archive';
import fs from 'fs';
import { IReq, IRes } from '../utils/types';

export const archiveFile = (req: IReq<ArchiveFileBody>, res: IRes) => {
  const {
    body: {
      files: [file],
    },
  } = req;
  const fileBuffer = Buffer.from(file.content, 'base64');
  try {
    if (file.path) {
      fs.mkdirSync(file.path, { recursive: true });
    }
    fs.writeFileSync(path.join(file.path, file.name), fileBuffer);
    const archiveResult: ArchiveFileResponse = { message: 'Successful archive' };
    return res.json(archiveResult);
  } catch (err) {
    console.log(`Encountered an error archiving file: ${err.message}`);
    const archiveResult: ArchiveFileResponse = { message: 'Failed archive' };
    return res.json(archiveResult);
  }
};

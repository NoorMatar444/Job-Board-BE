import { tmpdir } from 'os';
import { StorageApproachEnum } from '../enums/multer.enum.js';
import multer from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

export const allowedFileFormats = {
  video: ['video/mp4', 'video/avi', 'video/mov'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  pdf: ['application/pdf'],
};

export function multerOptions({
  allowedFormat = allowedFileFormats.image,
  storageApproach = StorageApproachEnum.MEMORY,
  fileSize,
}: {
  allowedFormat: string[];
  storageApproach: string;
  fileSize: number;
}): MulterOptions {
  const storage =
    storageApproach === StorageApproachEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination(
            _req: Request,
            _file: Express.Multer.File,
            callback: (error: Error | null, destination: string) => void,
          ) {
            callback(null, tmpdir());
          },
          filename(
            _req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, filename: string) => void,
          ) {
            callback(null, `${file.originalname}-${file.path}`);
          },
        });
  const fileFilter: MulterOptions['fileFilter'] = (req, file, callback) => {
    if (!allowedFormat.includes(file.mimetype)) {
      return callback(new BadRequestException('file not valid'), false);
    }
    callback(null, true);
  };
  return {
    storage,
    fileFilter,
    limits: {
      fileSize: fileSize * 1024 * 1024,
    },
  };
}

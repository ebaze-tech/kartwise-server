import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
  storage: memoryStorage(),

  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          'Only JPG, JPEG, PNG and WEBP images are allowed',
        ),
        false,
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
};

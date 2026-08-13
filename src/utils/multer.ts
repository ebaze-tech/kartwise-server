import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { memoryStorage } from 'multer';

export const multerOptions = {
  storage: memoryStorage(),

  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          'Only JPG, JPEG, PNG, WEBP, GIF and AVIF images are allowed',
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

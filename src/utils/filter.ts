import { BadRequestException } from '@nestjs/common';

export const fileFilter = (
  req: Express.Request,
  file: any,
  callback: (error: any, valid: boolean) => void,
) => {
  // Check file extension
  const validExtensions = /\.(jpg|jpeg|png|mp4|mov|pdf)$/i;
  if (!file.originalname.match(validExtensions)) {
    return callback(
      new BadRequestException(
        'Only image (jpg, jpeg, png), video (mp4, mov), and PDF files are allowed!',
      ),
      false,
    );
  }

  // Check MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'video/mp4',
    'video/quicktime', // for .mov(video)
    'application/pdf',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        'Invalid file type. Only images, videos (mp4, mov), and PDFs are allowed.',
      ),
      false,
    );
  }

  callback(null, true);
};

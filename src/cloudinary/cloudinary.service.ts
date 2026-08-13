import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { UploadApiOptions } from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadProfilePicture(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{
    url: string;
    publicId: string;
  }> {
    const result = await this.upload(file, {
      folder: `kartwise/users/${userId}/profile_picture`,
      public_id: crypto.randomUUID(),
      resource_type: 'image',
      overwrite: false,
      unique_filename: true,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
      transformation: [
        {
          width: 1000,
          height: 1000,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async uploadBusinessProductImages(
    file: Express.Multer.File,
    userId: string,
    businessId: string,
    productId: string,
  ): Promise<{
    url: string;
    publicId: string;
  }> {
    const result = await this.upload(file, {
      folder: `kartwise/users/${userId}/businesses/${businessId}/products/${productId}/images`,
      public_id: crypto.randomUUID(),
      resource_type: 'image',
      overwrite: false,
      unique_filename: true,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
      transformation: [
        {
          width: 1000,
          height: 1000,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async uploadBusinessBannerImage(
    file: Express.Multer.File,
    userId: string,
    businessId: string,
  ): Promise<{
    url: string;
    publicId: string;
  }> {
    const result = await this.upload(file, {
      folder: `kartwise/users/${userId}/businesses/${businessId}/banner`,
      public_id: crypto.randomUUID(),
      resource_type: 'image',
      overwrite: false,
      unique_filename: true,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
      transformation: [
        {
          width: 1000,
          height: 1000,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async deleteAsset(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw',
  ): Promise<boolean> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return true;
  }

  private upload(
    file: Express.Multer.File,
    options: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Upload failed'));
          }

          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}

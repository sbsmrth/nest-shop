import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error) return reject(new Error(error.message));
          if (error) return reject(new Error(JSON.stringify(error)));
          if (!result) return reject(new Error('Error uploading file'));

          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async removeFile(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }
}

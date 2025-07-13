import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class FilesService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadProductImages(files: Array<Express.Multer.File>) {
    const responses = await Promise.all(
      files.map((file) => this.cloudinaryService.uploadFile(file)),
    );

    return responses.map((response) => ({
      secureUrl: response.secure_url,
      publicId: response.public_id,
      originalName: response.original_filename,
      width: response.width,
      height: response.height,
    }));
  }

  async removeProductImages(publicIds: string[]): Promise<any> {
    const responses = await Promise.all(
      publicIds.map((publicId) => this.cloudinaryService.removeFile(publicId)),
    );

    return responses;
  }
}

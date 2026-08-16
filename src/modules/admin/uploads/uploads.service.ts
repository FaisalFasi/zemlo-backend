import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

import type { UploadImageResponseDto } from './dto';

@Injectable()
export class UploadsService {
  private readonly configured: boolean;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    this.configured = Boolean(cloudName && apiKey && apiSecret);

    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'zemlo/products',
          resource_type: 'image',
          // Cost control: cap dimensions (never upscale — `limit` only
          // shrinks images bigger than this) and apply Cloudinary's
          // automatic compression, so a 5MB admin upload doesn't sit in
          // storage (and get served over bandwidth) at full size forever.
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(
              new Error(
                error?.message ?? 'Cloudinary upload returned no result',
              ),
            );
            return;
          }

          resolve(uploadResult);
        },
      );

      uploadStream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}

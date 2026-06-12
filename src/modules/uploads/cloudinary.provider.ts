import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryProvider {
  private readonly logger = new Logger(CloudinaryProvider.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {
    const cloud_name = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const api_key = this.config.get<string>('CLOUDINARY_API_KEY');
    const api_secret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (cloud_name && api_key && api_secret) {
      cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
      this.configured = true;
      this.logger.log(`☁️  Cloudinary configured for cloud: ${cloud_name}`);
    } else {
      this.logger.warn(
        'Cloudinary credentials missing — image uploads will fail until CLOUDINARY_* env vars are set.',
      );
    }
  }

  get isConfigured() {
    return this.configured;
  }

  get client() {
    return cloudinary;
  }

  get folder() {
    return this.config.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'thangavel-textile';
  }
}

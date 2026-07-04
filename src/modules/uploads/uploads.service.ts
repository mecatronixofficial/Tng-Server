import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as streamifier from 'streamifier';
import { CloudinaryProvider } from './cloudinary.provider';

const IMAGE_UPLOAD_CONCURRENCY = 3;

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(items[currentIndex]);
      }
    }),
  );

  return results;
}

@Injectable()
export class UploadsService {
  constructor(private readonly cloudinary: CloudinaryProvider) {}

  async uploadImages(files: Express.Multer.File[]): Promise<UploadedImage[]> {
    if (!files?.length) throw new BadRequestException('No files provided');
    return mapWithConcurrency(files, IMAGE_UPLOAD_CONCURRENCY, (file) =>
      this.uploadImage(file),
    );
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadedImage> {
    if (!file) throw new BadRequestException('No file provided');
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are accepted');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('Uploaded image is empty');
    }
    if (!this.cloudinary.isConfigured) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured on the server. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.',
      );
    }

    return new Promise<UploadedImage>((resolve, reject) => {
      const stream = this.cloudinary.client.uploader.upload_stream(
        {
          folder: this.cloudinary.folder,
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException(error?.message || 'Upload failed'),
            );
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  }

  async deleteImage(publicId: string) {
    if (!this.cloudinary.isConfigured) {
      throw new InternalServerErrorException('Cloudinary not configured');
    }
    const res = await this.cloudinary.client.uploader.destroy(publicId);
    return { ok: res.result === 'ok', result: res.result, publicId };
  }
}

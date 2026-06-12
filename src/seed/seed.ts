import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppModule } from '../app.module';
import { Category } from '../modules/categories/schemas/category.schema';
import { Product } from '../modules/products/schemas/product.schema';
import { Blog } from '../modules/blogs/schemas/blog.schema';
import { Banner, BannerKind } from '../modules/banners/schemas/banner.schema';
import { Offer } from '../modules/offers/schemas/offer.schema';
import { Testimonial } from '../modules/testimonials/schemas/testimonial.schema';

const logger = new Logger('Seed');

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

  const categoryModel = app.get<Model<any>>(getModelToken(Category.name));
  const productModel = app.get<Model<any>>(getModelToken(Product.name));
  const blogModel = app.get<Model<any>>(getModelToken(Blog.name));
  const bannerModel = app.get<Model<any>>(getModelToken(Banner.name));
  const offerModel = app.get<Model<any>>(getModelToken(Offer.name));
  const testimonialModel = app.get<Model<any>>(getModelToken(Testimonial.name));

  logger.log('Clearing existing collections (except users)...');
  await Promise.all([
    categoryModel.deleteMany({}),
    productModel.deleteMany({}),
    blogModel.deleteMany({}),
    bannerModel.deleteMany({}),
    offerModel.deleteMany({}),
    testimonialModel.deleteMany({}),
  ]);

  logger.log('✅  Seed complete.');
  await app.close();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});

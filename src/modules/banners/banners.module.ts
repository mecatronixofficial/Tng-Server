import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, BannerSchema } from './schemas/banner.schema';
import { BannersService } from './banners.service';
import { BannersAdminController, BannersPublicController } from './banners.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Banner.name, schema: BannerSchema }])],
  controllers: [BannersPublicController, BannersAdminController],
  providers: [BannersService],
  exports: [BannersService, MongooseModule],
})
export class BannersModule {}

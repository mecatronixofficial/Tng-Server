import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './schemas/blog.schema';
import { BlogsService } from './blogs.service';
import { BlogsAdminController, BlogsPublicController } from './blogs.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }])],
  controllers: [BlogsPublicController, BlogsAdminController],
  providers: [BlogsService],
  exports: [BlogsService, MongooseModule],
})
export class BlogsModule {}

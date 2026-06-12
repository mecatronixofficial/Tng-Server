import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Subcategory, SubcategorySchema } from './schemas/subcategory.schema';
import {
  SubcategoriesAdminController,
  SubcategoriesPublicController,
} from './subcategories.controller';
import { SubcategoriesService } from './subcategories.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subcategory.name, schema: SubcategorySchema },
    ]),
  ],
  controllers: [SubcategoriesPublicController, SubcategoriesAdminController],
  providers: [SubcategoriesService],
  exports: [SubcategoriesService],
})
export class SubcategoriesModule {}

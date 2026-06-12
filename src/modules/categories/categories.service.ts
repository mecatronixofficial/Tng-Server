import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { makeSlug } from '../../common/utils/slug';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly model: Model<CategoryDocument>,
  ) {}

  async listPublic() {
    return this.model
      .find({ active: true })
      .sort({ order: 1, name: 1 });
  }

  async listAll() {
    return this.model.find().sort({ order: 1, name: 1 });
  }

  async findBySlug(slug: string) {
    const c = await this.model.findOne({ slug, active: true });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async findById(id: string) {
    const c = await this.model.findById(id);
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async create(dto: CreateCategoryDto) {
    const slug = (dto.slug && makeSlug(dto.slug)) || makeSlug(dto.name);
    return this.model.create({ ...dto, slug });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const patch: any = { ...dto };
    if (dto.name && !dto.slug) patch.slug = makeSlug(dto.name);
    if (dto.slug) patch.slug = makeSlug(dto.slug);

    const c = await this.model.findByIdAndUpdate(id, patch, { new: true });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async remove(id: string) {
    const c = await this.model.findByIdAndDelete(id);
    if (!c) throw new NotFoundException('Category not found');
    return { deleted: true, id };
  }

  /** Called by products service to keep counts accurate */
  async refreshProductCount(slug: string, count: number) {
    await this.model.updateOne({ slug }, { productCount: count });
  }
}

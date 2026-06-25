import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { makeSlug } from '../../common/utils/slug';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';
import { Subcategory, SubcategoryDocument } from './schemas/subcategory.schema';

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectModel(Subcategory.name) private readonly model: Model<SubcategoryDocument>,
  ) {}

  async listPublic(category?: string) {
    const filter: Record<string, unknown> = { active: true };
    if (category) filter.category = makeSlug(category);
    return this.model.find(filter).sort({ category: 1, order: 1, name: 1 });
  }

  async listAll(category?: string) {
    const filter: Record<string, unknown> = {};
    if (category) filter.category = makeSlug(category);
    return this.model.find(filter).sort({ category: 1, order: 1, name: 1 });
  }

  async findBySlug(slug: string) {
    const subcategory = await this.model.findOne({ slug: makeSlug(slug), active: true });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    return subcategory;
  }

  async existsInCategory(slug: string, category: string) {
    return this.model.exists({
      slug: makeSlug(slug),
      category: makeSlug(category),
    });
  }

  async findById(id: string) {
    const subcategory = await this.model.findById(id);
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    return subcategory;
  }

  async create(dto: CreateSubcategoryDto) {
    const slug = (dto.slug && makeSlug(dto.slug)) || makeSlug(dto.name);
    return this.model.create({ ...dto, slug, category: makeSlug(dto.category) });
  }

  async update(id: string, dto: UpdateSubcategoryDto) {
    const patch: any = { ...dto };
    if (dto.slug) patch.slug = makeSlug(dto.slug);
    if (dto.category) patch.category = makeSlug(dto.category);

    const subcategory = await this.model.findByIdAndUpdate(id, patch, { new: true });
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    return subcategory;
  }

  async remove(id: string) {
    const subcategory = await this.model.findByIdAndDelete(id);
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    return { deleted: true, id };
  }

  async refreshProductCount(slug: string, count: number) {
    if (!slug) return;
    await this.model.updateOne({ slug: makeSlug(slug) }, { productCount: count });
  }
}

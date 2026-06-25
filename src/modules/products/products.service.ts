import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { buildSort, PaginatedResult } from '../../common/dto/pagination.dto';
import { makeSlug, escapeRegex } from '../../common/utils/slug';
import { CategoriesService } from '../categories/categories.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly model: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
    private readonly subcategoriesService: SubcategoriesService,
  ) {}

  private buildQuery(q: ProductQueryDto, publicOnly = false): FilterQuery<ProductDocument> {
    const filter: FilterQuery<ProductDocument> = {};
    if (publicOnly) filter.active = true;
    if (q.category) filter.category = q.category;
    if (q.subcategory) filter.subcategory = q.subcategory;
    if (q.featured === 'true' || q.featured === '1') filter.featured = true;
    if (q.newArrival === 'true' || q.newArrival === '1') filter.newArrival = true;

    const priceFilter: any = {};
    if (q.maxPrice) priceFilter.$lte = Number(q.maxPrice);
    if (q.minPrice) priceFilter.$gte = Number(q.minPrice);
    if (Object.keys(priceFilter).length) filter.offerPrice = priceFilter;

    if (q.search) {
      const re = new RegExp(escapeRegex(q.search.trim()), 'i');
      filter.$or = [
        { name: re },
        { description: re },
        { material: re },
        { tags: re },
      ];
    }
    return filter;
  }

  async listPublic(q: ProductQueryDto): Promise<PaginatedResult<ProductDocument>> {
    const filter = this.buildQuery(q, true);
    const page = q.page || 1;
    const limit = q.limit || 20;
    const skip = (page - 1) * limit;
    const sort = buildSort(q.sort);

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);

    return {
      data: data as any,
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async listAll(q: ProductQueryDto) {
    const filter = this.buildQuery(q, false);
    const page = q.page || 1;
    const limit = q.limit || 50;
    const skip = (page - 1) * limit;
    const sort = buildSort(q.sort);

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ]);
    return {
      data,
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findBySlug(slug: string) {
    const p = await this.model.findOne({ slug, active: true });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async findById(id: string) {
    const p = await this.model.findById(id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async related(slug: string, limit = 4) {
    const current = await this.model.findOne({ slug }).lean();
    if (!current) return [];
    return this.model
      .find({ slug: { $ne: slug }, category: current.category, active: true })
      .limit(limit);
  }

  async create(dto: CreateProductDto) {
    const slug = (dto.slug && makeSlug(dto.slug)) || makeSlug(dto.name);
    const created = await this.model.create({ ...dto, slug });
    await this.refreshCategoryCount(created.category);
    if (created.subcategory) await this.refreshSubcategoryCount(created.subcategory);
    return created;
  }

  async bulkImport(
    products: CreateProductDto[],
    options: { updateExisting?: boolean } = {},
  ) {
    const result = {
      total: products.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as { row: number; name?: string; message: string }[],
    };
    const affectedCategories = new Set<string>();
    const affectedSubcategories = new Set<string>();

    for (const [index, dto] of products.entries()) {
      const row = index + 1;
      try {
        const slug = (dto.slug && makeSlug(dto.slug)) || makeSlug(dto.name);
        const payload = { ...dto, slug };
        const existing = await this.model.findOne({ slug });

        if (existing) {
          if (!options.updateExisting) {
            result.skipped += 1;
            continue;
          }

          const beforeCategory = existing.category;
          const beforeSubcategory = existing.subcategory;
          await this.model.updateOne({ _id: existing._id }, payload);
          result.updated += 1;

          affectedCategories.add(beforeCategory);
          if (beforeSubcategory) affectedSubcategories.add(beforeSubcategory);
        } else {
          await this.model.create(payload);
          result.created += 1;
        }

        affectedCategories.add(payload.category);
        if (payload.subcategory) affectedSubcategories.add(payload.subcategory);
      } catch (error) {
        result.errors.push({
          row,
          name: dto?.name,
          message: (error as Error).message,
        });
      }
    }

    await Promise.all([
      ...Array.from(affectedCategories).map((slug) => this.refreshCategoryCount(slug)),
      ...Array.from(affectedSubcategories).map((slug) => this.refreshSubcategoryCount(slug)),
    ]);

    return result;
  }

  async update(id: string, dto: UpdateProductDto) {
    const patch: any = { ...dto };
    if (dto.name && !dto.slug) patch.slug = makeSlug(dto.name);
    if (dto.slug) patch.slug = makeSlug(dto.slug);

    const before = await this.model.findById(id).lean();
    if (!before) throw new NotFoundException('Product not found');

    const updated = await this.model.findByIdAndUpdate(id, patch, { new: true });
    if (!updated) throw new NotFoundException('Product not found');

    // Refresh counts if category changed
    if (dto.category && dto.category !== before.category) {
      await this.refreshCategoryCount(before.category);
      await this.refreshCategoryCount(dto.category);
    }
    if ('subcategory' in dto && dto.subcategory !== before.subcategory) {
      if (before.subcategory) await this.refreshSubcategoryCount(before.subcategory);
      if (dto.subcategory) await this.refreshSubcategoryCount(dto.subcategory);
    }
    return updated;
  }

  async remove(id: string) {
    const p = await this.model.findByIdAndDelete(id);
    if (!p) throw new NotFoundException('Product not found');
    await this.refreshCategoryCount(p.category);
    if (p.subcategory) await this.refreshSubcategoryCount(p.subcategory);
    return { deleted: true, id };
  }

  private async refreshCategoryCount(slug: string) {
    const count = await this.model.countDocuments({ category: slug, active: true });
    await this.categoriesService.refreshProductCount(slug, count);
  }

  private async refreshSubcategoryCount(slug: string) {
    const count = await this.model.countDocuments({ subcategory: slug, active: true });
    await this.subcategoriesService.refreshProductCount(slug, count);
  }
}

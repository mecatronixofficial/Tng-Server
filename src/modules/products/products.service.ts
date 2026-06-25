import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  private normalizeProductPayload<T extends Partial<CreateProductDto | UpdateProductDto>>(dto: T) {
    const payload: any = { ...dto };
    if (payload.category) payload.category = makeSlug(payload.category);
    if (payload.subcategory) payload.subcategory = makeSlug(payload.subcategory);
    else if ('subcategory' in payload) payload.subcategory = undefined;
    if (payload.slug) payload.slug = makeSlug(payload.slug);
    return payload;
  }

  private async validateCategoryAndSubcategory(payload: Partial<CreateProductDto | UpdateProductDto>) {
    if (!payload.category) return;

    const category = makeSlug(payload.category);
    const categoryExists = await this.categoriesService.existsBySlug(category);
    if (!categoryExists) {
      throw new BadRequestException(`Category "${payload.category}" does not exist`);
    }

    if (payload.subcategory) {
      const subcategory = makeSlug(payload.subcategory);
      const subcategoryExists = await this.subcategoriesService.existsInCategory(
        subcategory,
        category,
      );
      if (!subcategoryExists) {
        throw new BadRequestException(
          `Subcategory "${payload.subcategory}" does not exist in category "${payload.category}"`,
        );
      }
    }
  }

  private buildUpdateOperation(payload: Record<string, unknown>) {
    if ('subcategory' in payload && payload.subcategory === undefined) {
      const { subcategory: _subcategory, ...set } = payload;
      return { $set: set, $unset: { subcategory: '' } };
    }
    return payload;
  }

  private buildQuery(q: ProductQueryDto, publicOnly = false): FilterQuery<ProductDocument> {
    const filter: FilterQuery<ProductDocument> = {};
    if (publicOnly) filter.active = true;
    if (q.category) filter.category = makeSlug(q.category);
    if (q.subcategory) filter.subcategory = makeSlug(q.subcategory);
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
    const p = await this.model.findOne({ slug: makeSlug(slug), active: true });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async findById(id: string) {
    const p = await this.model.findById(id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async related(slug: string, limit = 4) {
    const productSlug = makeSlug(slug);
    const current = await this.model.findOne({ slug: productSlug }).lean();
    if (!current) return [];
    return this.model
      .find({ slug: { $ne: productSlug }, category: current.category, active: true })
      .limit(limit);
  }

  async create(dto: CreateProductDto) {
    const payload = this.normalizeProductPayload(dto);
    await this.validateCategoryAndSubcategory(payload);
    const slug = payload.slug || makeSlug(dto.name);
    const created = await this.model.create({ ...payload, slug });
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
        const payload = this.normalizeProductPayload(dto);
        await this.validateCategoryAndSubcategory(payload);
        const slug = payload.slug || makeSlug(dto.name);
        payload.slug = slug;
        const existing = await this.model.findOne({ slug });

        if (existing) {
          if (!options.updateExisting) {
            result.skipped += 1;
            continue;
          }

          const beforeCategory = existing.category;
          const beforeSubcategory = existing.subcategory;
          await this.model.updateOne({ _id: existing._id }, this.buildUpdateOperation(payload));
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
    const patch: any = this.normalizeProductPayload(dto);

    const before = await this.model.findById(id).lean();
    if (!before) throw new NotFoundException('Product not found');

    if (patch.category && patch.category !== before.category && !('subcategory' in patch)) {
      patch.subcategory = undefined;
    }

    await this.validateCategoryAndSubcategory({
      ...patch,
      category: patch.category ?? before.category,
    });

    const updated = await this.model.findByIdAndUpdate(
      id,
      this.buildUpdateOperation(patch),
      { new: true },
    );
    if (!updated) throw new NotFoundException('Product not found');

    const categoryChanged = Boolean(patch.category && patch.category !== before.category);
    const subcategoryChanged =
      'subcategory' in patch && patch.subcategory !== before.subcategory;
    const activeChanged = 'active' in patch && patch.active !== before.active;

    if (categoryChanged || activeChanged) {
      await this.refreshCategoryCount(before.category);
      await this.refreshCategoryCount(updated.category);
    }
    if (subcategoryChanged || activeChanged) {
      if (before.subcategory) await this.refreshSubcategoryCount(before.subcategory);
      if (updated.subcategory) await this.refreshSubcategoryCount(updated.subcategory);
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
    const category = makeSlug(slug);
    const count = await this.model.countDocuments({ category, active: true });
    await this.categoriesService.refreshProductCount(slug, count);
  }

  private async refreshSubcategoryCount(slug: string) {
    const subcategory = makeSlug(slug);
    const count = await this.model.countDocuments({ subcategory, active: true });
    await this.subcategoriesService.refreshProductCount(slug, count);
  }
}

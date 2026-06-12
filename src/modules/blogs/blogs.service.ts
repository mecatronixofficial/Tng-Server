import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { Blog, BlogDocument } from './schemas/blog.schema';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';
import {
  PaginationQueryDto,
  buildSort,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { makeSlug, escapeRegex } from '../../common/utils/slug';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private readonly model: Model<BlogDocument>,
  ) {}

  private filter(q: PaginationQueryDto, publicOnly = false): FilterQuery<BlogDocument> {
    const f: FilterQuery<BlogDocument> = {};
    if (publicOnly) f.published = true;
    if (q.search) {
      const re = new RegExp(escapeRegex(q.search.trim()), 'i');
      f.$or = [{ title: re }, { excerpt: re }, { content: re }, { tags: re }];
    }
    return f;
  }

  async listPublic(q: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const f = this.filter(q, true);
    const page = q.page || 1;
    const limit = q.limit || 12;
    const skip = (page - 1) * limit;
    const sort = buildSort(q.sort || '-publishedAt');

    const [data, total] = await Promise.all([
      this.model.find(f).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(f),
    ]);
    return {
      data,
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async listAll(q: PaginationQueryDto) {
    const f = this.filter(q, false);
    const page = q.page || 1;
    const limit = q.limit || 50;
    const skip = (page - 1) * limit;
    const sort = buildSort(q.sort || '-createdAt');
    const [data, total] = await Promise.all([
      this.model.find(f).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(f),
    ]);
    return { data, meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async findBySlug(slug: string) {
    const b = await this.model.findOne({ slug, published: true });
    if (!b) throw new NotFoundException('Article not found');
    return b;
  }

  async findById(id: string) {
    const b = await this.model.findById(id);
    if (!b) throw new NotFoundException('Article not found');
    return b;
  }

  async create(dto: CreateBlogDto) {
    const slug = (dto.slug && makeSlug(dto.slug)) || makeSlug(dto.title);
    return this.model.create({ ...dto, slug });
  }

  async update(id: string, dto: UpdateBlogDto) {
    const patch: any = { ...dto };
    if (dto.title && !dto.slug) patch.slug = makeSlug(dto.title);
    if (dto.slug) patch.slug = makeSlug(dto.slug);
    const b = await this.model.findByIdAndUpdate(id, patch, { new: true });
    if (!b) throw new NotFoundException('Article not found');
    return b;
  }

  async remove(id: string) {
    const b = await this.model.findByIdAndDelete(id);
    if (!b) throw new NotFoundException('Article not found');
    return { deleted: true, id };
  }
}

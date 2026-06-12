import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Banner, BannerDocument, BannerKind } from './schemas/banner.schema';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private readonly model: Model<BannerDocument>,
  ) {}

  async listByKind(kind: BannerKind, publicOnly = true) {
    const f: any = { kind };
    if (publicOnly) f.active = true;
    return this.model.find(f).sort({ order: 1, createdAt: 1 });
  }

  async listAll() {
    return this.model.find().sort({ kind: 1, order: 1 });
  }

  async findById(id: string) {
    const b = await this.model.findById(id);
    if (!b) throw new NotFoundException('Banner not found');
    return b;
  }

  async create(dto: CreateBannerDto) {
    return this.model.create(dto);
  }

  async update(id: string, dto: UpdateBannerDto) {
    const b = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!b) throw new NotFoundException('Banner not found');
    return b;
  }

  async remove(id: string) {
    const b = await this.model.findByIdAndDelete(id);
    if (!b) throw new NotFoundException('Banner not found');
    return { deleted: true, id };
  }
}

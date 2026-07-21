import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { VisitorCount, VisitorCountDocument } from './schemas/visitor-count.schema';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectModel(VisitorCount.name)
    private readonly visitorCounts: Model<VisitorCountDocument>,
  ) {}

  async track() {
    const counter = await this.visitorCounts.findOneAndUpdate(
      { key: 'website' },
      { $inc: { count: 1 }, $setOnInsert: { key: 'website' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return { count: counter.count };
  }

  async getCount() {
    const counter = await this.visitorCounts.findOne({ key: 'website' }).lean();
    return { count: counter?.count ?? 0 };
  }
}

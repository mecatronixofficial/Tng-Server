import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VisitorCount, VisitorCountSchema } from './schemas/visitor-count.schema';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisitorCount.name, schema: VisitorCountSchema },
    ]),
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
})
export class VisitorsModule {}

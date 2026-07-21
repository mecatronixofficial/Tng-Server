import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { VisitorsService } from './visitors.service';

@ApiTags('visitors')
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Get()
  getCount() {
    return this.visitorsService.getCount();
  }

  @Post('track')
  track() {
    return this.visitorsService.track();
  }
}

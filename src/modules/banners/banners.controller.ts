import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { BannerKind } from './schemas/banner.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('public')
@Controller('banners')
export class BannersPublicController {
  constructor(private readonly service: BannersService) {}

  @Get('hero')
  hero() { return this.service.listByKind(BannerKind.HERO, true); }

  @Get('opening-card')
  openingCard() { return this.service.listByKind(BannerKind.OPENING_CARD, true); }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/banners')
export class BannersAdminController {
  constructor(private readonly service: BannersService) {}

  @Get() listAll() { return this.service.listAll(); }
  @Get(':id') byId(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateBannerDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBannerDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id') id: string) { return this.service.remove(id); }
}

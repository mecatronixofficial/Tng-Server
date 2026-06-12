import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';
import { SubcategoriesService } from './subcategories.service';

@ApiTags('public')
@Controller('subcategories')
export class SubcategoriesPublicController {
  constructor(private readonly service: SubcategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List active subcategories (public).' })
  list(@Query('category') category?: string) {
    return this.service.listPublic(category);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Fetch a single subcategory by slug (public).' })
  bySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/subcategories')
export class SubcategoriesAdminController {
  constructor(private readonly service: SubcategoriesService) {}

  @Get()
  listAll(@Query('category') category?: string) {
    return this.service.listAll(category);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateSubcategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

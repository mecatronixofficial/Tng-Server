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

import { ProductsService } from './products.service';
import {
  BulkProductImportDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('public')
@Controller('products')
export class ProductsPublicController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List products with filters, search, sort and pagination (public, active only).',
  })
  list(@Query() q: ProductQueryDto) {
    return this.service.listPublic(q);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Fetch a single product by slug.' })
  bySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Up to 4 related products from same category.' })
  related(@Param('slug') slug: string) {
    return this.service.related(slug, 4);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  listAll(@Query() q: ProductQueryDto) {
    return this.service.listAll(q);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Post('bulk')
  bulkImport(@Body() dto: BulkProductImportDto) {
    return this.service.bulkImport(dto.products, {
      updateExisting: dto.updateExisting,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

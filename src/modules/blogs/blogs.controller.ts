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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { BlogsService } from './blogs.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('public')
@Controller('blogs')
export class BlogsPublicController {
  constructor(private readonly service: BlogsService) {}
  @Get() list(@Query() q: PaginationQueryDto) { return this.service.listPublic(q); }
  @Get(':slug') bySlug(@Param('slug') slug: string) { return this.service.findBySlug(slug); }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/blogs')
export class BlogsAdminController {
  constructor(private readonly service: BlogsService) {}
  @Get() listAll(@Query() q: PaginationQueryDto) { return this.service.listAll(q); }
  @Get(':id') byId(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateBlogDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBlogDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id') id: string) { return this.service.remove(id); }
}

import {
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiBearerAuth,
  PartialType,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

import { Faq, FaqDocument, FaqSchema } from './schemas/faq.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

class CreateFaqDto {
  @ApiProperty() @IsString() question!: string;
  @ApiProperty() @IsString() answer!: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() active?: boolean;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() order?: number;
}
class UpdateFaqDto extends PartialType(CreateFaqDto) {}

@Injectable()
class FaqsService {
  constructor(@InjectModel(Faq.name) private readonly model: Model<FaqDocument>) {}

  listPublic() {
    return this.model.find({ active: true }).sort({ order: 1, createdAt: 1 });
  }
  listAll() { return this.model.find().sort({ order: 1, createdAt: 1 }); }
  async findById(id: string) {
    const x = await this.model.findById(id);
    if (!x) throw new NotFoundException('FAQ not found');
    return x;
  }
  create(dto: CreateFaqDto) { return this.model.create(dto); }
  async update(id: string, dto: UpdateFaqDto) {
    const x = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!x) throw new NotFoundException('FAQ not found');
    return x;
  }
  async remove(id: string) {
    const x = await this.model.findByIdAndDelete(id);
    if (!x) throw new NotFoundException('FAQ not found');
    return { deleted: true, id };
  }
}

@ApiTags('public')
@Controller('faqs')
class FaqsPublicController {
  constructor(private readonly service: FaqsService) {}
  @Get() list() { return this.service.listPublic(); }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/faqs')
class FaqsAdminController {
  constructor(private readonly service: FaqsService) {}
  @Get() listAll() { return this.service.listAll(); }
  @Get(':id') byId(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateFaqDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateFaqDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id') id: string) { return this.service.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Faq.name, schema: FaqSchema }])],
  controllers: [FaqsPublicController, FaqsAdminController],
  providers: [FaqsService],
  exports: [FaqsService, MongooseModule],
})
export class FaqsModule {}

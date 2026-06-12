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
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  Testimonial,
  TestimonialDocument,
  TestimonialSchema,
} from './schemas/testimonial.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

class CreateTestimonialDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() role!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiProperty() @IsString() location!: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(5) rating!: number;
  @ApiProperty() @IsString() review!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() image?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productPurchased?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() approved?: boolean;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() order?: number;
}
class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}

class SubmitReviewDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() role!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiProperty() @IsString() location!: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(5) rating!: number;
  @ApiProperty() @IsString() review!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productPurchased?: string;
}

@Injectable()
class TestimonialsService {
  constructor(
    @InjectModel(Testimonial.name) private readonly model: Model<TestimonialDocument>,
  ) {}

  listPublic() {
    return this.model.find({ approved: true }).sort({ featured: -1, order: 1 });
  }
  listAll() { return this.model.find().sort({ createdAt: -1 }); }
  async findById(id: string) {
    const t = await this.model.findById(id);
    if (!t) throw new NotFoundException('Testimonial not found');
    return t;
  }
  create(dto: CreateTestimonialDto) { return this.model.create(dto); }
  submitReview(dto: SubmitReviewDto) {
    return this.model.create({ ...dto, approved: false, featured: false, order: 0 });
  }
  async update(id: string, dto: UpdateTestimonialDto) {
    const t = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!t) throw new NotFoundException('Testimonial not found');
    return t;
  }
  async remove(id: string) {
    const t = await this.model.findByIdAndDelete(id);
    if (!t) throw new NotFoundException('Testimonial not found');
    return { deleted: true, id };
  }
}

@ApiTags('public')
@Controller('testimonials')
class TestimonialsPublicController {
  constructor(private readonly service: TestimonialsService) {}
  @Get() list() { return this.service.listPublic(); }
  @Post('submit') submit(@Body() dto: SubmitReviewDto) {
    return this.service.submitReview(dto).then(() => ({ message: 'Review submitted and pending approval.' }));
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/testimonials')
class TestimonialsAdminController {
  constructor(private readonly service: TestimonialsService) {}
  @Get() listAll() { return this.service.listAll(); }
  @Get(':id') byId(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateTestimonialDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id') id: string) { return this.service.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Testimonial.name, schema: TestimonialSchema }])],
  controllers: [TestimonialsPublicController, TestimonialsAdminController],
  providers: [TestimonialsService],
  exports: [TestimonialsService, MongooseModule],
})
export class TestimonialsModule {}

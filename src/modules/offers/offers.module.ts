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
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { Offer, OfferDocument, OfferSchema } from './schemas/offer.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

class CreateOfferDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) discountPercent!: number;
  @ApiProperty() @IsDateString() expiresAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() image?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ctaLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ctaHref?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() active?: boolean;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() order?: number;
}
class UpdateOfferDto extends PartialType(CreateOfferDto) {}

@Injectable()
class OffersService {
  constructor(@InjectModel(Offer.name) private readonly model: Model<OfferDocument>) {}

  listPublic() {
    return this.model
      .find({ active: true, expiresAt: { $gt: new Date() } })
      .sort({ order: 1, expiresAt: 1 });
  }
  listAll() { return this.model.find().sort({ order: 1, expiresAt: 1 }); }
  async findById(id: string) {
    const x = await this.model.findById(id);
    if (!x) throw new NotFoundException('Offer not found');
    return x;
  }
  create(dto: CreateOfferDto) { return this.model.create(dto); }
  async update(id: string, dto: UpdateOfferDto) {
    const x = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!x) throw new NotFoundException('Offer not found');
    return x;
  }
  async remove(id: string) {
    const x = await this.model.findByIdAndDelete(id);
    if (!x) throw new NotFoundException('Offer not found');
    return { deleted: true, id };
  }
}

@ApiTags('public')
@Controller('offers')
class OffersPublicController {
  constructor(private readonly service: OffersService) {}
  @Get() list() { return this.service.listPublic(); }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/offers')
class OffersAdminController {
  constructor(private readonly service: OffersService) {}
  @Get() listAll() { return this.service.listAll(); }
  @Get(':id') byId(@Param('id') id: string) { return this.service.findById(id); }
  @Post() create(@Body() dto: CreateOfferDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateOfferDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id') id: string) { return this.service.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }])],
  controllers: [OffersPublicController, OffersAdminController],
  providers: [OffersService],
  exports: [OffersService, MongooseModule],
})
export class OffersModule {}

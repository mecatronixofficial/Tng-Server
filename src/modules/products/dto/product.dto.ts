import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class SpecItemDto {
  @ApiProperty() @IsString() label: string;
  @ApiProperty() @IsString() value: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(2) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiProperty({ description: 'Category slug' }) @IsString() category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subcategory?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() clothType: string;

  @ApiProperty({ type: [String] })
  @IsArray() @IsString({ each: true }) colors: string[];

  @ApiProperty({ type: [String] })
  @IsArray() @IsString({ each: true }) sizes: string[];

  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) stock: number;
  @ApiProperty({ minimum: 0 }) @IsNumber() @Min(0) offerPrice: number;
  @ApiProperty({ minimum: 0 }) @IsNumber() @Min(0) originalPrice: number;
  @ApiProperty() @IsString() material: string;

  @ApiPropertyOptional() @IsOptional() @IsString() gsm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pattern?: string;

  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() washable?: boolean;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() newArrival?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() active?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional() @IsNumber() @Min(0) @Max(5) rating?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional() @IsInt() @Min(0) reviews?: number;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @ApiPropertyOptional({ type: [SpecItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecItemDto)
  specifications?: SpecItemDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category slug' })
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional({ description: 'Filter by subcategory slug or name' })
  @IsOptional() @IsString() subcategory?: string;

  @ApiPropertyOptional({ description: 'Featured only' })
  @IsOptional() featured?: string;

  @ApiPropertyOptional({ description: 'New arrivals only' })
  @IsOptional() newArrival?: string;

  @ApiPropertyOptional({ description: 'Max offer price' })
  @IsOptional() maxPrice?: string;

  @ApiPropertyOptional({ description: 'Min offer price' })
  @IsOptional() minPrice?: string;
}

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBlogDto {
  @ApiProperty() @IsString() @MinLength(3) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiProperty() @IsString() excerpt: string;
  @ApiProperty() @IsString() content: string;
  @ApiProperty() @IsString() coverImage: string;
  @ApiProperty() @IsString() author: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorImage?: string;
  @ApiProperty() @IsString() category: string;
  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ default: 5 }) @IsOptional() @IsInt() @Min(1) readTime?: number;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() published?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() publishedAt?: string;
}

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}

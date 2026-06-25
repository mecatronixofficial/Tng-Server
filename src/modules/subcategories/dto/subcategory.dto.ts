import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSubcategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Auto-generated from name if omitted' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Parent category slug' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Public image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSubcategoryDto extends PartialType(CreateSubcategoryDto) {}

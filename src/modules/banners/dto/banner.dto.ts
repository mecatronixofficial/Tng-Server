import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { BannerKind } from '../schemas/banner.schema';

export class CreateBannerDto {
  @ApiProperty({ enum: BannerKind }) @IsEnum(BannerKind) kind: BannerKind;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() highlight?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() eyebrow?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() image: string;
  @ApiProperty() @IsString() ctaLabel: string;
  @ApiProperty() @IsString() ctaHref: string;
  @ApiPropertyOptional() @IsOptional() @IsString() secondaryLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() secondaryHref?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() badge?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() order?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

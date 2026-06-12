import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search across name/title/tags' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field, prefix with - for desc. e.g. -createdAt' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function buildSort(sort?: string): Record<string, 1 | -1> {
  if (!sort) return { createdAt: -1 };
  const out: Record<string, 1 | -1> = {};
  for (const field of sort.split(',')) {
    const s = field.trim();
    if (!s) continue;
    if (s.startsWith('-')) out[s.slice(1)] = -1;
    else out[s] = 1;
  }
  return Object.keys(out).length ? out : { createdAt: -1 };
}

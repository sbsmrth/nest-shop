import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number) // Transfor string to number
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  @IsOptional()
  @IsPositive()
  stock?: number;

  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  @IsIn(['MEN', 'WOMEN', 'KID', 'UNISEX'])
  gender: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // @IsArray()
  // @IsString({ each: true })
  // @IsOptional()
  // images?: string[];
}

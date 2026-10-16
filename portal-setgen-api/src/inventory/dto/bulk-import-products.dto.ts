import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class BulkImportProductsDto {
  @ApiProperty({ description: 'Lista de produtos a serem importados' })
  @IsArray()
  items: any[];
}


import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateWarrantyDto {
  @ApiProperty({ example: '2027-07-05T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'Garantia estendida por 24 meses conforme negociação', required: false })
  @IsString()
  @IsOptional()
  terms?: string;
}

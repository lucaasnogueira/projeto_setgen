import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CheckinVisitDto {
  @ApiProperty({ example: -23.55052 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: -46.633308 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ example: 15, required: false, description: 'Precisão em metros' })
  @IsNumber()
  @IsOptional()
  accuracy?: number;
}

export class CheckoutVisitDto extends CheckinVisitDto {}

import { PartialType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ServiceOrderStatus } from '@prisma/client';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @ApiProperty({ enum: ServiceOrderStatus, required: false })
  @IsEnum(ServiceOrderStatus)
  @IsOptional()
  status?: ServiceOrderStatus;

  @ApiProperty({ example: 50, required: false, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ServiceOrderStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: ServiceOrderStatus })
  @IsEnum(ServiceOrderStatus, { message: 'Status inválido' })
  status: ServiceOrderStatus;

  @ApiProperty({ example: 'OS aprovada pelo gerente', required: false })
  @IsString()
  @IsOptional()
  comments?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProcurementOrderStatus } from '@prisma/client';

export class UpdateProcurementOrderStatusDto {
  @ApiProperty({ enum: ProcurementOrderStatus })
  @IsEnum(ProcurementOrderStatus, { message: 'Status inválido' })
  status: ProcurementOrderStatus;
}

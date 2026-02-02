import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class CreateApprovalDto {
  @ApiProperty({ example: 'service-order-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID da Ordem de Serviço é obrigatório' })
  serviceOrderId: string;

  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.APPROVED })
  @IsEnum(ApprovalStatus, { message: 'Status de aprovação inválido' })
  status: ApprovalStatus;

  @ApiProperty({
    example: 'Aprovado conforme escopo apresentado',
    required: false,
  })
  @IsString()
  @IsOptional()
  comments?: string;
}

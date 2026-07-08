import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class UpdateVisitStatusDto {
  @ApiProperty({ enum: VisitStatus })
  @IsEnum(VisitStatus, { message: 'Status inválido' })
  status: VisitStatus;

  @ApiProperty({ example: 'Cliente pediu para reagendar', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { QuoteStatus } from '@prisma/client';

export class UpdateQuoteStatusDto {
  @ApiProperty({ enum: QuoteStatus })
  @IsEnum(QuoteStatus, { message: 'Status inválido' })
  status: QuoteStatus;

  @ApiProperty({ example: 'Orçamento aprovado pelo gerente', required: false })
  @IsString()
  @IsOptional()
  comments?: string;
}

import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiProperty({ enum: InvoiceStatus, required: false })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceOrderItemDto } from './service-order-item.dto';

export class CreateServiceOrderDto {
  @ApiProperty({
    example: 'quote-uuid-here',
    description: 'Orçamento aceito (status ACCEPTED) que originou esta OS',
  })
  @IsUUID()
  quoteId: string;

  @ApiProperty({
    example: [{ productId: 'prod-uuid', quantity: 2, unitPrice: 50.0 }],
    required: false,
    description: 'Materiais previstos para a execução — alimenta a solicitação ao almoxarifado',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceOrderItemDto)
  @IsOptional()
  items?: ServiceOrderItemDto[];

  @ApiProperty({
    example: { team: ['João Silva', 'Maria Santos'] },
    required: false,
  })
  @IsOptional()
  requiredResources?: {
    team?: string[];
  };

  @ApiProperty({ example: '2024-02-15T23:59:59.000Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: ['tech-uuid-1', 'tech-uuid-2'], required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  responsibleIds?: string[];

  @ApiProperty({
    example: [{ item: 'Instalar switches', completed: false }],
    required: false,
  })
  @IsOptional()
  checklist?: Array<{ item: string; completed: boolean }>;

  @ApiProperty({ example: 'template-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  checklistTemplateId?: string;
}

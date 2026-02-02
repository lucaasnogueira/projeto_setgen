import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ChecklistItemDto {
  @ApiProperty({ example: 'Equipamentos instalados e testados' })
  @IsString()
  item: string;

  @ApiProperty({ example: true })
  checked: boolean;
}

export class CreateDeliveryDto {
  @ApiProperty({ example: 'service-order-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID da Ordem de Serviço é obrigatório' })
  serviceOrderId: string;

  @ApiProperty({ example: '2024-01-30T14:30:00.000Z' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data da entrega é obrigatória' })
  deliveryDate: string;

  @ApiProperty({ example: 'João Silva - Gerente de TI' })
  @IsString()
  @IsNotEmpty({ message: 'Nome de quem recebeu é obrigatório' })
  receivedBy: string;

  @ApiProperty({
    type: [ChecklistItemDto],
    example: [
      { item: 'Instalação concluída', checked: true },
      { item: 'Testes realizados', checked: true },
      { item: 'Documentação entregue', checked: true },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist: ChecklistItemDto[];

  @ApiProperty({
    example: 'Cliente satisfeito com o serviço prestado',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

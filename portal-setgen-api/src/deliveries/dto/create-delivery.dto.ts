import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';

// Este endpoint aceita multipart/form-data (por causa das evidências), e em
// multipart todo campo chega como string: `checked` vira "true" e o array
// inteiro costuma vir como um único campo JSON. Sem estas coerções o checklist
// era impossível de enviar por multipart — o endpoint só funcionava em JSON.
const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string') {
    if (['true', '1', 'on'].includes(value.toLowerCase())) return true;
    if (['false', '0', 'off'].includes(value.toLowerCase())) return false;
  }
  return value;
};

class ChecklistItemDto {
  @ApiProperty({ example: 'Equipamentos instalados e testados' })
  @IsString()
  item: string;

  @ApiProperty({ example: true })
  @Transform(toBoolean)
  @IsBoolean()
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
  // @Transform e @Type na mesma propriedade se anulam: quando há Transform, o
  // class-transformer não aplica mais a conversão de tipo do @Type, os itens
  // ficam objetos crus e o `forbidNonWhitelisted` recusa cada campo deles. Por
  // isso o próprio Transform instancia o DTO aninhado (o que também dispara o
  // @Transform de `checked`). O @Type fica só para o Swagger.
  @Transform(({ value }) => {
    let raw: unknown = value;

    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        return value; // deixa a validação reclamar com mensagem própria
      }
    }

    return Array.isArray(raw) ? plainToInstance(ChecklistItemDto, raw) : raw;
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

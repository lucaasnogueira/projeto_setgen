import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateVisitTaskTypeDto {
  @ApiProperty({ example: 'Visita Técnica Mensal' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    example: 'checklist-template-uuid-here',
    required: false,
    description: 'Questionário pré-selecionado ao escolher este tipo de tarefa',
  })
  @IsUUID()
  @IsOptional()
  defaultChecklistTemplateId?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

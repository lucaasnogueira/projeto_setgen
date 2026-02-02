import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class ApproveDto {
  @ApiProperty({
    example: 'Escopo aprovado. Pode prosseguir com a execução.',
    required: false,
  })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class RejectDto {
  @ApiProperty({
    example: 'Escopo precisa ser revisado. Valores acima do orçamento.',
  })
  @IsString()
  @MinLength(10, {
    message: 'Comentário de rejeição deve ter no mínimo 10 caracteres',
  })
  comments: string;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'Título do template é obrigatório' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Conteúdo do template é obrigatório' })
  templateContent: string;
}


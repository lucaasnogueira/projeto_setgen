import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class ExtractUrlDto {
  @IsString()
  @IsNotEmpty({ message: 'URL é obrigatória' })
  url: string;
}


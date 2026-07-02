import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ClientTaxonomyKind } from '@prisma/client';

export class CreateClientTaxonomyDto {
  @ApiProperty({ enum: ClientTaxonomyKind })
  @IsEnum(ClientTaxonomyKind)
  kind: ClientTaxonomyKind;

  @ApiProperty({ example: 'Varejo' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

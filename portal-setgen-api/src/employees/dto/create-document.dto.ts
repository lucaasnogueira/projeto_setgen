import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateEmployeeDocumentDto {
  @ApiProperty({ example: 'RG - João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do documento é obrigatório' })
  name: string;

  @ApiPropertyOptional({ example: 'RG' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'employee-id' })
  @IsString()
  @IsNotEmpty({ message: 'ID do funcionário é obrigatório' })
  employeeId: string;
}

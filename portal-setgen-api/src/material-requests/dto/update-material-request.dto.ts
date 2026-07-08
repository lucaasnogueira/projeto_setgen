import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsDateString, Min } from 'class-validator';

export class UpdateMaterialRequestDto {
  @ApiProperty({ example: 1, required: false, description: 'Quanto maior, mais prioritário' })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  expectedExecutionDate?: string;
}

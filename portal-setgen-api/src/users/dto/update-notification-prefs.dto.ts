import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPrefsDto {
  @ApiProperty({ description: 'Aprovações pendentes de OS', required: false })
  @IsBoolean()
  @IsOptional()
  approvals?: boolean;

  @ApiProperty({ description: 'Alertas de estoque baixo', required: false })
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;

  @ApiProperty({ description: 'Solicitações de abastecimento', required: false })
  @IsBoolean()
  @IsOptional()
  fuelRequests?: boolean;

  @ApiProperty({ description: 'Solicitações de material', required: false })
  @IsBoolean()
  @IsOptional()
  materialRequests?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.RECEIVED })
  @IsEnum(PaymentStatus, { message: 'Status de pagamento inválido' })
  paymentStatus: PaymentStatus;
}

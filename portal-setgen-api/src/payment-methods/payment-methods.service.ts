import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly = false) {
    const where: any = {};
    if (activeOnly) {
      where.active = true;
    }
    return this.prisma.paymentMethodConfig.findMany({
      where,
      orderBy: { description: 'asc' },
    });
  }

  async findOne(id: string) {
    const method = await this.prisma.paymentMethodConfig.findUnique({
      where: { id },
    });

    if (!method) {
      throw new NotFoundException(`Forma de pagamento com ID ${id} não encontrada`);
    }

    return method;
  }

  async create(dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethodConfig.create({
      data: {
        description: dto.description,
        maxInstallments: dto.maxInstallments,
        bankAccount: dto.bankAccount,
        gatewayOrModality: dto.gatewayOrModality,
        feePercentage: dto.feePercentage ?? 0,
        feeFixedAmount: dto.feeFixedAmount ?? 0,
        settlementPeriodDays: dto.settlementPeriodDays ?? 0,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    await this.findOne(id);

    return this.prisma.paymentMethodConfig.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.maxInstallments !== undefined && { maxInstallments: dto.maxInstallments }),
        ...(dto.bankAccount !== undefined && { bankAccount: dto.bankAccount }),
        ...(dto.gatewayOrModality !== undefined && { gatewayOrModality: dto.gatewayOrModality }),
        ...(dto.feePercentage !== undefined && { feePercentage: dto.feePercentage }),
        ...(dto.feeFixedAmount !== undefined && { feeFixedAmount: dto.feeFixedAmount }),
        ...(dto.settlementPeriodDays !== undefined && { settlementPeriodDays: dto.settlementPeriodDays }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async toggleActive(id: string) {
    const method = await this.findOne(id);
    return this.prisma.paymentMethodConfig.update({
      where: { id },
      data: { active: !method.active },
    });
  }
}


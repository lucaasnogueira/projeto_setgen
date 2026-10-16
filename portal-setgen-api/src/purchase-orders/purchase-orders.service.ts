import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { Prisma, PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count();
    return `OC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(
    dto: CreatePurchaseOrderDto,
    fileUrl?: string,
    uploadedById?: string,
  ) {
    const orderNumber = dto.orderNumber?.trim() || (await this.generateOrderNumber());

    // Total Amount calculation
    let calculatedTotal = 0;
    const items = Array.isArray(dto.items) ? dto.items : [];
    if (items.length > 0) {
      calculatedTotal = items.reduce((acc, it) => {
        const qty = Number(it.quantity || it.qty || 1);
        const price = Number(it.unitPrice || it.price || 0);
        return acc + qty * price;
      }, 0);
    }
    const finalAmount = dto.totalAmount !== undefined ? dto.totalAmount : (calculatedTotal || dto.value || 0);

    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const pickupDate = dto.pickupDate ? new Date(dto.pickupDate) : null;

    return this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierName: dto.supplierName,
        supplierCnpj: dto.supplierCnpj || null,
        supplierPhone: dto.supplierPhone || null,
        supplierAddress: dto.supplierAddress || null,
        supplierId: dto.supplierId || null,
        carrierName: dto.carrierName,
        carrierDoc: dto.carrierDoc || null,
        carrierVehicle: dto.carrierVehicle || null,
        destination: dto.destination || null,
        serviceOrderId: dto.serviceOrderId || null,
        paymentMethod: dto.paymentMethod || null,
        items: items as unknown as Prisma.InputJsonValue,
        totalAmount: finalAmount,
        value: finalAmount,
        issueDate,
        pickupDate,
        pickupStatus: dto.pickupStatus || 'PENDING',
        status: PurchaseOrderStatus.APPROVED,
        notes: dto.notes || null,
        fileUrl: fileUrl || null,
        uploadedById: uploadedById || null,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(query?: { search?: string; status?: string }) {
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (query?.status && query.status !== 'ALL') {
      where.pickupStatus = query.status;
    }

    if (query?.search) {
      const s = query.search.toLowerCase();
      where.OR = [
        { orderNumber: { contains: s, mode: 'insensitive' } },
        { supplierName: { contains: s, mode: 'insensitive' } },
        { carrierName: { contains: s, mode: 'insensitive' } },
        { destination: { contains: s, mode: 'insensitive' } },
      ];
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!po) {
      throw new NotFoundException('Ordem de Compra / Retirada não encontrada');
    }

    return po;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    await this.findOne(id);

    let calculatedTotal: number | undefined = undefined;
    if (dto.items && Array.isArray(dto.items)) {
      calculatedTotal = dto.items.reduce((acc, it) => {
        const qty = Number(it.quantity || it.qty || 1);
        const price = Number(it.unitPrice || it.price || 0);
        return acc + qty * price;
      }, 0);
    }

    const data: Prisma.PurchaseOrderUpdateInput = {};

    if (dto.orderNumber) data.orderNumber = dto.orderNumber;
    if (dto.supplierName !== undefined) data.supplierName = dto.supplierName;
    if (dto.supplierCnpj !== undefined) data.supplierCnpj = dto.supplierCnpj;
    if (dto.supplierPhone !== undefined) data.supplierPhone = dto.supplierPhone;
    if (dto.supplierAddress !== undefined) data.supplierAddress = dto.supplierAddress;
    if (dto.supplierId !== undefined) data.supplierId = dto.supplierId;
    if (dto.carrierName !== undefined) data.carrierName = dto.carrierName;
    if (dto.carrierDoc !== undefined) data.carrierDoc = dto.carrierDoc;
    if (dto.carrierVehicle !== undefined) data.carrierVehicle = dto.carrierVehicle;
    if (dto.destination !== undefined) data.destination = dto.destination;
    if (dto.serviceOrderId !== undefined) data.serviceOrderId = dto.serviceOrderId;
    if (dto.paymentMethod !== undefined) data.paymentMethod = dto.paymentMethod;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.pickupStatus !== undefined) data.pickupStatus = dto.pickupStatus;
    if (dto.pickupDate !== undefined) {
      data.pickupDate = dto.pickupDate ? new Date(dto.pickupDate) : null;
    }
    if (dto.issueDate !== undefined) {
      data.issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    }
    if (dto.items !== undefined) {
      data.items = dto.items as unknown as Prisma.InputJsonValue;
    }

    const finalAmount = dto.totalAmount !== undefined ? dto.totalAmount : calculatedTotal;
    if (finalAmount !== undefined) {
      data.totalAmount = finalAmount;
      data.value = finalAmount;
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const all = await this.prisma.purchaseOrder.findMany({
      select: {
        id: true,
        pickupStatus: true,
        totalAmount: true,
        value: true,
        createdAt: true,
      },
    });

    const total = all.length;
    const pending = all.filter((o) => (o.pickupStatus || 'PENDING') === 'PENDING').length;
    const completed = all.filter((o) => o.pickupStatus === 'COMPLETED').length;
    const cancelled = all.filter((o) => o.pickupStatus === 'CANCELLED').length;
    const totalValue = all.reduce((acc, o) => acc + Number(o.totalAmount || o.value || 0), 0);

    return {
      total,
      pending,
      completed,
      cancelled,
      totalValue,
    };
  }
}

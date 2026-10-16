import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDocumentDto } from './dto/create-order-document.dto';
import { UpdateOrderDocumentDto } from './dto/update-order-document.dto';
import { DocumentType, DocumentStatus } from '@prisma/client';

@Injectable()
export class OrderDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateDefaultCode(type: DocumentType, orderNumber: string): string {
    const cleanNum = orderNumber.replace(/[^0-9]/g, '').slice(-4) || '001';
    const year = new Date().getFullYear();

    switch (type) {
      case DocumentType.APR:
        return `AP${year}-${cleanNum}`;
      case DocumentType.WORK_PERMIT:
        return `PT${year}-${cleanNum}`;
      case DocumentType.ACCEPTANCE_TERM:
        return `TE${year}-${cleanNum}`;
      case DocumentType.TECHNICAL_REPORT:
        return `RT${year}-${cleanNum}`;
      case DocumentType.CONTRACT:
        return `CT${year}-${cleanNum}`;
      case DocumentType.ART:
        return `ART${year}-${cleanNum}`;
      default:
        return `DOC${year}-${cleanNum}`;
    }
  }

  async create(dto: CreateOrderDocumentDto, userId?: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: dto.serviceOrderId },
      select: { id: true, clientId: true, orderNumber: true },
    });

    if (!order) {
      throw new NotFoundException(`Ordem de Serviço com ID ${dto.serviceOrderId} não encontrada.`);
    }

    const code = dto.code?.trim() || this.generateDefaultCode(dto.type, order.orderNumber);

    return this.prisma.serviceOrderDocument.create({
      data: {
        serviceOrderId: order.id,
        clientId: order.clientId,
        type: dto.type,
        code,
        title: dto.title.trim(),
        status: dto.status || DocumentStatus.DRAFT,
        data: dto.data ?? {},
        signatures: dto.signatures ?? null,
        pdfUrl: dto.pdfUrl ?? null,
        notes: dto.notes?.trim() ?? null,
        createdById: userId ?? null,
      },
      include: {
        serviceOrder: {
          select: { id: true, orderNumber: true, scope: true },
        },
        client: {
          select: { id: true, companyName: true, tradeName: true, cnpjCpf: true },
        },
      },
    });
  }

  async findAll(filters?: {
    clientId?: string;
    serviceOrderId?: string;
    type?: DocumentType;
    status?: DocumentStatus;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.serviceOrderId) {
      where.serviceOrderId = filters.serviceOrderId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { client: { companyName: { contains: term, mode: 'insensitive' } } },
        { serviceOrder: { orderNumber: { contains: term, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.serviceOrderDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        serviceOrder: {
          select: { id: true, orderNumber: true, scope: true },
        },
        client: {
          select: { id: true, companyName: true, tradeName: true, cnpjCpf: true },
        },
      },
    });
  }

  async findByOrder(serviceOrderId: string) {
    return this.prisma.serviceOrderDocument.findMany({
      where: { serviceOrderId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, companyName: true, tradeName: true, cnpjCpf: true },
        },
      },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.serviceOrderDocument.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        serviceOrder: {
          select: { id: true, orderNumber: true, scope: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.serviceOrderDocument.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          include: {
            client: true,
            equipment: true,
            quote: true,
          },
        },
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Documento com ID ${id} não encontrado.`);
    }

    return doc;
  }

  async update(id: string, dto: UpdateOrderDocumentDto) {
    await this.findOne(id);

    return this.prisma.serviceOrderDocument.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.code && { code: dto.code.trim() }),
        ...(dto.type && { type: dto.type }),
        ...(dto.status && { status: dto.status }),
        ...(dto.data !== undefined && { data: dto.data }),
        ...(dto.signatures !== undefined && { signatures: dto.signatures }),
        ...(dto.pdfUrl !== undefined && { pdfUrl: dto.pdfUrl }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        serviceOrder: {
          select: { id: true, orderNumber: true, scope: true },
        },
        client: {
          select: { id: true, companyName: true, tradeName: true, cnpjCpf: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.serviceOrderDocument.delete({
      where: { id },
    });
  }
}


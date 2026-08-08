import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotesService } from '../quotes/quotes.service';
import { ApproveDto, RejectDto } from './dto/approve-reject.dto';
import { ApprovalStatus, QuoteStatus, UserRole } from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private quotesService: QuotesService,
  ) {}

  async approve(quoteId: string, dto: ApproveDto, approverId: string, approverRole: UserRole) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quote.status !== QuoteStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Apenas orçamentos aguardando aprovação podem ser aprovados por este fluxo',
      );
    }

    const approval = await this.prisma.approval.create({
      data: {
        quote: { connect: { id: quoteId } },
        approver: { connect: { id: approverId } },
        status: ApprovalStatus.APPROVED,
        comments: dto.comments || 'Aprovado',
      },
      include: {
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Fonte única de verdade pra transição de status + cobrar visita etc.
    const updatedQuote = await this.quotesService.updateStatus(
      quoteId,
      { status: QuoteStatus.APPROVED, comments: dto.comments },
      approverId,
      approverRole,
    );

    return {
      ...approval,
      quote: { id: updatedQuote.id, quoteNumber: updatedQuote.quoteNumber, status: updatedQuote.status },
    };
  }

  async reject(quoteId: string, dto: RejectDto, approverId: string, approverRole: UserRole) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (
      quote.status === QuoteStatus.ACCEPTED ||
      quote.status === QuoteStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Não é possível rejeitar orçamento com status ${quote.status}`,
      );
    }

    const approval = await this.prisma.approval.create({
      data: {
        quote: { connect: { id: quoteId } },
        approver: { connect: { id: approverId } },
        status: ApprovalStatus.REJECTED,
        comments: dto.comments,
      },
      include: {
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const updatedQuote = await this.quotesService.updateStatus(
      quoteId,
      { status: QuoteStatus.REJECTED, comments: dto.comments },
      approverId,
      approverRole,
    );

    return {
      ...approval,
      quote: {
        id: updatedQuote.id,
        quoteNumber: updatedQuote.quoteNumber,
        status: updatedQuote.status,
        createdBy: quote.createdBy,
      },
    };
  }

  async findAll(filters?: { quoteId?: string; approverId?: string }) {
    const where: any = {
      ...(filters?.quoteId && { quoteId: filters.quoteId }),
      ...(filters?.approverId && { approverId: filters.approverId }),
    };

    return this.prisma.approval.findMany({
      where,
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            type: true,
            status: true,
            client: { select: { id: true, companyName: true, tradeName: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { approvedAt: 'desc' },
    });
  }

  async findByQuote(quoteId: string) {
    return this.prisma.approval.findMany({
      where: { quoteId },
      include: {
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { approvedAt: 'desc' },
    });
  }

  async findPendingApprovals() {
    return this.prisma.quote.findMany({
      where: { status: QuoteStatus.PENDING_APPROVAL },
      include: {
        client: { select: { id: true, companyName: true, tradeName: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        technicalVisit: { select: { id: true, visitDate: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getApprovalStatistics() {
    const total = await this.prisma.approval.count();

    const byStatus = await this.prisma.approval.groupBy({
      by: ['status'],
      _count: true,
    });

    const pending = await this.prisma.quote.count({
      where: { status: QuoteStatus.PENDING_APPROVAL },
    });

    return {
      total,
      pending,
      approved: byStatus.find((s) => s.status === ApprovalStatus.APPROVED)?._count || 0,
      rejected: byStatus.find((s) => s.status === ApprovalStatus.REJECTED)?._count || 0,
    };
  }
}

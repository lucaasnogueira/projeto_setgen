import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotesService } from '../quotes/quotes.service';
import { ApproveDto, RejectDto } from './dto/approve-reject.dto';
import { ApprovalStatus, QuoteStatus } from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private quotesService: QuotesService,
  ) {}

  async approve(quoteId: string, dto: ApproveDto, approverId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quote.status !== QuoteStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Apenas orçamentos aguardando aprovação podem ser aprovados por este fluxo',
      );
    }

    // Valida a transição ANTES de gravar a aprovação: senão um status inválido
    // deixava a linha de Approval no histórico e o orçamento parado.
    this.quotesService.assertTransitionAllowed(quote.status, QuoteStatus.APPROVED);

    return this.recordDecision(quote, ApprovalStatus.APPROVED, dto.comments || 'Aprovado', approverId);
  }

  async reject(quoteId: string, dto: RejectDto, approverId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // A própria máquina de estados diz de onde dá pra rejeitar — a checagem
    // solta de ACCEPTED/CANCELLED deixava passar DRAFT, APPROVED e EXPIRED,
    // que gravavam a aprovação e só então estouravam.
    this.quotesService.assertTransitionAllowed(quote.status, QuoteStatus.REJECTED);

    const result = await this.recordDecision(
      quote,
      ApprovalStatus.REJECTED,
      dto.comments,
      approverId,
    );

    return {
      ...result,
      quote: { ...result.quote, createdBy: quote.createdBy },
    };
  }

  /**
   * Grava a aprovação e a transição de status na mesma transação: ou as duas
   * coisas acontecem, ou nenhuma.
   */
  private async recordDecision(
    quote: { id: string; status: QuoteStatus; technicalVisitId: string | null },
    decision: ApprovalStatus,
    comments: string | undefined,
    approverId: string,
  ) {
    const nextStatus =
      decision === ApprovalStatus.APPROVED ? QuoteStatus.APPROVED : QuoteStatus.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.approval.create({
        data: {
          quote: { connect: { id: quote.id } },
          approver: { connect: { id: approverId } },
          status: decision,
          comments,
        },
        include: {
          approver: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      const updatedQuote = await this.quotesService.applyApprovalDecision(
        quote,
        nextStatus,
        approverId,
        comments,
        tx,
      );

      return {
        ...approval,
        quote: {
          id: updatedQuote.id,
          quoteNumber: updatedQuote.quoteNumber,
          status: updatedQuote.status,
        },
      };
    });
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

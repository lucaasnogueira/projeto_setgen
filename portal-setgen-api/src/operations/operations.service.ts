import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ServiceOrderStatus,
  QuoteStatus,
  VisitStatus,
  DocumentType,
  DocumentStatus,
  PaymentStatus,
} from '@prisma/client';

function cleanServiceType(scope?: string | null): string {
  if (!scope) return 'Instalações Elétricas';
  const clean = scope.replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();

  if (lower.includes('gerador') || lower.includes('grupo gerador')) return 'Geradores de Energia';
  if (lower.includes('subesta') || lower.includes('cabine') || lower.includes('transformador')) return 'Subestações & Cabine';
  if (lower.includes('preventiv')) return 'Manutenção Preventiva';
  if (lower.includes('corretiv')) return 'Manutenção Corretiva';
  if (lower.includes('spda') || lower.includes('para-raio') || lower.includes('aterramento')) return 'Laudo SPDA / Para-raios';
  if (lower.includes('eletric') || lower.includes('painel') || lower.includes('quadro')) return 'Instalações Elétricas';
  if (lower.includes('comissionamento')) return 'Comissionamento Técnico';

  const firstPart = clean.split(/[.•\n,;]/)[0].trim();
  if (firstPart.length > 28) {
    return firstPart.substring(0, 25).trim() + '...';
  }
  return firstPart || 'Serviços de Engenharia';
}

export interface ProcessStageDto {
  id: string;
  name: string;
  shortName: string;
  status: 'completed' | 'in_progress' | 'pending' | 'optional';
  code?: string;
  detail?: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  isOptional?: boolean;
  date?: string;
  documentId?: string;
  visitId?: string;
}

export interface ClientProcessDto {
  id: string;
  clientId: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  city: string;
  recordsCount: number;
  lastUpdate: string;
  serviceType: string;
  serviceCategory: string;
  fullScope?: string;
  isSuggested?: boolean;
  statusCategory: 'em_andamento' | 'aguardando_fechar' | 'concluidos' | 'perdidos';
  alert?: {
    message: string;
    actionText: string;
    variant: 'amber' | 'blue' | 'purple' | 'emerald' | 'orange';
    actionType: 'follow_up' | 'emit_art' | 'schedule_os' | 'final_check' | 'invoice' | 'survey';
  };
  materialStatus?: {
    status: 'SEPARADO' | 'PENDENTE' | 'FALTA';
    label: string;
  };
  executionStatus?: {
    status: 'NO_LOCAL' | 'EM_DESLOCAMENTO' | 'AGENDADO' | 'CONCLUIDO';
    label: string;
    time?: string;
  };
  totalAmount: number;
  paidAmount: number;
  currentStepIndex: number;
  serviceOrderId?: string;
  quoteId?: string;
  stages: ProcessStageDto[];
}

export interface PipelineSummaryDto {
  totalProcesses: number;
  inProgress: number;
  awaitingClosing: number;
  completed: number;
  lost: number;
  totalSold: number;
  totalReceived: number;
}

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna a esteira consolidada de processos dos clientes de ponta a ponta
   */
  async getPipeline(): Promise<{ processes: ClientProcessDto[]; summary: PipelineSummaryDto }> {
    // 1. Busca Ordens de Serviço (onde a obra já está em andamento ou finalizada)
    const serviceOrders = await this.prisma.serviceOrder.findMany({
      include: {
        client: true,
        quote: {
          include: {
            quoteLines: true,
          },
        },
        linkedVisits: {
          include: {
            technicalVisit: {
              include: { technician: true },
            },
          },
        },
        documents: true,
        notasFiscais: true,
        art: true,
        assignedCollaborator: true,
        signature: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const soClientIds = new Set(serviceOrders.map((so) => so.clientId));
    const soQuoteIds = new Set(serviceOrders.map((so) => so.quoteId));

    // 2. Busca orçamentos recentes que ainda NÃO viraram OS (fase comercial / aguardando fechar)
    const pendingQuotes = await this.prisma.quote.findMany({
      where: {
        id: { notIn: Array.from(soQuoteIds) },
        status: { not: QuoteStatus.CANCELLED },
      },
      include: {
        client: true,
        technicalVisit: {
          include: { technician: true },
        },
        quoteLines: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });

    // 3. Busca visitas técnicas recentes sem orçamento vinculado (fase inicial de levantamento)
    const quoteVisitIds = new Set(
      pendingQuotes
        .map((q) => q.technicalVisitId)
        .filter((id): id is string => Boolean(id)),
    );

    const pendingVisits = await this.prisma.technicalVisit.findMany({
      where: {
        id: { notIn: Array.from(quoteVisitIds) },
        status: { in: [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS, VisitStatus.COMPLETED] },
        clientId: { notIn: Array.from(soClientIds) },
      },
      include: {
        client: true,
        technician: true,
      },
      orderBy: { visitDate: 'desc' },
      take: 20,
    });

    const processes: ClientProcessDto[] = [];

    // Mapeia Ordens de Serviço
    for (const so of serviceOrders) {
      const client = so.client;
      const quote = so.quote;
      const docs = so.documents || [];
      const nfs = so.notasFiscais || [];

      // Identifica documentos específicos
      const contractDoc = docs.find((d) => d.type === DocumentType.CONTRACT);
      const artDoc = docs.find((d) => d.type === DocumentType.ART) || so.art;
      const acceptanceDoc = docs.find((d) => d.type === DocumentType.ACCEPTANCE_TERM);
      const vistoriaDoc = docs.find(
        (d) =>
          d.code?.startsWith('VF') ||
          d.title?.toLowerCase().includes('vistoria') ||
          (d.data as any)?.subType === 'FINAL_INSPECTION' ||
          d.type === DocumentType.OTHER
      );

      // Visitas técnicas
      const firstVisit = so.linkedVisits?.[0]?.technicalVisit;
      const finalVisit = so.linkedVisits?.find(
        (v) => v.technicalVisit.visitType === 'TECHNICAL' && v.technicalVisit.status === VisitStatus.COMPLETED,
      )?.technicalVisit;

      // Status geral do processo
      let statusCategory: ClientProcessDto['statusCategory'] = 'em_andamento';
      if (so.status === ServiceOrderStatus.COMPLETED) {
        statusCategory = 'concluidos';
      } else if (so.status === ServiceOrderStatus.CANCELLED) {
        statusCategory = 'perdidos';
      }

      // Alerta operacional inteligente
      let alert: ClientProcessDto['alert'] = {
        message: 'Serviço em execução - Equipe em campo',
        actionText: 'Ver OS',
        variant: 'blue',
        actionType: 'schedule_os',
      };

      if (!artDoc) {
        alert = {
          message: 'Aguardando emissão da ART para conformidade técnica',
          actionText: '+ Emitir ART',
          variant: 'amber',
          actionType: 'emit_art',
        };
      } else if (so.status === ServiceOrderStatus.COMPLETED && !acceptanceDoc) {
        alert = {
          message: 'Execução finalizada - Coletar Termo de Aceite do cliente',
          actionText: '+ Termo de Aceite',
          variant: 'purple',
          actionType: 'final_check',
        };
      } else if (so.status === ServiceOrderStatus.COMPLETED && acceptanceDoc && nfs.length === 0) {
        alert = {
          message: 'Termo de Aceite aprovado - Liberado para emissão de Nota Fiscal',
          actionText: '+ Emitir NF',
          variant: 'emerald',
          actionType: 'invoice',
        };
      }

      // Calcula o valor total com segurança (se totalAmount for 0, soma as quoteLines ou define valor da OS)
      let totalVal = Number(quote?.totalAmount || 0);
      if (totalVal === 0 && (quote as any)?.quoteLines && (quote as any).quoteLines.length > 0) {
        totalVal = (quote as any).quoteLines.reduce((acc: number, l: any) => acc + Number(l.totalValue || 0), 0);
      }
      if (totalVal === 0) {
        totalVal = Number(so.grossRevenueReal || 0) || 5400;
      }

      let paidVal = so.paymentStatus === PaymentStatus.RECEIVED ? totalVal : (nfs.length > 0 ? totalVal : 0);
      if (so.status === ServiceOrderStatus.COMPLETED && paidVal === 0) {
        paidVal = totalVal; // Se concluída, faturada e liquidada no Conta Azul
      }

      const materialStatus: ClientProcessDto['materialStatus'] =
        so.status === ServiceOrderStatus.AWAITING_MATERIALS
          ? { status: 'PENDENTE', label: 'Aguardando Separação no Almoxarifado' }
          : { status: 'SEPARADO', label: 'Materiais Liberados pelo Almoxarife' };

      let executionStatus: ClientProcessDto['executionStatus'] = {
        status: 'AGENDADO',
        label: 'Execução Agendada',
      };

      if (firstVisit?.checkinAt && !firstVisit?.checkoutAt) {
        executionStatus = {
          status: 'NO_LOCAL',
          label: 'Equipe no Local',
          time: `Check-in ${new Date(firstVisit.checkinAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        };
      } else if (firstVisit?.checkoutAt) {
        executionStatus = {
          status: 'CONCLUIDO',
          label: 'Equipe Finalizou',
          time: `Check-out ${new Date(firstVisit.checkoutAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        };
      } else if (so.status === ServiceOrderStatus.IN_PROGRESS) {
        executionStatus = {
          status: 'NO_LOCAL',
          label: 'Em Execução em Campo',
        };
      }

      // Mapeamento das 9 etapas
      const stages: ProcessStageDto[] = [
        {
          id: 'visita',
          name: 'Visita / levantamento',
          shortName: 'Visita',
          status: firstVisit?.status === VisitStatus.COMPLETED ? 'completed' : firstVisit ? 'in_progress' : 'completed',
          code: firstVisit?.visitNumber || (firstVisit ? `VIS-${firstVisit.id.slice(0, 6)}` : undefined),
          detail: firstVisit ? `Realizada ${new Date(firstVisit.visitDate).toLocaleDateString('pt-BR')}` : 'Levantamento inicial',
          hasAttachment: Boolean(firstVisit?.attachments && firstVisit.attachments.length > 0),
          date: firstVisit ? new Date(firstVisit.visitDate).toLocaleDateString('pt-BR') : undefined,
          visitId: firstVisit?.id,
        },
        {
          id: 'orcamento',
          name: 'Orçamento',
          shortName: 'Orçamento',
          status: 'completed',
          code: quote?.quoteNumber || `POT-${so.id.slice(0, 6)}`,
          detail: totalVal > 0 ? `Aprovado - R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Aprovado',
          hasAttachment: true,
          attachmentName: `Proposta_${quote?.quoteNumber || 'Aprovada'}.pdf`,
          date: quote?.createdAt ? new Date(quote.createdAt).toLocaleDateString('pt-BR') : undefined,
        },
        {
          id: 'contrato',
          name: 'Contrato (opcional)',
          shortName: 'Contrato',
          status: contractDoc ? 'completed' : 'optional',
          code: contractDoc?.code || undefined,
          detail: contractDoc ? 'Assinado' : undefined,
          isOptional: true,
          hasAttachment: Boolean(contractDoc),
          documentId: contractDoc?.id,
        },
        {
          id: 'art',
          name: 'ART (opcional)',
          shortName: 'ART',
          status: artDoc ? 'completed' : 'pending',
          code: (artDoc as any)?.artNumber || (artDoc as any)?.code || undefined,
          detail: artDoc ? 'Emitida CREA/CFT' : 'Pendente de emissão',
          isOptional: true,
          hasAttachment: Boolean(artDoc),
        },
        {
          id: 'ordem_servico',
          name: 'Ordem de serviço',
          shortName: 'OS',
          status: so.status === ServiceOrderStatus.COMPLETED ? 'completed' : so.status === ServiceOrderStatus.IN_PROGRESS ? 'in_progress' : 'pending',
          code: so.orderNumber,
          detail: so.status === ServiceOrderStatus.COMPLETED ? 'Concluída' : `Em Execução (${so.progress || 50}%)`,
          hasAttachment: Boolean(so.attachments && so.attachments.length > 0),
          date: new Date(so.createdAt).toLocaleDateString('pt-BR'),
        },
        {
          id: 'vistoria_final',
          name: 'Vistoria final',
          shortName: 'Vistoria',
          status: vistoriaDoc || finalVisit?.status === VisitStatus.COMPLETED ? 'completed' : finalVisit ? 'in_progress' : 'pending',
          code: vistoriaDoc?.code || finalVisit?.visitNumber || undefined,
          detail: vistoriaDoc
            ? 'Vistoria Final Concluída'
            : finalVisit
            ? 'Comissionamento Realizado'
            : 'Aguardando vistoria',
          hasAttachment: Boolean(vistoriaDoc || (finalVisit?.attachments && finalVisit.attachments.length > 0)),
          documentId: vistoriaDoc?.id,
          visitId: finalVisit?.id,
          date: vistoriaDoc?.createdAt ? new Date(vistoriaDoc.createdAt).toLocaleDateString('pt-BR') : undefined,
        },
        {
          id: 'termo_aceite',
          name: 'Termo de aceite',
          shortName: 'Aceite',
          status: acceptanceDoc || Boolean(so.signature) ? 'completed' : 'pending',
          code: acceptanceDoc?.code || (so.signature ? 'ASSINADO' : undefined),
          detail: acceptanceDoc || so.signature ? 'Assinado pelo Cliente' : 'Aguardando Coleta da Assinatura',
          hasAttachment: Boolean(acceptanceDoc || so.signature),
          documentId: acceptanceDoc?.id,
        },
        {
          id: 'recibo_nf',
          name: 'Faturamento (Conta Azul)',
          shortName: 'Conta Azul',
          status: nfs.length > 0 || so.paymentStatus === PaymentStatus.RECEIVED ? 'completed' : 'pending',
          code: nfs[0]?.numero ? `NF-e ${nfs[0].numero}` : undefined,
          detail: nfs.length > 0 ? `Sincronizado Conta Azul · NF-e ${nfs[0].numero}` : (so.paymentStatus === PaymentStatus.RECEIVED ? 'Faturado / Liquidado' : 'Aguardando Emissão Conta Azul'),
          hasAttachment: nfs.length > 0,
        },
        {
          id: 'pos_venda',
          name: 'Pós-venda (opcional)',
          shortName: 'Pós-Venda',
          status: 'optional',
          detail: 'Pesquisa / Contrato de Manutenção',
          isOptional: true,
          hasAttachment: false,
        },
      ];

      processes.push({
        id: `proc-so-${so.id}`,
        clientId: client.id,
        clientName: client.companyName || client.tradeName || 'Cliente Setgen',
        contactPerson: client.onSiteContact || 'Responsável Técnico',
        phone: client.phone || '',
        city: (client.address as any)?.city ? `${(client.address as any).city} - ${(client.address as any).state || 'PR'}` : 'Paraná',
        recordsCount: docs.length + (so.linkedVisits?.length || 0) + 1,
        lastUpdate: new Date(so.updatedAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        serviceType: cleanServiceType(so.scope),
        serviceCategory: 'eletrica',
        fullScope: so.scope || undefined,
        statusCategory,
        alert,
        materialStatus,
        executionStatus,
        totalAmount: totalVal,
        paidAmount: paidVal,
        currentStepIndex: so.status === ServiceOrderStatus.COMPLETED ? 8 : 4,
        serviceOrderId: so.id,
        quoteId: quote?.id,
        stages,
      });
    }

    // Mapeia Orçamentos Pendentes (Fase Comercial)
    for (const quote of pendingQuotes) {
      const client = quote.client;
      const visit = quote.technicalVisit;
      let totalVal = Number(quote.totalAmount || 0);
      if (totalVal === 0 && (quote as any)?.quoteLines && (quote as any).quoteLines.length > 0) {
        totalVal = (quote as any).quoteLines.reduce((acc: number, l: any) => acc + Number(l.totalValue || 0), 0);
      }
      if (totalVal === 0) {
        totalVal = 3800; // Valor estimado da proposta
      }

      const isAwaiting =
        quote.status === QuoteStatus.SENT_TO_CLIENT ||
        quote.status === QuoteStatus.AWAITING_RESPONSE ||
        quote.status === QuoteStatus.DRAFT;

      const stages: ProcessStageDto[] = [
        {
          id: 'visita',
          name: 'Visita / levantamento',
          shortName: 'Visita',
          status: visit?.status === VisitStatus.COMPLETED ? 'completed' : visit ? 'in_progress' : 'completed',
          code: visit?.visitNumber || (visit ? `VIS-${visit.id.slice(0, 6)}` : undefined),
          detail: visit ? `Realizada ${new Date(visit.visitDate).toLocaleDateString('pt-BR')}` : 'Levantamento técnico',
          hasAttachment: true,
          visitId: visit?.id,
        },
        {
          id: 'orcamento',
          name: 'Orçamento',
          shortName: 'Orçamento',
          status: quote.status === QuoteStatus.ACCEPTED ? 'completed' : 'in_progress',
          code: quote.quoteNumber,
          detail: `Enviado - R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          hasAttachment: true,
          date: new Date(quote.createdAt).toLocaleDateString('pt-BR'),
        },
        { id: 'contrato', name: 'Contrato (opcional)', shortName: 'Contrato', status: 'pending', isOptional: true },
        { id: 'art', name: 'ART (opcional)', shortName: 'ART', status: 'pending', isOptional: true },
        { id: 'ordem_servico', name: 'Ordem de serviço', shortName: 'OS', status: 'pending' },
        { id: 'vistoria_final', name: 'Vistoria final', shortName: 'Vistoria', status: 'pending' },
        { id: 'termo_aceite', name: 'Termo de aceite', shortName: 'Aceite', status: 'pending' },
        { id: 'recibo_nf', name: 'Faturamento (Conta Azul)', shortName: 'Conta Azul', status: 'pending', detail: 'Aguardando no Conta Azul' },
        { id: 'pos_venda', name: 'Pós-venda (opcional)', shortName: 'Pós-Venda', status: 'pending', isOptional: true },
      ];

      processes.push({
        id: `proc-quote-${quote.id}`,
        clientId: client.id,
        clientName: client.companyName || client.tradeName || 'Cliente Setgen',
        contactPerson: client.onSiteContact || 'Contato Comercial',
        phone: client.phone || '',
        city: (client.address as any)?.city ? `${(client.address as any).city} - ${(client.address as any).state || 'PR'}` : 'Paraná',
        recordsCount: 1,
        lastUpdate: new Date(quote.updatedAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        serviceType: cleanServiceType(quote.notes),
        serviceCategory: 'eletrica',
        fullScope: quote.notes || undefined,
        statusCategory: isAwaiting ? 'aguardando_fechar' : 'em_andamento',
        alert: {
          message: 'Aguardando o cliente fechar proposta (fazer follow-up comercial)',
          actionText: '+ Follow-up',
          variant: 'amber',
          actionType: 'follow_up',
        },
        totalAmount: totalVal,
        paidAmount: 0,
        currentStepIndex: 1,
        quoteId: quote.id,
        stages,
      });
    }

    // Calcula os totais e sumários
    const totalProcesses = processes.length;
    const inProgress = processes.filter((p) => p.statusCategory === 'em_andamento').length;
    const awaitingClosing = processes.filter((p) => p.statusCategory === 'aguardando_fechar').length;
    const completed = processes.filter((p) => p.statusCategory === 'concluidos').length;
    const lost = processes.filter((p) => p.statusCategory === 'perdidos').length;
    const totalSold = processes.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalReceived = processes.reduce((acc, p) => acc + p.paidAmount, 0);

    return {
      processes,
      summary: {
        totalProcesses,
        inProgress,
        awaitingClosing,
        completed,
        lost,
        totalSold,
        totalReceived,
      },
    };
  }

  /**
   * Retorna os eventos e visitas técnicas reais para o quadro calendário
   */
  async getCalendarVisits(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate && endDate) {
      where.visitDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const visits = await this.prisma.technicalVisit.findMany({
      where,
      include: {
        client: true,
        technician: true,
      },
      orderBy: { visitDate: 'asc' },
      take: 200,
    });

    return visits.map((v) => ({
      id: v.id,
      clientName: v.client.companyName || v.client.tradeName,
      phone: v.client.phone,
      location: v.location,
      date: new Date(v.visitDate).toISOString().split('T')[0],
      time: new Date(v.visitDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration: '2h',
      visitType: v.visitType === 'TECHNICAL' ? 'LEVANTAMENTO' : v.visitType === 'MAINTENANCE' ? 'PREVENTIVA' : 'CORRETIVA',
      status: v.status,
      technician: {
        id: v.technician?.id || '',
        name: v.technician?.name || 'Técnico Não Atribuído',
        team: 'Equipe Técnica Setgen',
      },
      notes: v.description || v.identifiedNeeds || '',
    }));
  }

  async updateStageStatus(processId: string, stageId: string, status: 'completed' | 'in_progress' | 'pending') {
    const soId = processId.startsWith('proc-so-') ? processId.replace('proc-so-', '') : processId;
    const so = await this.prisma.serviceOrder.findUnique({
      where: { id: soId },
      include: {
        documents: true,
        linkedVisits: { include: { technicalVisit: true } },
      },
    });

    if (so) {
      if (stageId === 'vistoria_final') {
        const existingDoc = so.documents?.find(
          (d) =>
            d.code?.startsWith('VF') ||
            d.title?.toLowerCase().includes('vistoria') ||
            (d.data as any)?.subType === 'FINAL_INSPECTION' ||
            d.type === DocumentType.OTHER,
        );

        if (status === 'completed' && !existingDoc) {
          const year = new Date().getFullYear();
          const cleanNum = so.orderNumber.replace(/[^0-9]/g, '').slice(-3) || '001';
          await this.prisma.serviceOrderDocument.create({
            data: {
              serviceOrderId: so.id,
              clientId: so.clientId,
              type: DocumentType.OTHER,
              code: `VF${year}-${cleanNum}`,
              title: `Vistoria Final (SGQ-OPE-04) · OS ${so.orderNumber}`,
              status: DocumentStatus.ACTIVE,
              data: {
                subType: 'FINAL_INSPECTION',
                codigoSgq: 'SGQ-OPE-04 · Rev.00',
                situacaoNaOs: 'Concluída em campo',
                resultado: 'Aprovado',
              },
            },
          });
        }

        if (so.linkedVisits && so.linkedVisits.length > 0) {
          for (const lv of so.linkedVisits) {
            if (lv.technicalVisit.visitType === 'TECHNICAL') {
              await this.prisma.technicalVisit.update({
                where: { id: lv.technicalVisit.id },
                data: { status: status === 'completed' ? VisitStatus.COMPLETED : VisitStatus.IN_PROGRESS },
              });
            }
          }
        }
      } else if (stageId === 'ordem_servico') {
        await this.prisma.serviceOrder.update({
          where: { id: so.id },
          data: { status: status === 'completed' ? ServiceOrderStatus.COMPLETED : ServiceOrderStatus.IN_PROGRESS },
        });
      } else if (stageId === 'termo_aceite') {
        const existingDoc = so.documents?.find((d) => d.type === DocumentType.ACCEPTANCE_TERM);
        if (status === 'completed' && !existingDoc) {
          const year = new Date().getFullYear();
          const cleanNum = so.orderNumber.replace(/[^0-9]/g, '').slice(-3) || '001';
          await this.prisma.serviceOrderDocument.create({
            data: {
              serviceOrderId: so.id,
              clientId: so.clientId,
              type: DocumentType.ACCEPTANCE_TERM,
              code: `TE${year}-${cleanNum}`,
              title: `Termo de Entrega e Aceite · OS ${so.orderNumber}`,
              status: DocumentStatus.ACTIVE,
              data: {
                garantiaMeses: 12,
              },
            },
          });
        }
      }
    }

    return { success: true, processId, stageId, status };
  }
}

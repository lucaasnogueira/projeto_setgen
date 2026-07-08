import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { EmitirNotaMercadoriaDto } from './dto/emitir-nota.dto';
import { FiscalFilterDto } from './dto/fiscal-filter.dto';
import { TaxEngineService, ItemCalculoInput } from './engines/tax-engine.service';
import { XmlGeneratorService } from './xml/xml-generator.service';
import { SignService } from './xml/sign.service';
import { SefazAmService } from './sefaz/sefaz-am.service';
import { WebhookService } from './webhooks/webhook.service';
import { AmbienteNota, StatusNota, MovementType } from '@prisma/client';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly prisma:      PrismaService,
    private readonly taxEngine:   TaxEngineService,
    private readonly xmlGen:      XmlGeneratorService,
    private readonly sign:        SignService,
    private readonly sefazAm:     SefazAmService,
    private readonly webhook:     WebhookService,
    private readonly config:      ConfigService,
  ) {}

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * emitirNotaMercadoria()
   *
   * Orquestra o ciclo completo de emissão de NF-e de mercadoria:
   *   1. Validação de cliente, produtos e estoque disponível
   *   2. Cálculo IBS/CBS 2026 (por fora) + impostos legados (ICMS/PIS/COFINS) + ZFM
   *   3. Geração do XML (NF-e Modelo 55), assinatura XMLDSIG com certificado A1 (.pfx)
   *   4. Transmissão à SEFAZ-AM
   *   5. Persistência no banco (notas_fiscais + itens + impostos_retidos + eventos_sefaz)
   *      e baixa de estoque
   *   6. Dispatch de webhook para o portal principal
   * ─────────────────────────────────────────────────────────────────────────
   */
  async emitirNotaMercadoria(dto: EmitirNotaMercadoriaDto, createdById: string): Promise<{
    notaFiscalId: string;
    numero:       string;
    status:       string;
    protocolo:    string | null;
    chaveAcesso:  string | null;
    calculo:      ReturnType<TaxEngineService['calcular']>;
    splitPayment: object;
  }> {
    this.logger.log(`Iniciando emissão de NF-e mercadoria | Cliente: ${dto.clientId}`);

    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) {
      throw new NotFoundException(`Cliente ${dto.clientId} não encontrado`);
    }

    if (dto.serviceOrderId) {
      const serviceOrder = await this.prisma.serviceOrder.findUnique({
        where: { id: dto.serviceOrderId },
      });
      if (!serviceOrder) {
        throw new NotFoundException(`Ordem de serviço ${dto.serviceOrderId} não encontrada`);
      }
      if (serviceOrder.clientId !== dto.clientId) {
        throw new BadRequestException('A Ordem de Serviço informada não pertence a este cliente');
      }
    }

    const productIds = dto.itens.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    const productById = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.itens) {
      const product = productById.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Produto ${item.productId} não encontrado`);
      }
      if (product.currentStock < item.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para "${product.name}" (disponível: ${product.currentStock}, solicitado: ${item.quantidade})`,
        );
      }
    }

    // ── 1. Motor de Cálculo 2026 ─────────────────────────────────────────────
    const emitenteCnpj = this.config.get<string>('EMITENTE_CNPJ', '10.744.400/0001-65');

    const itensCalculo: ItemCalculoInput[] = dto.itens.map((item) => {
      const product = productById.get(item.productId)!;
      return {
        ncm:           product.ncm || '00000000',
        descricao:     product.name,
        quantidade:    item.quantidade,
        valorUnitario: item.valorUnitario ?? Number(product.unitCost ?? 0),
        fabricadoNaZfm: item.fabricadoNaZfm,
      };
    });

    const calculo = this.taxEngine.calcular(itensCalculo, emitenteCnpj);

    // ── 2. Geração de série/número (em produção: sequencial controlado no BD) ─
    const serie  = '001';
    const numero = await this.gerarProximoNumero();

    // ── 3. Certificado A1 ────────────────────────────────────────────────────
    const pfxPath     = this.config.get<string>('CERT_PFX_PATH', '');
    const pfxPassword = this.config.get<string>('CERT_PFX_PASSWORD', '');
    const pfxBase64   = pfxPath && fs.existsSync(pfxPath)
      ? fs.readFileSync(pfxPath).toString('base64')
      : '';

    // Em PRODUCAO é obrigatório ter certificado — nunca transmitir XML sem
    // assinatura como se fosse o fluxo real (fail-closed em vez de degradar
    // silenciosamente para um XML não assinado).
    if (dto.ambiente === 'PRODUCAO' && (!pfxBase64 || !pfxPassword)) {
      throw new BadRequestException(
        'Certificado digital (.pfx) obrigatório para emissão em ambiente de PRODUÇÃO. Configure CERT_PFX_PATH e CERT_PFX_PASSWORD.',
      );
    }

    // ── 4. Emissão NF-e (Modelo 55) ────────────────────────────────────────
    const { xml: xmlNfe, chaveAcesso } = this.xmlGen.gerarNfe(
      {
        emitenteCnpj,
        cliente: {
          cnpjCpf:    client.cnpjCpf,
          companyName: client.companyName,
          tradeName:  client.tradeName,
          address:    client.address as any,
        },
        ambiente: dto.ambiente,
      },
      calculo,
      numero,
      serie,
    );

    const xmlAssinado = pfxBase64
      ? this.sign.assinar(xmlNfe, pfxBase64, pfxPassword, `NFe${chaveAcesso}`)
      : xmlNfe;

    const retNfe = await this.sefazAm.transmitirNfe(
      xmlAssinado, dto.ambiente, numero, serie, pfxBase64 || undefined, pfxPassword || undefined,
    );

    const statusFinal: StatusNota = retNfe.autorizada ? 'AUTORIZADA' : 'REJEITADA';

    if (retNfe.autorizada) {
      this.logger.log(`NF-e ${numero}: AUTORIZADA | cStat=${retNfe.cStat}`);
    } else {
      this.logger.log(`NF-e ${numero}: REJEITADA | cStat=${retNfe.cStat} | Motivo: ${retNfe.xMotivo}`);
    }

    // ── 5. Persistência + baixa de estoque (transação) ────────────────────────
    const notaFiscal = await this.prisma.$transaction(async (tx) => {
      const nota = await tx.notaFiscal.create({
        data: {
          numero,
          serie,
          chaveAcesso,
          protocolo:        retNfe.protocolo,
          serviceOrderId:   dto.serviceOrderId,
          clientId:         dto.clientId,
          createdById,
          emitenteCnpj,
          destinatarioCnpj: client.cnpjCpf,
          valorBruto:       calculo.valorBruto,
          valorLiquido:     calculo.valorBruto,      // por fora: bruto = líquido
          xmlAssinado,
          xmlAutorizado:    retNfe.xmlRetorno,
          status:           statusFinal,
          ambiente:         dto.ambiente as AmbienteNota,
          splitPayment:     calculo.splitPayment as object,

          itens: {
            create: calculo.itens.map((item, idx) => ({
              productId:      dto.itens[idx].productId,
              ncm:            item.ncm,
              descricao:      item.descricao,
              quantidade:     item.quantidade,
              valorUnitario:  item.valorUnitario,
              valorTotal:     item.valorTotal,
              fabricadoNaZfm: item.fabricadoNaZfm,
              cfop:           dto.itens[idx].cfop || '5102',
            })),
          },

          impostos: {
            create: {
              aliquotaIcms:   calculo.totalIcms > 0 ? 12 : undefined,
              valorIcms:      calculo.totalIcms  || undefined,
              aliquotaPis:    calculo.totalPis > 0 ? 0.65 : undefined,
              valorPis:       calculo.totalPis   || undefined,
              aliquotaCofins: calculo.totalCofins > 0 ? 3 : undefined,
              valorCofins:    calculo.totalCofins || undefined,
              aliquotaCbs:    calculo.aliquotaCbs,
              valorCbs:       calculo.totalCbs,
              aliquotaIbs:    calculo.aliquotaIbs,
              valorIbs:       calculo.totalIbs,
              creditoPresumidoZfm: calculo.creditoPresumidoZfmTotal || undefined,
              beneficioZfmAtivo:   calculo.beneficioZfmAtivo,
              totalImpostoLegado:  calculo.totalImpostoLegado,
              totalImposto2026:    calculo.totalImposto2026,
              calculoPorFora:      true,
            },
          },

          eventos: {
            create: {
              tipo:      statusFinal === 'AUTORIZADA' ? 'AUTORIZACAO' : 'REJEICAO',
              codigo:    retNfe.cStat,
              descricao: retNfe.xMotivo,
              protocolo: retNfe.protocolo,
              xmlRetorno: retNfe.xmlRetorno,
            },
          },
        },
      });

      // Baixa de estoque — só reflete venda real quando a nota é autorizada.
      if (statusFinal === 'AUTORIZADA') {
        for (const item of dto.itens) {
          const product = productById.get(item.productId)!;
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantidade } },
          });
          await tx.stockMovement.create({
            data: {
              productId:  item.productId,
              type:       MovementType.EXIT,
              quantity:   item.quantidade,
              unitCost:   product.unitCost ?? undefined,
              reason:     `Venda NF-e ${numero}`,
              referenceId: nota.id,
              createdById,
            },
          });
        }
      }

      return nota;
    });

    // ── 6. Webhook para portal principal ─────────────────────────────────────
    const webhookEvento = statusFinal === 'AUTORIZADA' ? 'NOTA_AUTORIZADA' : 'NOTA_REJEITADA';

    await this.webhook.dispatch(webhookEvento, notaFiscal.id, {
      notaId:     notaFiscal.id,
      numero:     notaFiscal.numero,
      status:     statusFinal,
      protocolo:  retNfe.protocolo ?? undefined,
      chaveAcesso: chaveAcesso ?? undefined,
      splitPayment: calculo.splitPayment as Record<string, unknown>,
    });

    return {
      notaFiscalId: notaFiscal.id,
      numero,
      status:       statusFinal,
      protocolo:    retNfe.protocolo ?? null,
      chaveAcesso:  chaveAcesso ?? null,
      calculo,
      splitPayment: calculo.splitPayment,
    };
  }

  // ─── Cancelar Nota ────────────────────────────────────────────────────────

  async cancelarNota(
    notaId: string,
    justificativa: string,
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const nota = await this.prisma.notaFiscal.findUnique({
      where: { id: notaId },
      include: { itens: true },
    });
    if (!nota) throw new NotFoundException(`Nota ${notaId} não encontrada`);
    if (nota.status !== 'AUTORIZADA') {
      return { sucesso: false, mensagem: 'Apenas notas AUTORIZADAS podem ser canceladas' };
    }

    if (!nota.chaveAcesso || !nota.protocolo) {
      return { sucesso: false, mensagem: 'Nota sem chave de acesso ou protocolo, não é possível cancelar' };
    }

    const pfxPath     = this.config.get<string>('CERT_PFX_PATH', '');
    const pfxPassword = this.config.get<string>('CERT_PFX_PASSWORD', '');
    const pfxBase64   = pfxPath && fs.existsSync(pfxPath)
      ? fs.readFileSync(pfxPath).toString('base64')
      : '';

    if (nota.ambiente === 'PRODUCAO' && (!pfxBase64 || !pfxPassword)) {
      throw new BadRequestException(
        'Certificado digital (.pfx) obrigatório para cancelamento em ambiente de PRODUÇÃO. Configure CERT_PFX_PATH e CERT_PFX_PASSWORD.',
      );
    }

    const ret = await this.sefazAm.cancelarNfe(
      nota.chaveAcesso, nota.protocolo, justificativa, nota.ambiente as 'PRODUCAO' | 'HOMOLOGACAO',
      pfxBase64 || undefined, pfxPassword || undefined,
    );

    if (!ret.autorizada) {
      return { sucesso: false, mensagem: ret.xMotivo };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.notaFiscal.update({
        where: { id: notaId },
        data: {
          status: 'CANCELADA',
          motivoCancelamento: justificativa,
          eventos: {
            create: {
              tipo: 'CANCELAMENTO', codigo: ret.cStat,
              descricao: ret.xMotivo, protocolo: ret.protocolo,
              xmlRetorno: ret.xmlRetorno,
            },
          },
        },
      });

      // Reverte a baixa de estoque feita na emissão.
      for (const item of nota.itens) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: Number(item.quantidade) } },
        });
        await tx.stockMovement.create({
          data: {
            productId:   item.productId,
            type:        MovementType.ENTRY,
            quantity:    Number(item.quantidade),
            reason:      `Cancelamento NF-e ${nota.numero}`,
            referenceId: nota.id,
            createdById: nota.createdById,
          },
        });
      }
    });

    await this.webhook.dispatch('NOTA_CANCELADA', nota.id, {
      notaId: nota.id, numero: nota.numero, status: 'CANCELADA',
      protocolo: ret.protocolo ?? undefined, motivo: justificativa,
    });

    return { sucesso: true, mensagem: 'Nota cancelada com sucesso' };
  }

  // ─── Consultar Nota ───────────────────────────────────────────────────────

  async consultarNota(notaId: string) {
    const nota = await this.prisma.notaFiscal.findUnique({
      where:   { id: notaId },
      include: {
        itens: true,
        impostos: true,
        eventos: { orderBy: { createdAt: 'desc' } },
        client: { select: { id: true, companyName: true, tradeName: true, cnpjCpf: true } },
        serviceOrder: { select: { id: true, orderNumber: true } },
      },
    });
    if (!nota) throw new NotFoundException(`Nota ${notaId} não encontrada`);

    return this.mapNotaToInvoice(nota);
  }

  async listarNotas(filters: FiscalFilterDto = {}) {
    const { serviceOrderId, status, clientId, startDate, endDate } = filters;

    const where: any = {};

    if (serviceOrderId) where.serviceOrderId = serviceOrderId;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const notas = await this.prisma.notaFiscal.findMany({
      where,
      include: {
        itens: true,
        impostos: true,
        eventos: { orderBy: { createdAt: 'desc' } },
        client: { select: { id: true, companyName: true, tradeName: true, cnpjCpf: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notas.map((n) => this.mapNotaToInvoice(n));
  }

  private mapNotaToInvoice(nota: any) {
    return {
      ...nota,
      invoiceNumber: nota.numero,
      series:        nota.serie,
      value:         Number(nota.valorBruto),
      issueDate:     nota.createdAt,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Gera o próximo número de NF-e usando uma SEQUENCE PostgreSQL
   * para garantir unicidade mesmo em requisições concorrentes.
   *
   * A sequence é criada automaticamente se não existir.
   * Em produção, criar via migration: CREATE SEQUENCE seq_nota_fiscal START 1;
   */
  private async gerarProximoNumero(): Promise<string> {
    try {
      const result = await this.prisma.$queryRaw<[{ nextval: bigint }]>`
        SELECT nextval('seq_nota_fiscal'::regclass)
      `;
      return String(result[0].nextval).padStart(9, '0');
    } catch {
      // Fallback: se a sequence não existir, cria e retorna 1
      await this.prisma.$executeRaw`
        CREATE SEQUENCE IF NOT EXISTS seq_nota_fiscal START 1 INCREMENT 1
      `;
      const result = await this.prisma.$queryRaw<[{ nextval: bigint }]>`
        SELECT nextval('seq_nota_fiscal'::regclass)
      `;
      return String(result[0].nextval).padStart(9, '0');
    }
  }
}

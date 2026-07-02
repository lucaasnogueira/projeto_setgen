import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { OsDataDto } from './dto/os-data.dto';
import { FiscalFilterDto } from './dto/fiscal-filter.dto';
import { TaxEngineService } from './engines/tax-engine.service';
import { XmlGeneratorService } from './xml/xml-generator.service';
import { SignService } from './xml/sign.service';
import { SefazAmService } from './sefaz/sefaz-am.service';
import { NfseNacionalService } from './sefaz/nfse-nacional.service';
import { WebhookService } from './webhooks/webhook.service';
import { AmbienteNota, ModalidadeNota, StatusNota, TipoNota } from '@prisma/client';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly prisma:      PrismaService,
    private readonly taxEngine:   TaxEngineService,
    private readonly xmlGen:      XmlGeneratorService,
    private readonly sign:        SignService,
    private readonly sefazAm:     SefazAmService,
    private readonly nfseNac:     NfseNacionalService,
    private readonly webhook:     WebhookService,
    private readonly config:      ConfigService,
  ) {}

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * emitirNotaDual()
   *
   * Orquestra o ciclo completo de emissão de NF-e + NFS-e:
   *   1. Cálculo dual (IBS/CBS 2026 + ISS/ICMS/PIS/COFINS legado)
   *   2. Geração dos XMLs (NF-e Modelo 55 e/ou NFS-e Nacional)
   *   3. Assinatura XMLDSIG com certificado A1 (.pfx)
   *   4. Transmissão à SEFAZ-AM (NF-e) e/ou ADN NFS-e
   *   5. Persistência no banco (notas_fiscais + impostos_retidos + eventos_sefaz)
   *   6. Dispatch de webhook para o portal principal
   * ─────────────────────────────────────────────────────────────────────────
   */
  async emitirNotaDual(osData: OsDataDto): Promise<{
    notaFiscalId:   string;
    nfeNumero:      string | null;
    nfseNumero:     string | null;
    status:         string;
    protocolo:      string | null;
    chaveAcesso:    string | null;
    calculoDual:    ReturnType<TaxEngineService['calcular']>;
    splitPayment:   object;
  }> {
    this.logger.log(`Iniciando emissão dual | OS: ${osData.serviceOrderId}`);

    // Valida que a OS existe e obtém o clientId real (Client.id) — não
    // confundir com clientCnpj, que é só o CNPJ do destinatário na nota.
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: osData.serviceOrderId },
    });
    if (!serviceOrder) {
      throw new NotFoundException(
        `Ordem de serviço ${osData.serviceOrderId} não encontrada`,
      );
    }

    // ── 1. Motor de Cálculo 2026 ─────────────────────────────────────────────
    const calculo = this.taxEngine.calcular(osData);

    const temPecas    = osData.itensPecas.length > 0;
    const temServicos = osData.itensServico.length > 0;
    const modalidade: ModalidadeNota =
      temPecas && temServicos ? 'MISTA' :
      temPecas                ? 'MERCADORIA' :
                                'SERVICO';

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
    if (osData.ambiente === 'PRODUCAO' && (!pfxBase64 || !pfxPassword)) {
      throw new BadRequestException(
        'Certificado digital (.pfx) obrigatório para emissão em ambiente de PRODUÇÃO. Configure CERT_PFX_PATH e CERT_PFX_PASSWORD.',
      );
    }

    // ── 4. Emissão NF-e (Modelo 55 Conjugada) ──────────────────────────────
    // Se há peças ou serviços, emitimos via SEFAZ-AM.
    let nfeStatus:      StatusNota   = 'PENDENTE';
    let nfeProtocolo:   string | null = null;
    let nfeChave:       string | null = null;
    let nfeXmlAssinado: string | null = null;
    let nfeXmlRet:      string | null = null;
    let nfeCStat:       string = '999';
    let nfeMotivo:      string = 'Nota rejeitada ou em processamento';

    const temItens = temPecas || temServicos;

    if (temItens) {
      const { xml: xmlNfe, chaveAcesso } = this.xmlGen.gerarNfe(osData, calculo, numero, serie);
      nfeChave = chaveAcesso;

      nfeXmlAssinado = pfxBase64
        ? this.sign.assinar(xmlNfe, pfxBase64, pfxPassword, `NFe${chaveAcesso}`)
        : xmlNfe;

      nfeStatus = 'PROCESSANDO';
      const retNfe = await this.sefazAm.transmitirNfe(
        nfeXmlAssinado, osData.ambiente, numero, serie, pfxBase64 || undefined, pfxPassword || undefined,
      );

      nfeStatus    = retNfe.autorizada ? 'AUTORIZADA' : 'REJEITADA';
      nfeProtocolo = retNfe.protocolo;
      nfeXmlRet    = retNfe.xmlRetorno;
      nfeCStat     = retNfe.cStat;
      nfeMotivo    = retNfe.xMotivo;

      if (retNfe.autorizada) {
        this.logger.log(`NF-e ${numero}: AUTORIZADA | cStat=${retNfe.cStat}`);
      } else {
        this.logger.log(`NF-e ${numero}: REJEITADA | cStat=${retNfe.cStat} | Motivo: ${retNfe.xMotivo}`);
      }
    }

    // ── 5. Status consolidado ─────────────────────────────────────────────────
    const statusFinal: StatusNota = nfeStatus;

    // ── 6. Persistência ──────────────────────────────────────────────────────
    const notaFiscal = await this.prisma.notaFiscal.create({
      data: {
        numero,
        serie,
        tipo:             TipoNota.NFE,
        modalidade,
        chaveAcesso:      nfeChave,
        protocolo:        nfeProtocolo,
        serviceOrderId:   osData.serviceOrderId,
        clientId:         serviceOrder.clientId,
        emitenteCnpj:     osData.emitenteCnpj,
        destinatarioCnpj: osData.clientCnpj,
        valorBruto:       calculo.valorBruto,
        valorLiquido:     calculo.valorBruto,      // por fora: bruto = líquido
        xmlAssinado:      nfeXmlAssinado,
        xmlAutorizado:    nfeXmlRet,
        status:           statusFinal,
        ambiente:         osData.ambiente as AmbienteNota,
        splitPayment:     calculo.splitPayment as object,

        // Impostos
        impostos: {
          create: {
            aliquotaIss:    calculo.totalIss > 0 ? 5 : undefined,
            valorIss:       calculo.totalIss   || undefined,
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

        // Evento de autorização/rejeição (SEFAZ-AM)
        eventos: {
          create: {
            tipo:      statusFinal === 'AUTORIZADA' ? 'AUTORIZACAO' : 'REJEICAO' as any,
            codigo:    nfeCStat,
            descricao: nfeMotivo,
            protocolo: nfeProtocolo,
            xmlRetorno: nfeXmlRet,
          },
        },
      },
    });

    // ── 7. Webhook para portal principal ─────────────────────────────────────
    const webhookEvento =
      statusFinal === 'AUTORIZADA' ? 'NOTA_AUTORIZADA' :
      statusFinal === 'REJEITADA'  ? 'NOTA_REJEITADA'  :
      null;

    if (webhookEvento) {
      await this.webhook.dispatch(webhookEvento, notaFiscal.id, {
        notaId:     notaFiscal.id,
        numero:     notaFiscal.numero,
        tipo:       notaFiscal.tipo,
        status:     statusFinal,
        protocolo:  nfeProtocolo ?? undefined,
        chaveAcesso: nfeChave ?? undefined,
        splitPayment: calculo.splitPayment as Record<string, unknown>,
      });
    }

    return {
      notaFiscalId: notaFiscal.id,
      nfeNumero:    numero,
      nfseNumero:   null,
      status:       statusFinal,
      protocolo:    nfeProtocolo ?? null,
      chaveAcesso:  nfeChave ?? null,
      calculoDual:  calculo,
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
    });
    if (!nota) throw new NotFoundException(`Nota ${notaId} não encontrada`);
    if (nota.status !== 'AUTORIZADA') {
      return { sucesso: false, mensagem: 'Apenas notas AUTORIZADAS podem ser canceladas' };
    }

    if (nota.tipo === 'NFE' && nota.chaveAcesso && nota.protocolo) {
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

      if (ret.autorizada) {
        await this.prisma.notaFiscal.update({
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

        await this.webhook.dispatch('NOTA_CANCELADA', nota.id, {
          notaId: nota.id, numero: nota.numero, tipo: nota.tipo, status: 'CANCELADA',
          protocolo: ret.protocolo ?? undefined, motivo: justificativa,
        });

        return { sucesso: true, mensagem: 'Nota cancelada com sucesso' };
      }
      return { sucesso: false, mensagem: ret.xMotivo };
    }

    return { sucesso: false, mensagem: 'Tipo de nota não suporta cancelamento automático' };
  }

  // ─── Consultar Nota ───────────────────────────────────────────────────────

  async consultarNota(notaId: string) {
    const nota = await this.prisma.notaFiscal.findUnique({
      where:   { id: notaId },
      include: { impostos: true, eventos: { orderBy: { createdAt: 'desc' } } },
    });
    if (!nota) throw new NotFoundException(`Nota ${notaId} não encontrada`);

    return this.mapNotaToInvoice(nota);
  }

  async listarNotas(filters: FiscalFilterDto = {}) {
    const { serviceOrderId, status, tipo, clientId, startDate, endDate } = filters;

    const where: any = {};

    if (serviceOrderId) where.serviceOrderId = serviceOrderId;
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;
    if (clientId) where.clientId = clientId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const notas = await this.prisma.notaFiscal.findMany({
      where,
      include: { impostos: true, eventos: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return notas.map((n) => this.mapNotaToInvoice(n));
  }

  private mapNotaToInvoice(nota: any) {
    const issueDate = new Date(nota.createdAt);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 15); // Padrão 15 dias para vencimento se não especificado

    return {
      ...nota,
      invoiceNumber: nota.numero,
      series:        nota.serie,
      value:         Number(nota.valorBruto),
      issueDate:     issueDate.toISOString(),
      dueDate:       dueDate.toISOString(),
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

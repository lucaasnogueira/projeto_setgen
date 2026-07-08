import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteLineType, PaymentMethod } from '@prisma/client';

const QUOTE_LINE_TYPE_LABELS: Record<QuoteLineType, string> = {
  [QuoteLineType.SERVICE]: 'Serviço',
  [QuoteLineType.MATERIAL]: 'Material',
  [QuoteLineType.LABOR_HOUR]: 'Hora Técnica',
  [QuoteLineType.TRAVEL]: 'Deslocamento',
  [QuoteLineType.ADDITIONAL_COST]: 'Custo Adicional',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.BANK_SLIP]: 'Boleto',
  [PaymentMethod.CHECK]: 'Cheque',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

@Injectable()
export class PublicQuotesService {
  constructor(private prisma: PrismaService) {}

  async renderQuoteHtml(id: string): Promise<string> {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        salesRep: { select: { name: true } },
        quoteLines: { orderBy: { createdAt: 'asc' } },
        art: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const company = await this.prisma.companySettings.findFirst();
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { isActive: true, pixKey: { not: null } },
    });

    const address = order.client.address as {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    } | null;

    const linesTotal = order.quoteLines.reduce(
      (sum, line) => sum + Number(line.totalValue),
      0,
    );

    const linesRows = order.quoteLines
      .map(
        (line) => `
        <tr>
          <td>${escapeHtml(QUOTE_LINE_TYPE_LABELS[line.type])}</td>
          <td>${escapeHtml(line.description)}</td>
          <td class="num">${Number(line.quantity)}</td>
          <td class="num">${formatCurrency(Number(line.unitValue))}</td>
          <td class="num">${formatCurrency(Number(line.discount))}</td>
          <td class="num">${formatCurrency(Number(line.totalValue))}</td>
        </tr>`,
      )
      .join('');

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Orçamento ${escapeHtml(order.orderNumber)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 900px; margin: 0 auto; padding: 32px 16px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin-top: 28px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 12px; }
  .muted { color: #666; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f4f4f4; }
  .num { text-align: right; }
  .total-row td { font-weight: bold; background: #fafafa; }
  .scope { white-space: pre-wrap; font-size: 13px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(company?.name ?? 'Orçamento')}</h1>
      <div class="muted">
        ${company?.cnpj ? `CNPJ: ${escapeHtml(company.cnpj)}<br/>` : ''}
        ${company?.phone ? `Tel: ${escapeHtml(company.phone)}<br/>` : ''}
        ${company?.email ? `${escapeHtml(company.email)}<br/>` : ''}
        ${company?.address ? escapeHtml(company.address) : ''}
      </div>
    </div>
    <div class="muted" style="text-align:right">
      <div><strong>Orçamento ${escapeHtml(order.orderNumber)}</strong></div>
      <div>Emitido em: ${formatDate(order.createdAt)}</div>
      <div>Válido até: ${formatDate(order.validUntil)}</div>
    </div>
  </div>

  <h2>Cliente</h2>
  <div class="muted">
    ${escapeHtml(order.client.tradeName ?? order.client.companyName)}<br/>
    CNPJ/CPF: ${escapeHtml(order.client.cnpjCpf)}<br/>
    ${address ? escapeHtml([address.street, address.number, address.neighborhood, address.city, address.state].filter(Boolean).join(', ')) : ''}<br/>
    Tel: ${escapeHtml(order.client.phone)} — ${escapeHtml(order.client.email)}
  </div>

  <h2>Escopo</h2>
  <div class="scope">${escapeHtml(order.scope)}</div>

  <h2>Produtos, Serviços e Custos Adicionais</h2>
  <table>
    <thead>
      <tr>
        <th>Tipo</th><th>Descrição</th><th class="num">Qtd.</th><th class="num">Valor Unit.</th><th class="num">Desconto</th><th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${linesRows || '<tr><td colspan="6">Nenhuma linha adicionada</td></tr>'}
      <tr class="total-row">
        <td colspan="5">Total</td>
        <td class="num">${formatCurrency(linesTotal)}</td>
      </tr>
    </tbody>
  </table>

  <h2>Pagamento e Garantia</h2>
  <div class="muted">
    ${order.paymentMethod ? `Forma de pagamento: ${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod])}<br/>` : ''}
    ${order.paymentTerms ? `Condição: ${escapeHtml(order.paymentTerms)}<br/>` : ''}
    ${order.warrantyMonths ? `Garantia: ${order.warrantyMonths} meses<br/>` : ''}
    ${bankAccount ? `PIX: ${escapeHtml(bankAccount.pixKey ?? '')} (${escapeHtml(bankAccount.bankName)})<br/>` : ''}
    ${order.salesRep ? `Responsável comercial: ${escapeHtml(order.salesRep.name)}` : ''}
  </div>

  ${order.notes ? `<h2>Observações</h2><div class="scope">${escapeHtml(order.notes)}</div>` : ''}
</body>
</html>`;
  }
}

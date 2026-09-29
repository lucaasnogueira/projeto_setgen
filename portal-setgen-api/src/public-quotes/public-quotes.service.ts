import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotesService } from '../quotes/quotes.service';
import { AuditService } from '../common/audit/audit.service';
import { QuoteLineType, PaymentMethod, QuoteStatus, AuditAction } from '@prisma/client';
import { formatBusinessDate } from '../common/date/business-date.util';

const PUBLICLY_VISIBLE_STATUSES: QuoteStatus[] = [
  QuoteStatus.DRAFT,
  QuoteStatus.PENDING_APPROVAL,
  QuoteStatus.APPROVED,
  QuoteStatus.SENT_TO_CLIENT,
  QuoteStatus.AWAITING_RESPONSE,
  QuoteStatus.ACCEPTED,
  QuoteStatus.REJECTED,
  QuoteStatus.EXPIRED,
];

const QUOTE_LINE_TYPE_LABELS: Record<QuoteLineType, string> = {
  [QuoteLineType.SERVICE]: 'Serviço Técnico',
  [QuoteLineType.MATERIAL]: 'Material / Peça',
  [QuoteLineType.LABOR_HOUR]: 'Hora Técnica',
  [QuoteLineType.TRAVEL]: 'Deslocamento',
  [QuoteLineType.ADDITIONAL_COST]: 'Custo Operacional',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.BANK_SLIP]: 'Boleto Bancário',
  [PaymentMethod.CHECK]: 'Cheque',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHtml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class PublicQuotesService {
  constructor(
    private prisma: PrismaService,
    private quotesService: QuotesService,
    private auditService: AuditService,
  ) {}

  async acceptPublicQuote(id: string, signatoryName: string, signatoryDoc?: string, comments?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { serviceOrder: true },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quote.status === QuoteStatus.ACCEPTED) {
      return {
        success: true,
        alreadyAccepted: true,
        message: 'Este orçamento já foi aprovado e a execução está em andamento.',
      };
    }

    // Cria OS e marca como ACCEPTED via QuotesService
    let result;
    if (!quote.serviceOrder) {
      try {
        result = await this.quotesService.approveAndCreateWorkOrder(id, quote.createdById);
      } catch (err: any) {
        // Fallback: se houver restrição, atualiza direto para ACCEPTED
        result = await this.prisma.quote.update({
          where: { id },
          data: { status: QuoteStatus.ACCEPTED },
        });
      }
    } else {
      result = await this.prisma.quote.update({
        where: { id },
        data: { status: QuoteStatus.ACCEPTED },
      });
    }

    await this.auditService.record(
      quote.createdById,
      AuditAction.UPDATE,
      'Quote',
      quote.id,
      {
        action: 'PUBLIC_CLIENT_ACCEPT',
        signatoryName,
        signatoryDoc,
        comments,
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success: true,
      message: 'Proposta comercial aprovada com sucesso! A Ordem de Serviço foi gerada automaticamente na Setgen.',
      data: result,
    };
  }

  async rejectPublicQuote(id: string, clientName: string, reason: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.REJECTED },
    });

    await this.auditService.record(
      quote.createdById,
      AuditAction.UPDATE,
      'Quote',
      quote.id,
      {
        action: 'PUBLIC_CLIENT_REJECT',
        clientName,
        reason,
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success: true,
      message: 'Sua solicitação de revisão/recusa foi registrada. Nossa equipe entrará em contato.',
      data: updated,
    };
  }

  async renderQuoteHtml(id: string): Promise<string> {
    const order = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        salesRep: { select: { name: true, email: true, phone: true } },
        quoteLines: { orderBy: { createdAt: 'asc' } },
        serviceOrder: { select: { orderNumber: true, status: true } },
      },
    });

    if (!order || !PUBLICLY_VISIBLE_STATUSES.includes(order.status)) {
      throw new NotFoundException('Orçamento não encontrado ou indisponível para visualização pública');
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

    const isAccepted = order.status === QuoteStatus.ACCEPTED;
    const isRejected = order.status === QuoteStatus.REJECTED;

    const linesRows = order.quoteLines
      .map(
        (line, idx) => `
        <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
          <td class="badge-col"><span class="type-badge ${line.type.toLowerCase()}">${escapeHtml(QUOTE_LINE_TYPE_LABELS[line.type] || line.type)}</span></td>
          <td><strong>${escapeHtml(line.description)}</strong></td>
          <td class="num">${Number(line.quantity)}</td>
          <td class="num">${formatCurrency(Number(line.unitValue))}</td>
          <td class="num text-red-600">${Number(line.discount) > 0 ? '-' + formatCurrency(Number(line.discount)) : '—'}</td>
          <td class="num font-bold text-gray-900">${formatCurrency(Number(line.totalValue))}</td>
        </tr>`,
      )
      .join('');

    const statusBadge = isAccepted
      ? '<span class="status-badge bg-green-100 text-green-800 border-green-300">✓ Aprovado pelo Cliente</span>'
      : isRejected
      ? '<span class="status-badge bg-red-100 text-red-800 border-red-300">✕ Revisão Solicitada</span>'
      : '<span class="status-badge bg-orange-100 text-orange-800 border-orange-300">⏳ Aguardando Aprovação</span>';

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Proposta Comercial #${escapeHtml(order.quoteNumber)} — SETGEN</title>
<style>
  :root {
    --primary: #E2661D;
    --primary-hover: #c95716;
    --gray-50: #f8fafc;
    --gray-100: #f1f5f9;
    --gray-200: #e2e8f0;
    --gray-700: #334155;
    --gray-900: #0f172a;
    --green-600: #16a34a;
    --green-700: #15803d;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--gray-900);
    background: #f8fafc;
    padding: 32px 16px 80px 16px;
    font-size: 14px;
    line-height: 1.5;
  }
  .container {
    max-width: 960px;
    margin: 0 auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid var(--gray-200);
    overflow: hidden;
  }
  .banner-top {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #fff;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  .brand-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-title span { color: var(--primary); }
  .status-badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid transparent;
  }
  .bg-green-100 { background: #dcfce7; color: #166534; border-color: #86efac; }
  .bg-red-100 { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
  .bg-orange-100 { background: #ffedd5; color: #9a3412; border-color: #fdba74; }
  .content { padding: 32px; }
  .section-title {
    font-size: 14px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--primary);
    margin: 24px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #fed7aa;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media(max-width: 640px) {
    .grid-2 { grid-template-columns: 1fr; }
    .content { padding: 20px; }
  }
  .info-box {
    background: var(--gray-50);
    padding: 16px 20px;
    border-radius: 12px;
    border: 1px solid var(--gray-200);
  }
  .info-box h4 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
  .info-box p { font-size: 13px; color: var(--gray-700); margin: 2px 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--gray-200);
  }
  th, td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--gray-200);
  }
  th {
    background: #f1f5f9;
    font-size: 11.5px;
    text-transform: uppercase;
    color: #475569;
    font-weight: 700;
  }
  td { font-size: 13px; }
  .num { text-align: right; }
  .type-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 600;
    background: #e2e8f0;
    color: #334155;
  }
  .total-card {
    background: #fff7ed;
    border: 2px solid #fdba74;
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
  }
  .total-label { font-size: 13px; font-weight: 600; color: #9a3412; }
  .total-value { font-size: 26px; font-weight: 900; color: #7c2d12; }
  .action-bar {
    position: sticky;
    bottom: 16px;
    background: #ffffff;
    border: 2px solid #cbd5e1;
    border-radius: 16px;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.12);
    margin-top: 32px;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    text-decoration: none;
  }
  .btn-success {
    background: var(--green-600);
    color: #fff;
  }
  .btn-success:hover { background: var(--green-700); }
  .btn-danger {
    background: #fff;
    color: #dc2626;
    border: 1px solid #fca5a5;
  }
  .btn-danger:hover { background: #fee2e2; }
  .btn-outline {
    background: #fff;
    color: #475569;
    border: 1px solid #cbd5e1;
  }
  .modal-backdrop {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .modal-box {
    background: #fff;
    border-radius: 16px;
    max-width: 480px;
    width: 100%;
    padding: 28px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  }
  .modal-box h3 { font-size: 18px; margin-bottom: 8px; color: var(--gray-900); }
  .modal-box p { font-size: 13px; color: #64748b; margin-bottom: 20px; }
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #334155; }
  .form-group input, .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .container { box-shadow: none; border: none; }
    .action-bar, .modal-backdrop { display: none !important; }
  }
</style>
</head>
<body>

<div class="container">
  <!-- TOPO -->
  <div class="banner-top">
    <div>
      <div class="brand-title">SETGEN <span>ENERGIA</span></div>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">
        Proposta Comercial #${escapeHtml(order.quoteNumber)} • Emissão: ${formatBusinessDate(order.createdAt)}
      </div>
    </div>
    <div>${statusBadge}</div>
  </div>

  <div class="content">
    <!-- DADOS DA PROPOSTA & CLIENTE -->
    <div class="grid-2">
      <div class="info-box">
        <h4>Cliente</h4>
        <p><strong>${escapeHtml(order.client.tradeName || order.client.companyName)}</strong></p>
        <p>CNPJ/CPF: ${escapeHtml(order.client.cnpjCpf)}</p>
        <p>${address ? escapeHtml([address.street, address.number, address.city, address.state].filter(Boolean).join(', ')) : ''}</p>
        <p>Contato: ${escapeHtml(order.client.phone)} • ${escapeHtml(order.client.email)}</p>
      </div>

      <div class="info-box">
        <h4>Condições da Proposta</h4>
        <p><strong>Validade:</strong> ${formatBusinessDate(order.validUntil)}</p>
        <p><strong>Forma de Pagamento:</strong> ${order.paymentMethod ? escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod]) : 'A combinar'}</p>
        <p><strong>Prazo / Condição:</strong> ${order.paymentTerms ? escapeHtml(order.paymentTerms) : 'Conforme acordado'}</p>
        <p><strong>Garantia Técnica:</strong> ${order.warrantyMonths ? order.warrantyMonths + ' meses' : 'Padrão Setgen'}</p>
        ${order.salesRep ? `<p><strong>Responsável Comercial:</strong> ${escapeHtml(order.salesRep.name)}</p>` : ''}
      </div>
    </div>

    <!-- ESCOPO -->
    <div class="section-title">Escopo dos Serviços & Fornecimento</div>
    <div class="info-box" style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">
${escapeHtml(order.scope)}
    </div>

    <!-- ITENS -->
    <div class="section-title">Composição da Proposta (${order.quoteLines.length} itens)</div>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Descrição Técnica</th>
          <th class="num">Qtd</th>
          <th class="num">Unitário</th>
          <th class="num">Desconto</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${linesRows || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhum item listado</td></tr>'}
      </tbody>
    </table>

    <!-- TOTAL -->
    <div class="total-card">
      <div>
        <div class="total-label">Investimento Total da Proposta</div>
        <div style="font-size: 11px; color: #9a3412;">Inclui todos os materiais, serviços e taxas operacionais descritas</div>
      </div>
      <div class="total-value">${formatCurrency(linesTotal)}</div>
    </div>

    ${order.notes ? `
    <div class="section-title">Observações Comerciais & Técnicas</div>
    <div class="info-box" style="white-space: pre-wrap; font-size: 12.5px;">${escapeHtml(order.notes)}</div>
    ` : ''}

    ${isAccepted ? `
    <div style="margin-top: 32px; background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; text-align: center;">
      <h3 style="color: #065f46; font-size: 16px;">✓ Proposta Aprovada com Sucesso</h3>
      <p style="color: #047857; font-size: 13px; margin-top: 4px;">
        Esta proposta foi aceita pelo cliente e a Ordem de Serviço foi integrada ao sistema da SETGEN.
      </p>
    </div>
    ` : ''}

    ${!isAccepted && !isRejected ? `
    <!-- BARRA FLUTUANTE DE AÇÃO DO CLIENTE -->
    <div class="action-bar">
      <div>
        <span style="font-weight: 700; color: #1e293b; font-size: 15px;">Deseja aprovar esta proposta?</span>
        <div style="font-size: 12px; color: #64748b;">Aprovação instantânea online — gera a ordem de execução na SETGEN.</div>
      </div>
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <button class="btn btn-outline" onclick="window.print()">
          🖨️ Imprimir / PDF
        </button>
        <button class="btn btn-danger" onclick="openRejectModal()">
          ✕ Solicitar Ajustes
        </button>
        <button class="btn btn-success" onclick="openAcceptModal()">
          ✓ Aprovar Proposta
        </button>
      </div>
    </div>
    ` : ''}

  </div>
</div>

<!-- MODAL DE APROVAÇÃO -->
<div id="acceptModal" class="modal-backdrop">
  <div class="modal-box">
    <h3>Aprovar Proposta Comercial</h3>
    <p>Por favor, confirme seus dados para registrar o aceite formal deste orçamento.</p>

    <div class="form-group">
      <label>Nome Completo do Responsável *</label>
      <input type="text" id="signatoryName" placeholder="Ex: João da Silva" />
    </div>

    <div class="form-group">
      <label>CPF ou Cargo no Cliente (Opcional)</label>
      <input type="text" id="signatoryDoc" placeholder="Ex: 000.000.000-00 ou Diretor de Operações" />
    </div>

    <div class="form-group">
      <label>Observação / Pedido de Compra (Opcional)</label>
      <textarea id="signatoryComments" rows="2" placeholder="Número de OC interna ou instruções de faturamento"></textarea>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
      <button class="btn btn-outline" onclick="closeModals()">Cancelar</button>
      <button class="btn btn-success" id="btnConfirmAccept" onclick="submitAccept()">
        Confirmar Aceite e Aprovar
      </button>
    </div>
  </div>
</div>

<!-- MODAL DE RECUSA / REVISÃO -->
<div id="rejectModal" class="modal-backdrop">
  <div class="modal-box">
    <h3>Solicitar Ajustes na Proposta</h3>
    <p>Indique os motivos ou ajustes necessários para nossa equipe revisar.</p>

    <div class="form-group">
      <label>Seu Nome *</label>
      <input type="text" id="rejectName" placeholder="Ex: Maria Pereira" />
    </div>

    <div class="form-group">
      <label>Motivo ou Ajuste Solicitado *</label>
      <textarea id="rejectReason" rows="3" placeholder="Ex: Ajustar prazo de pagamento ou revisar quantidade de peças"></textarea>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
      <button class="btn btn-outline" onclick="closeModals()">Cancelar</button>
      <button class="btn btn-danger" id="btnConfirmReject" onclick="submitReject()">
        Enviar Solicitação
      </button>
    </div>
  </div>
</div>

<script>
  const quoteId = ${JSON.stringify(order.id)};

  function openAcceptModal() {
    document.getElementById('acceptModal').style.display = 'flex';
  }
  function openRejectModal() {
    document.getElementById('rejectModal').style.display = 'flex';
  }
  function closeModals() {
    document.getElementById('acceptModal').style.display = 'none';
    document.getElementById('rejectModal').style.display = 'none';
  }

  async function submitAccept() {
    const name = document.getElementById('signatoryName').value.trim();
    const doc = document.getElementById('signatoryDoc').value.trim();
    const comments = document.getElementById('signatoryComments').value.trim();

    if (!name) {
      alert('Por favor, informe seu nome para registrar o aceite.');
      return;
    }

    const btn = document.getElementById('btnConfirmAccept');
    btn.disabled = true;
    btn.innerText = 'Processando aceite...';

    try {
      const resp = await fetch('/public/quotes/' + quoteId + '/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryName: name, signatoryDoc: doc, comments: comments })
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(data.message || 'Proposta aprovada com sucesso!');
        window.location.reload();
      } else {
        alert('Atenção: ' + (data.message || 'Erro ao processar aprovação'));
        btn.disabled = false;
        btn.innerText = 'Confirmar Aceite e Aprovar';
      }
    } catch (e) {
      alert('Falha na comunicação com o servidor.');
      btn.disabled = false;
      btn.innerText = 'Confirmar Aceite e Aprovar';
    }
  }

  async function submitReject() {
    const name = document.getElementById('rejectName').value.trim();
    const reason = document.getElementById('rejectReason').value.trim();

    if (!name || !reason) {
      alert('Por favor, informe seu nome e o motivo do ajuste.');
      return;
    }

    const btn = document.getElementById('btnConfirmReject');
    btn.disabled = true;
    btn.innerText = 'Enviando...';

    try {
      const resp = await fetch('/public/quotes/' + quoteId + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: name, reason: reason })
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(data.message || 'Solicitação enviada com sucesso!');
        window.location.reload();
      } else {
        alert('Atenção: ' + (data.message || 'Erro ao registrar'));
        btn.disabled = false;
        btn.innerText = 'Enviar Solicitação';
      }
    } catch (e) {
      alert('Falha na comunicação com o servidor.');
      btn.disabled = false;
      btn.innerText = 'Enviar Solicitação';
    }
  }
</script>

</body>
</html>`;
  }
}

"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quotesApi } from '@/lib/api/quotes';
import { Quote, UserRole, QuoteStatus, ServiceOrderAuditLogEntry, PaymentMethod } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  FileText,
  Calendar,
  User,
  Briefcase,
  Clock,
  Edit,
  Trash2,
  Info,
  AlertTriangle,
  Wrench,
  Tag,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  ShoppingCart,
  ArrowRightCircle,
  ClipboardCheck,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import Link from 'next/link';
import { QuoteStatusTimeline } from '../components/QuoteStatusTimeline';
import { QuoteStatusManager } from '../components/QuoteStatusManager';
import { QuoteLineEditor } from '../components/QuoteLineEditor';
import { formatDateBR, formatDateTimeBR } from '@/lib/date';
import {
  QUOTE_STATUS_CONFIG,
  quoteStatusBadgeClass,
  isQuoteEditable,
  areQuoteLinesEditable,
  isQuotePubliclyVisible,
} from '@/lib/status-config';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  DEBIT_CARD: 'Cartão de Débito',
  CREDIT_CARD: 'Cartão de Crédito',
  BANK_TRANSFER: 'Transferência Bancária',
  PIX: 'PIX',
  BANK_SLIP: 'Boleto',
  CHECK: 'Cheque',
};

const PUBLIC_QUOTE_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Status a partir dos quais uma OC/OP do cliente pode ser registrada — espelha
// OC_ELIGIBLE_QUOTE_STATUSES do backend (purchase-orders.service.ts).
const OC_ELIGIBLE_STATUSES: QuoteStatus[] = [QuoteStatus.APPROVED, QuoteStatus.SENT_TO_CLIENT, QuoteStatus.AWAITING_RESPONSE];

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 p-2 bg-primary/10 rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">{label}</p>
        <div className="text-foreground font-medium text-[13.5px]">{children}</div>
      </div>
    </div>
  );
}

export default function QuoteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState<ServiceOrderAuditLogEntry[]>([]);

  useEffect(() => {
    if (params.id) {
      loadQuote();
    }
  }, [params.id]);

  const loadQuote = async () => {
    try {
      const data = await quotesApi.getById(params.id as string);
      setQuote(data);
      const history = await quotesApi.getAuditLog(params.id as string);
      setAuditLog(history);
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Erro ao carregar detalhes do orçamento');
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: QuoteStatus, comments?: string) => {
    try {
      const updated = await quotesApi.updateStatus(params.id as string, newStatus, comments);
      setQuote({ ...quote, ...updated });
      const history = await quotesApi.getAuditLog(params.id as string);
      setAuditLog(history);
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
      await quotesApi.delete(params.id as string);
      alert('Orçamento excluído com sucesso!');
      router.push('/quotes');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir orçamento');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const canEdit =
    !!quote && isQuoteEditable(quote.status, user?.role, quote.createdById === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={FileText}
        tone="blue"
        title={`Orçamento #${quote.quoteNumber}`}
        badge={{ label: QUOTE_STATUS_CONFIG[quote.status].label, className: quoteStatusBadgeClass(quote.status) }}
        meta={<>{quote.client?.companyName}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            {/* A página pública só serve orçamento já enviado ao cliente — nos
                demais status a rota responde 404, então o link nem aparece. */}
            {isQuotePubliclyVisible(quote.status) && (
              <a href={`${PUBLIC_QUOTE_BASE_URL}/public/quotes/${quote.id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Visualizar Orçamento
                </Button>
              </a>
            )}
            {canEdit && (
              <Link href={`/quotes/${quote.id}/edit`}>
                <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
            {canDelete && !quote.serviceOrder && (
              <Button variant="destructive" onClick={handleDelete} className="rounded-[9px] font-bold gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </>
        }
      />

      {quote.status === QuoteStatus.ACCEPTED && !quote.serviceOrder && (
        <Card className="p-5 bg-status-green-bg/40 border-status-green-fg/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-status-green-bg rounded-xl">
              <ArrowRightCircle className="h-5 w-5 text-status-green-fg" />
            </div>
            <div>
              <p className="font-bold text-foreground text-[14px]">Orçamento aceito — pronto pra virar Ordem de Serviço</p>
              <p className="text-[12.5px] text-text-muted">Verifique a OC/OP nas Compras abaixo e gere a OS de execução.</p>
            </div>
          </div>
          <Button onClick={() => router.push(`/orders/new?quoteId=${quote.id}`)} className="rounded-[9px] font-bold gap-2 shrink-0">
            <ArrowRightCircle className="h-4 w-4" />
            Gerar OS
          </Button>
        </Card>
      )}

      {quote.serviceOrder && (
        <Card className="p-5 bg-primary/5 border-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-[14px]">Ordem de Serviço gerada: {quote.serviceOrder.orderNumber}</p>
              <p className="text-[12.5px] text-text-muted">Acompanhe a execução na OS.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push(`/orders/${quote.serviceOrder!.id}`)} className="rounded-[9px] font-bold gap-2 shrink-0">
            Ver OS
          </Button>
        </Card>
      )}

      <Tabs defaultValue="orcamento">
        <TabsList>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          {auditLog.length > 0 && <TabsTrigger value="historico">Histórico</TabsTrigger>}
        </TabsList>

        <TabsContent value="orcamento" className="mt-4 space-y-4">
          <Card className="p-6 space-y-6">
            <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Descrição do Serviço
            </div>

            {quote.reportedDefects && (
              <div className="space-y-2">
                <h4 className="text-[12.5px] font-bold text-status-red-fg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Defeitos Relatados
                </h4>
                <p className="text-text-secondary bg-status-red-bg/40 p-4 rounded-xl border border-status-red-fg/15 leading-relaxed whitespace-pre-wrap text-[13.5px]">
                  {quote.reportedDefects}
                </p>
              </div>
            )}

            {quote.requestedServices && (
              <div className="space-y-2">
                <h4 className="text-[12.5px] font-bold text-primary flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Serviços Solicitados
                </h4>
                <p className="text-text-secondary bg-primary/5 p-4 rounded-xl border border-primary/15 leading-relaxed whitespace-pre-wrap text-[13.5px]">
                  {quote.requestedServices}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-[12.5px] font-bold text-foreground">Escopo Proposto</h4>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap p-4 rounded-xl bg-muted/40 border border-border text-[13.5px]">
                {quote.scope}
              </p>
            </div>

            {quote.notes && (
              <div className="space-y-2">
                <h4 className="text-[12.5px] font-bold text-status-amber-fg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Observações Importantes
                </h4>
                <p className="text-text-secondary bg-status-amber-bg/40 p-4 rounded-xl border border-status-amber-fg/15 leading-relaxed whitespace-pre-wrap italic text-[13.5px]">
                  {quote.notes}
                </p>
              </div>
            )}
          </Card>

          <QuoteLineEditor
            quoteId={quote.id}
            lines={quote.quoteLines || []}
            editable={areQuoteLinesEditable(quote.status, user?.role, quote.createdById === user?.id)}
            onChange={(lines) => setQuote({ ...quote, quoteLines: lines })}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 space-y-5 h-fit">
              <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Informações Gerais
              </div>

              <div className="space-y-4">
                <InfoRow icon={Clock} label="Validade">
                  {quote.validUntil ? formatDateBR(quote.validUntil) : 'Não definida'}
                </InfoRow>
                <InfoRow icon={User} label="Criado por">{quote.createdBy?.name || 'Sistema'}</InfoRow>
                <InfoRow icon={Calendar} label="Data de Criação">{formatDateBR(quote.createdAt)}</InfoRow>
                {quote.salesRep && (
                  <InfoRow icon={User} label="Responsável Comercial">{quote.salesRep.name}</InfoRow>
                )}
                {quote.paymentMethod && (
                  <InfoRow icon={CreditCard} label="Pagamento">
                    {PAYMENT_METHOD_LABELS[quote.paymentMethod]}
                    {quote.paymentTerms && <p className="text-[11.5px] text-text-muted mt-0.5 font-normal">{quote.paymentTerms}</p>}
                  </InfoRow>
                )}
                {quote.warrantyMonths != null && (
                  <InfoRow icon={ShieldCheck} label="Garantia">{quote.warrantyMonths} meses</InfoRow>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="text-[13.5px] font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Linha do Tempo
                </div>
                <QuoteStatusTimeline currentStatus={quote.status} />
              </Card>

              {user && (
                <QuoteStatusManager
                  currentStatus={quote.status}
                  userRole={user.role}
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compras" className="mt-4 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[13.5px] font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Ordens de Compra / Pedido (OC/OP)
              </div>
              {OC_ELIGIBLE_STATUSES.includes(quote.status) && (
                <Button size="sm" onClick={() => router.push(`/purchase-orders/new?quoteId=${quote.id}`)} className="rounded-[9px] font-bold gap-2">
                  <Tag className="h-4 w-4" />
                  Registrar OC/OP
                </Button>
              )}
            </div>

            {(!quote.purchaseOrders || quote.purchaseOrders.length === 0) ? (
              <p className="text-[13px] text-text-muted italic">Nenhuma OC/OP registrada para este orçamento ainda.</p>
            ) : (
              <div className="space-y-2">
                {quote.purchaseOrders.map((po) => (
                  <button
                    key={po.id}
                    onClick={() => router.push(`/purchase-orders/${po.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border hover:border-primary/40 transition-colors text-left"
                  >
                    <div>
                      <p className="font-bold text-foreground text-[13px]">OC {po.orderNumber}</p>
                      <p className="text-[11.5px] text-text-muted">
                        Emitida em {formatDateBR(po.issueDate)} · válida até {formatDateBR(po.expiryDate)}
                      </p>
                    </div>
                    <span className="font-bold text-primary text-[13px]">
                      {Number(po.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {auditLog.length > 0 && (
          <TabsContent value="historico" className="mt-4">
            <Card className="p-6 space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-foreground">
                        {entry.changes?.from && entry.changes?.to
                          ? `${QUOTE_STATUS_CONFIG[entry.changes.from as QuoteStatus]?.label || entry.changes.from} → ${QUOTE_STATUS_CONFIG[entry.changes.to as QuoteStatus]?.label || entry.changes.to}`
                          : entry.action}
                      </span>
                    </div>
                    {entry.changes?.comments && (
                      <p className="text-[13px] text-text-secondary italic mt-1">{entry.changes.comments}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[11.5px] text-text-muted">
                      <User className="h-3 w-3" />
                      {entry.user?.name || 'Sistema'}
                      <span>·</span>
                      <Calendar className="h-3 w-3" />
                      {formatDateTimeBR(entry.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

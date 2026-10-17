'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { quotesApi } from '@/lib/api/quotes';
import { Quote, QuoteStatus, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { QUOTE_STATUS_CONFIG, quoteStatusBadgeClass } from '@/lib/status-config';
import { getInitials, getAvatarColor, formatDate, formatCurrency } from '@/lib/utils';
import { Plus, Search, FileEdit, FileText, CheckCircle, XCircle, Clock, Pencil, FileDown, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusCard } from '@/components/ui/status-card';
import { TablePagination } from '@/components/ui/pagination';
import { InlineDeleteAction } from '@/components/ui/inline-delete-action';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table';
import { ImportExportDropdown } from '@/components/ui/import-export-dropdown';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.ADMINISTRATIVE;

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const loadQuotes = async () => {
    try {
      const data = await quotesApi.getAll();
      setQuotes(data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    let grandTotal = 0;
    let openTotal = 0;
    let approvedTotal = 0;
    let rejectedTotal = 0;
    let expiringTotal = 0;

    let openCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let expiringCount = 0;

    const now = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(now.getDate() + 15);

    quotes.forEach((q) => {
      const val = Number(q.totalAmount) || 0;
      grandTotal += val;

      const isApproved = q.status === QuoteStatus.APPROVED || q.status === QuoteStatus.ACCEPTED;
      const isOpen =
        q.status === QuoteStatus.SENT_TO_CLIENT ||
        q.status === QuoteStatus.PENDING_APPROVAL ||
        q.status === QuoteStatus.DRAFT;
      const isRejected =
        q.status === QuoteStatus.REJECTED ||
        q.status === QuoteStatus.CANCELLED ||
        q.status === QuoteStatus.EXPIRED;

      if (isApproved) {
        approvedCount++;
        approvedTotal += val;
      } else if (isOpen) {
        openCount++;
        openTotal += val;

        if (q.validUntil) {
          const expDate = new Date(q.validUntil);
          if (!isNaN(expDate.getTime()) && expDate <= fifteenDaysFromNow) {
            expiringCount++;
            expiringTotal += val;
          }
        }
      } else if (isRejected) {
        rejectedCount++;
        rejectedTotal += val;
      }
    });

    return {
      totalCount: quotes.length,
      grandTotal,
      openCount,
      openTotal,
      approvedCount,
      approvedTotal,
      rejectedCount,
      rejectedTotal,
      expiringCount,
      expiringTotal,
    };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    const now = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(now.getDate() + 15);

    return quotes.filter(quote => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        !s ||
        quote.quoteNumber.toLowerCase().includes(s) ||
        (quote.legacyNumber && quote.legacyNumber.toLowerCase().includes(s)) ||
        quote.client?.companyName?.toLowerCase().includes(s) ||
        quote.salesRep?.name?.toLowerCase().includes(s);

      let matchesStatus = true;
      if (statusFilter === 'ALL') {
        matchesStatus = true;
      } else if (statusFilter === 'OPEN') {
        matchesStatus =
          quote.status === QuoteStatus.SENT_TO_CLIENT ||
          quote.status === QuoteStatus.PENDING_APPROVAL ||
          quote.status === QuoteStatus.DRAFT;
      } else if (statusFilter === 'APPROVED') {
        matchesStatus =
          quote.status === QuoteStatus.APPROVED ||
          quote.status === QuoteStatus.ACCEPTED;
      } else if (statusFilter === 'REJECTED') {
        matchesStatus =
          quote.status === QuoteStatus.REJECTED ||
          quote.status === QuoteStatus.CANCELLED ||
          quote.status === QuoteStatus.EXPIRED;
      } else if (statusFilter === 'EXPIRING') {
        if (!quote.validUntil) return false;
        const d = new Date(quote.validUntil);
        matchesStatus =
          !isNaN(d.getTime()) &&
          d <= fifteenDaysFromNow &&
          quote.status !== QuoteStatus.APPROVED &&
          quote.status !== QuoteStatus.ACCEPTED;
      } else {
        matchesStatus = quote.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const filteredTotalValue = useMemo(() => {
    return filteredQuotes.reduce((acc, q) => acc + (Number(q.totalAmount) || 0), 0);
  }, [filteredQuotes]);

  const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE) || 1;
  const paginatedQuotes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuotes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuotes, currentPage]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await quotesApi.delete(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orçamentos"
        subtitle={`${filteredQuotes.length} orçamentos`}
        actions={
          <div className="flex items-center gap-2">
            <ImportExportDropdown
              title="Orçamentos"
              entityName="Orçamentos"
              data={filteredQuotes.map((q) => ({
                "N° Orçamento": q.quoteNumber,
                "N° Legado Auvo": q.legacyNumber || "",
                "Cliente": q.client?.companyName || "",
                "Status": QUOTE_STATUS_CONFIG[q.status]?.label || q.status,
                "Valor Total": Number(q.totalAmount) || 0,
                "Produtos": Number(q.subtotalProducts) || 0,
                "Serviços": Number(q.subtotalServices) || 0,
                "Data": formatDate(q.createdAt),
              }))}
              exportFilename="orcamentos_setgen"
              templateColumns={[
                "N° orçamento",
                "Data de criação",
                "Cliente/Lead",
                "Valor de produtos (R$)",
                "Valor de serviços (R$)",
                "Valor de custos adicionais (R$)",
                "Desconto (R$)",
                "Valor total",
                "Status",
                "Observação",
                "Forma de pagamento"
              ]}
              templateSampleRow={{
                "N° orçamento": "1361",
                "Data de criação": "26/12/2025 12:00:00",
                "Cliente/Lead": "INDT - INSTITUTO DE DESENVOLVIMENTO TECNOLOGICO / CNPJ:04.802.134/0002-68",
                "Valor de produtos (R$)": "3.812,48",
                "Valor de serviços (R$)": "31.800,00",
                "Valor de custos adicionais (R$)": "0,00",
                "Desconto (R$)": "0,00",
                "Valor total": "35.612,48",
                "Status": "Abertos",
                "Observação": "MANUTENÇÃO PREVENTIVA E CORRETIVA EM GMG",
                "Forma de pagamento": "50% entrada e 50% na conclusão"
              }}
              onImport={quotesApi.bulkImport}
              onSuccess={loadQuotes}
            />
            <Button
              onClick={() => router.push('/quotes/new')}
              className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9"
            >
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </div>
        }
      />

      {/* Cards de Indicadores de Orçamentos (estilo Auvo & Setgen) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        <StatusCard
          label="Total de Orçamentos"
          value={formatCurrency(metrics.grandTotal)}
          description={`${metrics.totalCount} orçamentos cadastrados`}
          icon={FileText}
          variant="purple"
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-purple-500 border-purple-500/50 shadow-xs bg-purple-50/20'
              : 'hover:border-gray-300'
          }`}
        />
        <StatusCard
          label="Em Aberto / Negociação"
          value={formatCurrency(metrics.openTotal)}
          description={`${metrics.openCount} aguardando aprovação`}
          icon={Clock}
          variant="blue"
          onClick={() => setStatusFilter('OPEN')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'OPEN'
              ? 'ring-2 ring-blue-500 border-blue-500/50 shadow-xs bg-blue-50/20'
              : 'hover:border-gray-300'
          }`}
        />
        <StatusCard
          label="Próximos do Vencimento"
          value={formatCurrency(metrics.expiringTotal)}
          description={`${metrics.expiringCount} expiram em até 15 dias`}
          icon={AlertTriangle}
          variant="amber"
          onClick={() => setStatusFilter('EXPIRING')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'EXPIRING'
              ? 'ring-2 ring-amber-500 border-amber-500/50 shadow-xs bg-amber-50/20'
              : 'hover:border-gray-300'
          }`}
        />
        <StatusCard
          label="Total Aprovado"
          value={formatCurrency(metrics.approvedTotal)}
          description={`${metrics.approvedCount} aprovados pelos clientes`}
          icon={CheckCircle}
          variant="emerald"
          onClick={() => setStatusFilter('APPROVED')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'APPROVED'
              ? 'ring-2 ring-emerald-500 border-emerald-500/50 shadow-xs bg-emerald-50/20'
              : 'hover:border-gray-300'
          }`}
        />
        <StatusCard
          label="Recusados / Cancelados"
          value={formatCurrency(metrics.rejectedTotal)}
          description={`${metrics.rejectedCount} recusados ou cancelados`}
          icon={XCircle}
          variant="red"
          onClick={() => setStatusFilter('REJECTED')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'REJECTED'
              ? 'ring-2 ring-red-500 border-red-500/50 shadow-xs bg-red-50/20'
              : 'hover:border-gray-300'
          }`}
        />
      </div>

      <Card className="overflow-hidden border border-gray-200/75 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 border-b border-border bg-slate-50/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800">
              Orçamentos ({filteredQuotes.length})
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 shadow-2xs">
              Total Filtrado: {formatCurrency(filteredTotalValue)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[190px] h-9 text-xs rounded-lg border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="OPEN">Abertos / Em Negociação</SelectItem>
                <SelectItem value="EXPIRING">Próximos do Vencimento</SelectItem>
                <SelectItem value="APPROVED">Aprovados / Aceitos</SelectItem>
                <SelectItem value="REJECTED">Recusados / Cancelados</SelectItem>
                {Object.entries(QUOTE_STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por nº, cliente ou vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-[#E2661D]/30"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resp. Comercial</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableEmpty colSpan={7} message="Nenhum orçamento encontrado." />
            ) : (
              paginatedQuotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/quotes/${quote.id}/edit`)}
                >
                  <TableCell className="font-mono font-bold text-gray-900">
                    <span className="block">{quote.quoteNumber}</span>
                    {quote.legacyNumber && (
                      <span className="text-[10px] text-blue-600 font-sans font-semibold block">Auvo: #{quote.legacyNumber}</span>
                    )}
                    <span className="text-[10px] text-gray-400 font-normal">{formatDate(quote.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {quote.client ? (
                        <>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getAvatarColor(quote.client.companyName)}`}>
                            {getInitials(quote.client.companyName)}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block text-xs">{quote.client.companyName}</span>
                            <span className="text-[11px] text-gray-400">Proposta de Locação / Serviços</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sem cliente vinculado</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900 text-xs tabular-nums">
                    {formatCurrency(Number(quote.totalAmount) || 0)}
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs">
                    {quote.validUntil ? (
                      <span className="font-medium text-gray-800">Validade: {formatDate(quote.validUntil)}</span>
                    ) : (
                      <span className="text-gray-400">{formatDate(quote.createdAt)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {quote.status === QuoteStatus.APPROVED || quote.status === QuoteStatus.ACCEPTED ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aprovada
                      </span>
                    ) : quote.status === QuoteStatus.PENDING_APPROVAL ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Em Análise
                      </span>
                    ) : quote.status === QuoteStatus.DRAFT ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Minuta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {QUOTE_STATUS_CONFIG[quote.status]?.label ?? quote.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {quote.salesRep ? (
                      <span className="text-xs font-medium text-gray-700 block">{quote.salesRep.name}</span>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          const pdfUrl = `${window.location.origin.replace(":3000", ":3001")}/public/quotes/${quote.id}`;
                          window.open(pdfUrl, "_blank");
                        }}
                        title="Visualizar / Imprimir PDF da Proposta"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/quotes/${quote.id}/edit`);
                        }}
                        title="Editar Orçamento"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {canDelete && (
                        <InlineDeleteAction
                          confirming={confirmingId === quote.id}
                          deleting={deletingId === quote.id}
                          onRequestDelete={() => setConfirmingId(quote.id)}
                          onCancelDelete={() => setConfirmingId(null)}
                          onConfirmDelete={() => handleDelete(quote.id)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredQuotes.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="propostas"
        />
      </Card>
    </div>
  );
}

'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quotesApi } from '@/lib/api/quotes';
import { Quote, QuoteStatus, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { QUOTE_STATUS_CONFIG, quoteStatusBadgeClass } from '@/lib/status-config';
import { getInitials, getAvatarColor, formatDate } from '@/lib/utils';
import { Plus, Search, FileEdit, FileText, CheckCircle, XCircle, Clock, Pencil, FileDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusCard } from '@/components/ui/status-card';
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

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.ADMINISTRATIVE;

  useEffect(() => {
    loadQuotes();
  }, []);

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

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber.includes(searchTerm) ||
      quote.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOpen = quotes.filter(q =>
    q.status === QuoteStatus.PENDING_APPROVAL || q.status === QuoteStatus.DRAFT
  ).length;
  const totalApproved = quotes.filter(q =>
    q.status === QuoteStatus.APPROVED || q.status === QuoteStatus.ACCEPTED
  ).length;
  const totalRejected = quotes.filter(q =>
    q.status === QuoteStatus.REJECTED || q.status === QuoteStatus.CANCELLED || q.status === QuoteStatus.EXPIRED
  ).length;

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
          <Button
            onClick={() => router.push('/quotes/new')}
            className="rounded-[9px] font-bold gap-2 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Orçamentos" value={quotes.length} icon={FileText} variant="orange" />
        <StatusCard label="Em Aberto / Rascunho" value={totalOpen} icon={Clock} variant="amber" />
        <StatusCard label="Aprovados / Aceitos" value={totalApproved} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Rejeitados / Expirados" value={totalRejected} icon={XCircle} variant="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[190px] h-9 text-[12.5px] rounded-[8px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(QUOTE_STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar orçamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-[12.5px] rounded-[8px] border border-input bg-background outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resp. Comercial</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableEmpty colSpan={6} message="Nenhum orçamento encontrado." />
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/quotes/${quote.id}/edit`)}
                >
                  <TableCell className="font-mono font-semibold text-primary">
                    {quote.quoteNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {quote.client ? (
                        <>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(quote.client.companyName)}`}>
                            {getInitials(quote.client.companyName)}
                          </div>
                          <span className="font-medium text-foreground">{quote.client.companyName}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Sem cliente</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(quote.createdAt)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${quoteStatusBadgeClass(quote.status)}`}>
                      {QUOTE_STATUS_CONFIG[quote.status]?.label ?? quote.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {quote.salesRep ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${getAvatarColor(quote.salesRep.name)}`}>
                          {getInitials(quote.salesRep.name)}
                        </div>
                        <span className="text-sm text-muted-foreground">{quote.salesRep.name}</span>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
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
      </Card>
    </div>
  );
}

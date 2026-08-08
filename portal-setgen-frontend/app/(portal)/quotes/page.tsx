'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quotesApi } from '@/lib/api/quotes';
import { Quote, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { QUOTE_STATUS_CONFIG, quoteStatusBadgeClass } from '@/lib/status-config';
import { getInitials, getAvatarColor, formatDate } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineDeleteAction } from '@/components/ui/inline-delete-action';
import { useInlineDelete } from '@/lib/hooks/use-inline-delete';
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
  const router = useRouter();
  const { user } = useAuthStore();
  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => quotesApi.delete(id),
    (id) => setQuotes((prev) => prev.filter((q) => q.id !== id))
  );

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
      quote.client?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <Button onClick={() => router.push('/quotes/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[190px] h-9 text-[12.5px] rounded-[8px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(QUOTE_STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por número ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Orçamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>OS gerada</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableEmpty colSpan={7} message="Nenhum orçamento encontrado" />
            ) : (
              filteredQuotes.map((quote) => {
                const respName = quote.createdBy?.name ?? '—';
                const color = getAvatarColor(respName);
                return (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="text-[13px] font-bold text-foreground">{quote.quoteNumber}</div>
                      <div className="text-[11.5px] text-text-muted">
                        {quote.type === 'VISIT_REPORT' ? 'Visita' : 'Execução'}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">{quote.client?.companyName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-bold text-[10.5px] shrink-0 ${color.bg} ${color.fg}`}>
                          {getInitials(respName)}
                        </div>
                        <span className="text-[12.5px] text-text-secondary">{respName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block text-[11.5px] font-bold px-2.5 py-1 rounded-full ${quoteStatusBadgeClass(quote.status)}`}>
                        {QUOTE_STATUS_CONFIG[quote.status].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">
                      {quote.serviceOrder ? (
                        <button
                          className="font-bold text-primary hover:underline"
                          onClick={() => router.push(`/orders/${quote.serviceOrder!.id}`)}
                        >
                          {quote.serviceOrder.orderNumber}
                        </button>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">{formatDate(quote.createdAt)}</TableCell>
                    <TableCell>
                      <InlineDeleteAction
                        confirming={confirmId === quote.id}
                        deleting={deleting}
                        onView={() => router.push(`/quotes/${quote.id}`)}
                        onEdit={
                          quote.status === 'DRAFT' || quote.status === 'REJECTED'
                            ? () => router.push(`/quotes/${quote.id}/edit`)
                            : undefined
                        }
                        onRequestDelete={canDelete && !quote.serviceOrder ? () => requestDelete(quote.id) : undefined}
                        onConfirmDelete={() => confirmDelete(quote.id)}
                        onCancelDelete={cancelDelete}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

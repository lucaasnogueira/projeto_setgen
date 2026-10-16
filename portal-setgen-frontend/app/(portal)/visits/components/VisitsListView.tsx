"use client"

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';
import { Search, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/pagination';
import { InlineDeleteAction } from '@/components/ui/inline-delete-action';
import { useInlineDelete } from '@/lib/hooks/use-inline-delete';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table';
import { visitTypeColors, visitTypeLabels } from '../lib/visit-type-labels';

export function VisitsListView() {
  const [visits, setVisits] = useState<TechnicalVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const router = useRouter();
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => visitsApi.delete(id),
    (id) => setVisits((prev) => prev.filter((v) => v.id !== id))
  );

  useEffect(() => {
    loadVisits();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadVisits = async () => {
    try {
      const data = await visitsApi.getAll();
      setVisits(data);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = useMemo(() => {
    return visits.filter(visit =>
      visit.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visits, searchTerm]);

  const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE) || 1;
  const paginatedVisits = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVisits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVisits, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-t-0 hover:bg-transparent">
            <TableHead>Identificador</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead className="w-[120px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVisits.length === 0 ? (
            <TableEmpty colSpan={6} icon={ClipboardList} message="Nenhuma visita encontrada" />
          ) : (
            paginatedVisits.map((visit) => {
              const code = visit.visitNumber || `VT-${visit.id.slice(0, 6).toUpperCase()}`;
              const categoryNames: Record<string, string> = {
                ELECTRICAL: 'Elétrica',
                CIVIL: 'Civil',
                MAINTENANCE: 'Manutenção',
              };
              const catLabel = categoryNames[visit.serviceCategory || 'ELECTRICAL'] || 'Elétrica';

              return (
                <TableRow
                  key={visit.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/visits/${visit.id}`)}
                >
                  <TableCell>
                    <span className="font-mono font-bold text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-[13px] font-bold text-foreground">{visit.client?.companyName}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {catLabel}
                    </span>
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {new Date(visit.visitDate).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {visit.technician?.name || '—'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineDeleteAction
                      confirming={confirmId === visit.id}
                      deleting={deleting}
                      onView={() => router.push(`/visits/${visit.id}`)}
                      onEdit={() => router.push(`/visits/${visit.id}/edit`)}
                      onRequestDelete={() => requestDelete(visit.id)}
                      onConfirmDelete={() => confirmDelete(visit.id)}
                      onCancelDelete={cancelDelete}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredVisits.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        itemLabel="visitas"
      />
    </Card>
  );
}

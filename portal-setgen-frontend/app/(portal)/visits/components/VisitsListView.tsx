"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';
import { Search, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  const router = useRouter();
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => visitsApi.delete(id),
    (id) => setVisits((prev) => prev.filter((v) => v.id !== id))
  );

  useEffect(() => {
    loadVisits();
  }, []);

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

  const filteredVisits = visits.filter(visit =>
    visit.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead>Local</TableHead>
            <TableHead className="w-[96px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVisits.length === 0 ? (
            <TableEmpty colSpan={6} icon={ClipboardList} message="Nenhuma visita encontrada" />
          ) : (
            filteredVisits.map((visit) => (
              <TableRow
                key={visit.id}
                className="cursor-pointer"
                onClick={() => router.push(`/visits/${visit.id}`)}
              >
                <TableCell>
                  <div className="text-[13px] font-bold text-foreground">{visit.client?.companyName}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-block text-[11.5px] font-bold px-2.5 py-1 rounded-full ${visitTypeColors[visit.visitType]}`}>
                    {visitTypeLabels[visit.visitType]}
                  </span>
                </TableCell>
                <TableCell className="text-[12.5px] text-text-secondary">
                  {new Date(visit.visitDate).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-[12.5px] text-text-secondary">
                  {visit.technician?.name || '—'}
                </TableCell>
                <TableCell className="text-[12.5px] text-text-secondary">
                  {visit.location || '—'}
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
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

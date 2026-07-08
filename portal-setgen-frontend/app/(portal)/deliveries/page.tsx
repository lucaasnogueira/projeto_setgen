"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Truck, Plus } from 'lucide-react';
import { Delivery } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => deliveriesApi.delete(id),
    (id) => setDeliveries((prev) => prev.filter((d) => d.id !== id))
  );

  useEffect(() => {
    deliveriesApi.getAll()
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Baixa de Serviços"
        subtitle="Registre a conclusão e aceite de serviços"
        actions={
          <Button onClick={() => router.push('/deliveries/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Registrar Baixa
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Baixa</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.length === 0 ? (
              <TableEmpty colSpan={6} icon={Truck} message="Nenhuma baixa de serviço registrada" />
            ) : (
              deliveries.map((delivery) => (
                <TableRow
                  key={delivery.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/deliveries/${delivery.id}`)}
                >
                  <TableCell className="text-[13px] font-bold text-foreground">
                    Baixa #{delivery.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {delivery.serviceOrder?.orderNumber || '—'}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {delivery.serviceOrder?.client?.companyName || '—'}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {new Date(delivery.deliveryDate).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary max-w-[240px] truncate">
                    {delivery.notes || '—'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineDeleteAction
                      confirming={confirmId === delivery.id}
                      deleting={deleting}
                      onView={() => router.push(`/deliveries/${delivery.id}`)}
                      onEdit={() => router.push(`/deliveries/${delivery.id}/edit`)}
                      onRequestDelete={() => requestDelete(delivery.id)}
                      onConfirmDelete={() => confirmDelete(delivery.id)}
                      onCancelDelete={cancelDelete}
                    />
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

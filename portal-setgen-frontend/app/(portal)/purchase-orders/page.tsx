"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { ShoppingCart, Plus } from 'lucide-react';
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

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => purchaseOrdersApi.delete(id),
    (id) => setOrders((prev) => prev.filter((o) => o.id !== id))
  );

  useEffect(() => {
    purchaseOrdersApi.getAll()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ordens de Compra"
        subtitle="Gerencie as OC dos clientes"
        actions={
          <Button onClick={() => router.push('/purchase-orders/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Nova Ordem de Compra
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>OC</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableEmpty colSpan={5} icon={ShoppingCart} message="Nenhuma OC cadastrada" />
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/purchase-orders/${order.id}`)}
                >
                  <TableCell className="text-[13px] font-bold text-foreground">
                    OC {order.orderNumber}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {order.serviceOrder?.client?.name || order.serviceOrder?.client?.companyName || '—'}
                  </TableCell>
                  <TableCell className="text-[12.5px] font-bold text-foreground">
                    R$ {order.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {new Date(order.issueDate).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineDeleteAction
                      confirming={confirmId === order.id}
                      deleting={deleting}
                      onView={() => router.push(`/purchase-orders/${order.id}`)}
                      onEdit={() => router.push(`/purchase-orders/${order.id}/edit`)}
                      onRequestDelete={() => requestDelete(order.id)}
                      onConfirmDelete={() => confirmDelete(order.id)}
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

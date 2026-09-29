"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { PurchaseOrder, PurchaseOrderStatus } from '@/types';
import { ShoppingCart, Plus, CheckCircle, Clock, AlertCircle, Search, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusCard } from '@/components/ui/status-card';
import { InlineDeleteAction } from '@/components/ui/inline-delete-action';
import { useInlineDelete } from '@/lib/hooks/use-inline-delete';
import { formatDate, formatCurrency } from '@/lib/utils';
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
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filtered = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      (o.quote?.quoteNumber && o.quote.quoteNumber.toLowerCase().includes(term)) ||
      (o.client?.companyName && o.client.companyName.toLowerCase().includes(term))
    );
  });

  const totalApproved = orders.filter(o => o.status === PurchaseOrderStatus.APPROVED).length;
  const totalPending = orders.filter(o => o.status === PurchaseOrderStatus.PENDING).length;
  const totalExpired = orders.filter(o => o.status === PurchaseOrderStatus.EXPIRED).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E2661D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ordens de Compra dos Clientes (OCs)"
        subtitle={`${filtered.length} ordens de compra e autorizações emitidas por clientes vinculadas a orçamentos`}
        actions={
          <Button
            onClick={() => router.push('/purchase-orders/new')}
            className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white"
          >
            <Plus className="h-4 w-4" />
            Nova OC de Cliente
          </Button>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de OCs Recebidas" value={orders.length} icon={ShoppingCart} variant="orange" />
        <StatusCard label="OCs Aprovadas" value={totalApproved} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Aguardando Validação" value={totalPending} icon={Clock} variant="amber" />
        <StatusCard label="OCs Expiradas" value={totalExpired} icon={AlertCircle} variant="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nº da OC, orçamento ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-[#E2661D]/30"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Número OC (Cliente)</TableHead>
              <TableHead>Orçamento Aprovado</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor Autorizado</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty colSpan={7} icon={ShoppingCart} message="Nenhuma ordem de compra encontrada" />
            ) : (
              filtered.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-gray-50/50"
                  onClick={() => router.push(`/purchase-orders/${order.id}`)}
                >
                  <TableCell className="text-[13px] font-bold font-mono text-[#E2661D]">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="text-[12.5px] font-mono text-muted-foreground">
                    {order.quote?.quoteNumber || '—'}
                  </TableCell>
                  <TableCell className="text-[12.5px] font-medium text-foreground">
                    {order.client?.companyName || order.quote?.client?.companyName || '—'}
                  </TableCell>
                  <TableCell className="text-[12.5px] font-bold text-foreground">
                    {order.value ? formatCurrency(order.value) : '—'}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">
                    {formatDate(order.issueDate || order.createdAt)}
                  </TableCell>
                  <TableCell className="text-[12px]">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      order.status === PurchaseOrderStatus.APPROVED
                        ? 'bg-emerald-50 text-emerald-700'
                        : order.status === PurchaseOrderStatus.EXPIRED
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {order.status === PurchaseOrderStatus.APPROVED ? 'Aprovada' : order.status === PurchaseOrderStatus.EXPIRED ? 'Expirada' : 'Pendente'}
                    </span>
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

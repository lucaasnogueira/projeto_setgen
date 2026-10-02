'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrder, ServiceOrderStatus, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { SERVICE_ORDER_STATUS_CONFIG, serviceOrderStatusBadgeClass } from '@/lib/status-config';
import { getInitials, getAvatarColor, formatDate } from '@/lib/utils';
import { Plus, Search, Eye, Wrench, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusCard } from '@/components/ui/status-card';
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const router = useRouter();
  const { user } = useAuthStore();
  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => ordersApi.delete(id),
    (id) => setOrders((prev) => prev.filter((o) => o.id !== id))
  );

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.includes(searchTerm) ||
      order.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOpen = orders.filter(o =>
    o.status === ServiceOrderStatus.AWAITING_MATERIALS || o.status === ServiceOrderStatus.IN_PROGRESS
  ).length;
  const totalCompleted = orders.filter(o =>
    o.status === ServiceOrderStatus.COMPLETED
  ).length;
  const totalCancelled = orders.filter(o =>
    o.status === ServiceOrderStatus.CANCELLED
  ).length;

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
        title="Ordens de Serviço"
        subtitle={`${filteredOrders.length} O.S. técnicas em execução ou concluídas`}
        actions={
          <Button
            onClick={() => router.push('/orders/new')}
            className="rounded-[9px] font-bold gap-2 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4" />
            Nova O.S.
          </Button>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de O.S." value={orders.length} icon={Wrench} variant="orange" />
        <StatusCard label="Em Andamento / Abertas" value={totalOpen} icon={Clock} variant="amber" />
        <StatusCard label="Concluídas" value={totalCompleted} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Canceladas" value={totalCancelled} icon={XCircle} variant="red" />
      </div>

      <Card className="overflow-hidden">
        {/* Barra de Filtros Responsiva */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[190px] h-9 text-[12.5px] rounded-[8px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(SERVICE_ORDER_STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar O.S. ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-[12.5px] rounded-[8px] border border-input bg-background outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 1. Modo Mobile: Lista de Cards Touch-Friendly */}
        <div className="block md:hidden divide-y divide-border">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              Nenhuma ordem de serviço encontrada.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="p-4 active:bg-muted/40 transition-colors flex flex-col gap-2.5 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-primary text-[14px]">
                    {order.orderNumber}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${serviceOrderStatusBadgeClass(order.status)}`}>
                    {SERVICE_ORDER_STATUS_CONFIG[order.status]?.label ?? order.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {order.client ? (
                    <>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${getAvatarColor(order.client.companyName)}`}>
                        {getInitials(order.client.companyName)}
                      </div>
                      <span className="font-medium text-foreground text-[13px] truncate">
                        {order.client.companyName}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">Sem cliente</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11.5px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>Criado: {formatDate(order.createdAt)}</span>
                  <span>Prazo: {order.deadline ? formatDate(order.deadline) : '—'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. Modo Desktop: Tabela Completa */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº O.S.</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Prazo Limite</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableEmpty colSpan={6} message="Nenhuma ordem de serviço encontrada." />
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-mono font-bold text-primary">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.client ? (
                          <>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(order.client.companyName)}`}>
                              {getInitials(order.client.companyName)}
                            </div>
                            <span className="font-medium text-foreground">{order.client.companyName}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">Sem cliente</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.deadline ? formatDate(order.deadline) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${serviceOrderStatusBadgeClass(order.status)}`}>
                        {SERVICE_ORDER_STATUS_CONFIG[order.status]?.label ?? order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => router.push(`/orders/${order.id}`)}
                          title="Ver detalhes da O.S."
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canDelete && (
                          <InlineDeleteAction
                            confirming={confirmId === order.id}
                            deleting={deleting}
                            onRequestDelete={() => requestDelete(order.id)}
                            onCancelDelete={cancelDelete}
                            onConfirmDelete={() => confirmDelete(order.id)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

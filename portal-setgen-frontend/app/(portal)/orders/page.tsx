'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrder, ServiceOrderStatus, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { SERVICE_ORDER_STATUS_CONFIG, serviceOrderStatusBadgeClass } from '@/lib/status-config';
import { getInitials, getAvatarColor, formatDate } from '@/lib/utils';
import { Plus, Search, Eye, Wrench, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusCard } from '@/components/ui/status-card';
import { TablePagination } from '@/components/ui/pagination';
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.orderNumber.includes(searchTerm) ||
        order.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
        <StatusCard label="Total de O.S." value={orders.length} icon={Wrench} variant="orange" />
        <StatusCard label="Em Andamento / Abertas" value={totalOpen} icon={Clock} variant="amber" />
        <StatusCard label="Concluídas" value={totalCompleted} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Canceladas" value={totalCancelled} icon={XCircle} variant="red" />
      </div>

      <Card className="overflow-hidden border border-gray-200/75 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 border-b border-border">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[190px] h-9 text-xs rounded-lg border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(SERVICE_ORDER_STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar O.S. ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-gray-200 bg-background outline-none focus:ring-2 focus:ring-[#E2661D]/30"
            />
          </div>
        </div>

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
              paginatedOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell className="font-mono font-bold text-gray-900">
                    <span className="block">{order.orderNumber}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{formatDate(order.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.client ? (
                        <>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getAvatarColor(order.client.companyName)}`}>
                            {getInitials(order.client.companyName)}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block text-xs">{order.client.companyName}</span>
                            <span className="text-[11px] text-gray-400">Usina / Planta Industrial</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sem cliente vinculado</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs">
                    {order.deadline ? (
                      <span className="font-medium text-gray-800">{formatDate(order.deadline)}</span>
                    ) : (
                      <span className="text-gray-400">Sem prazo definido</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.status === ServiceOrderStatus.COMPLETED ? (
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Concluída
                      </span>
                    ) : order.status === ServiceOrderStatus.IN_PROGRESS ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Em Andamento
                      </span>
                    ) : order.status === ServiceOrderStatus.AWAITING_MATERIALS ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Aguardando Peças
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${serviceOrderStatusBadgeClass(order.status)}`}>
                        {SERVICE_ORDER_STATUS_CONFIG[order.status]?.label ?? order.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                      >
                        Abrir O.S. ↗
                      </button>
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

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="ordens"
        />
      </Card>
    </div>
  );
}

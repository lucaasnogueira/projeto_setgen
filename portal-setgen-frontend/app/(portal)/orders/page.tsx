'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrder } from '@/types';
import { getStatusColor, getStatusLabel, getInitials, getAvatarColor, formatDate } from '@/lib/utils';
import { Plus, Search, Eye, Edit } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      order.client?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
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
        title="Ordens de Serviço"
        subtitle={`${filteredOrders.length} ordens neste mês`}
        actions={
          <Button onClick={() => router.push('/orders/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Nova OS
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
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="PENDING_APPROVAL">Aguardando Aprovação</SelectItem>
              <SelectItem value="APPROVED">Aprovada</SelectItem>
              <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
              <SelectItem value="COMPLETED">Concluída</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
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
              <TableHead>OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Abertura</TableHead>
              <TableHead className="w-11" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableEmpty colSpan={6} message="Nenhuma OS encontrada" />
            ) : (
              filteredOrders.map((order) => {
                const respName = order.createdBy?.name ?? '—';
                const color = getAvatarColor(respName);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="text-[13px] font-bold text-foreground">{order.orderNumber}</div>
                      <div className="text-[11.5px] text-text-muted">
                        {order.type === 'VISIT_REPORT' ? 'Visita' : 'Execução'}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">{order.client?.companyName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-bold text-[10.5px] shrink-0 ${color.bg} ${color.fg}`}>
                          {getInitials(respName)}
                        </div>
                        <span className="text-[12.5px] text-text-secondary">{respName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block text-[11.5px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="p-1.5 text-text-muted hover:text-primary hover:bg-muted/40 rounded-md transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(order.status === 'DRAFT' || order.status === 'REJECTED') && (
                          <button
                            onClick={() => router.push(`/orders/${order.id}/edit`)}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-muted/40 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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

"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrder, UserRole, ServiceOrderStatus } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  FileText, 
  Calendar, 
  User, 
  Briefcase, 
  Clock, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Info,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  AlertTriangle,
  Wrench,
  Layers,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailHeader } from "@/components/layout/DetailHeader";
import Link from 'next/link';
import { StatusTimeline } from '../components/StatusTimeline';
import { StatusManager } from '../components/StatusManager';

const statusColors = {
  DRAFT: 'bg-status-gray-bg text-status-gray-fg',
  PENDING_APPROVAL: 'bg-status-amber-bg text-status-amber-fg',
  APPROVED: 'bg-status-blue-bg text-status-blue-fg',
  REJECTED: 'bg-status-red-bg text-status-red-fg',
  IN_PROGRESS: 'bg-status-purple-bg text-status-purple-fg',
  COMPLETED: 'bg-status-green-bg text-status-green-fg',
  CANCELLED: 'bg-status-red-bg text-status-red-fg',
};

const statusLabels = {
  DRAFT: 'Rascunho',
  PENDING_APPROVAL: 'Pendente Aprovação',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  // const [statusHistory, setStatusHistory] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(params.id as string);
      setOrder(data);
      // Load status history
      // const history = await ordersApi.getStatusHistory(params.id as string);
      // setStatusHistory(history);
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Erro ao carregar detalhes da OS');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: ServiceOrderStatus, comments?: string) => {
    try {
      const updatedOrder = await ordersApi.updateStatus(params.id as string, newStatus, comments);
      setOrder(updatedOrder);
      // Reload status history
      // const history = await ordersApi.getStatusHistory(params.id as string);
      // setStatusHistory(history);
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta OS?')) return;

    try {
      await ordersApi.delete(params.id as string);
      alert('OS excluída com sucesso!');
      router.push('/orders');
    } catch (error) {
      alert('Erro ao excluir OS');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={FileText}
        tone="blue"
        title={`OS #${order.orderNumber}`}
        subtitle={
          <>
            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
            <span>{order.client?.companyName}</span>
          </>
        }
        onBack={() => router.back()}
        backLabel="Voltar para lista"
        actions={
          <>
            <Link href={`/orders/${order.id}/edit`}>
              <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-[9px] font-bold gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Descrição do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {order.reportedDefects && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Defeitos Relatados
                  </h4>
                  <p className="text-gray-700 bg-red-50/50 p-4 rounded-xl border border-red-100 leading-relaxed whitespace-pre-wrap">
                    {order.reportedDefects}
                  </p>
                </div>
              )}

              {order.requestedServices && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Serviços Solicitados
                  </h4>
                  <p className="text-gray-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100 leading-relaxed whitespace-pre-wrap">
                    {order.requestedServices}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-800">Escopo Geral</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap p-4 rounded-xl bg-gray-50 border border-gray-100">
                  {order.scope}
                </p>
              </div>

              {order.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-amber-600 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Observações Importantes
                  </h4>
                  <p className="text-gray-700 bg-amber-50/50 p-4 rounded-xl border border-amber-100 leading-relaxed whitespace-pre-wrap italic">
                    {order.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Materiais e Produtos */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Layers className="h-5 w-5 text-blue-600" />
                Materiais e Produtos Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-8 text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                      <th className="text-right py-4 px-8 text-xs font-bold text-gray-500 uppercase tracking-wider">Qtd</th>
                      <th className="text-right py-4 px-8 text-xs font-bold text-gray-500 uppercase tracking-wider">V. Unit</th>
                      <th className="text-right py-4 px-8 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(!order.items || order.items.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400 italic">
                          Nenhum material registrado para esta OS.
                        </td>
                      </tr>
                    ) : (
                      order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-8">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <Tag className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{item.product?.name}</p>
                                <p className="text-xs text-gray-500">{item.product?.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-8 text-right font-medium text-gray-700">
                            {item.quantity} {item.product?.unit}
                          </td>
                          <td className="py-4 px-8 text-right text-gray-600">
                            {Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-4 px-8 text-right font-bold text-blue-600">
                            {Number(item.totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {order.items && order.items.length > 0 && (
                    <tfoot className="bg-blue-50/30">
                      <tr>
                        <td colSpan={3} className="py-6 px-8 text-right font-bold text-gray-700">Custo Total de Materiais:</td>
                        <td className="py-6 px-8 text-right text-xl font-black text-blue-700">
                          {order.items.reduce((acc, i) => acc + Number(i.totalPrice), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>

          {order.checklist && order.checklist.length > 0 && (
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Checklist de Execução
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-3">
                  {order.checklist.map((item: any, index: number) => (
                    <div key={item.id ?? index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className={`p-1 rounded-full ${item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}`}>
                          {item.label ?? item.item}
                        </span>
                        {item.answer !== undefined && item.answer !== null && item.answer !== '' && (
                          <p className="text-xs text-gray-500 mt-0.5">Resposta: {String(item.answer)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <Info className="h-5 w-5 text-blue-600" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Prazo</p>
                    <p className="text-gray-700 font-medium">
                      {order.deadline ? new Date(order.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Criador por</p>
                    <p className="text-gray-700 font-medium">{order.createdBy?.name || 'Sistema'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Data de Criação</p>
                    <p className="text-gray-700 font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-bold uppercase">Progresso</p>
                  <p className="text-sm font-bold text-blue-600">{order.progress || 0}%</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${order.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <StatusTimeline currentStatus={order.status} />
            </CardContent>
          </Card>

          {/* Status Manager */}
          {user && (
            <StatusManager 
              currentStatus={order.status}
              userRole={user.role}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Status History - Temporarily disabled due to missing backend endpoint */}
          {/* {statusHistory.length > 0 && (
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                  Histórico de Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-700">
                            {statusLabels[history.previousStatus as ServiceOrderStatus]} → {statusLabels[history.newStatus as ServiceOrderStatus]}
                          </span>
                        </div>
                        {history.comments && (
                          <p className="text-sm text-gray-600 italic mt-1">{history.comments}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <User className="h-3 w-3" />
                          {history.changedBy?.name || 'Sistema'}
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          {new Date(history.changedAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )} */}
        </div>
      </div>
    </div>
  );
}

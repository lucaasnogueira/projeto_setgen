"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvalsApi } from '@/lib/api/approvals';
import { ServiceOrder } from '@/types';
import { 
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building2,
  User,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function ApprovalsPage() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const data = await approvalsApi.getPending();
      setPendingOrders(data);
    } catch (error) {
      console.error('Erro ao carregar aprovações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await approvalsApi.approve(id);
      loadPendingApprovals();
      alert('OS aprovada com sucesso!');
    } catch (error) {
      alert('Erro ao aprovar OS');
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    try {
      await approvalsApi.reject(id, reason);
      loadPendingApprovals();
      alert('OS rejeitada');
    } catch (error) {
      alert('Erro ao rejeitar OS');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Aprovações</h1>
            <p className="text-yellow-100">
              {pendingOrders.length} ordens aguardando aprovação
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link href="/approvals/new">
              <button className="px-6 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 flex items-center gap-2 shadow-lg font-medium">
                <Plus className="h-4 w-4" />
                Nova Aprovação
              </button>
            </Link>
            <AlertCircle className="h-12 w-12 opacity-50" />
          </div>
        </div>
      </div>

      {/* Lista de Aprovações */}
      <div className="space-y-4">
        {pendingOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">Tudo em dia!</p>
            <p className="text-gray-400 text-sm mt-1">
              Não há ordens pendentes de aprovação no momento
            </p>
          </div>
        ) : (
          pendingOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-yellow-500 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => router.push(`/approvals/${order.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        OS {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {order.type === 'VISIT_REPORT' ? 'Relatório de Visita' : 'Execução'}
                      </p>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {order.client?.companyName}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4 text-gray-400" />
                      {order.createdBy?.name || 'Sem responsável'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Escopo */}
                  {order.scope && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Escopo:</p>
                      <p className="text-sm text-gray-600">{order.scope}</p>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => handleApprove(e, order.id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 font-medium shadow-lg"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Aprovar
                    </button>
                    <button
                      onClick={(e) => handleReject(e, order.id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-2 font-medium shadow-lg"
                    >
                      <XCircle className="h-5 w-5" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

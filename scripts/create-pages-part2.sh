#!/bin/bash

# ========================================
# Portal Setgen - Páginas Parte 2
# ========================================
# Ordens de Serviço + Aprovações
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Criando Ordens de Serviço e Aprovações"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# ORDENS DE SERVIÇO
# ========================================

echo -e "${YELLOW}📄 Criando página de Ordens de Serviço...${NC}"

cat > "app/(portal)/orders/page.tsx" << 'EOF'
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrder } from '@/types';
import { 
  Plus, 
  Search, 
  FileText,
  Calendar,
  User,
  Building2,
  Eye,
  Edit,
} from 'lucide-react';

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  DRAFT: 'Rascunho',
  PENDING_APPROVAL: 'Aguardando Aprovação',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

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
      order.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ordens de Serviço</h1>
            <p className="text-blue-100">Gerencie todas as ordens de serviço</p>
          </div>
          <FileText className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Todos os Status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="PENDING_APPROVAL">Aguardando Aprovação</option>
              <option value="APPROVED">Aprovada</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="COMPLETED">Concluída</option>
            </select>
          </div>
          <button 
            onClick={() => router.push('/orders/new')}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Nova OS
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  OS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Nenhuma OS encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">#{order.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{order.client?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.type === 'VISIT_REPORT' ? 'Visita' : 'Execução'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === 'DRAFT' && (
                          <button
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Página de Ordens de Serviço criada!${NC}"

# ========================================
# APROVAÇÕES
# ========================================

echo -e "${YELLOW}✅ Criando página de Aprovações...${NC}"

cat > "app/(portal)/approvals/page.tsx" << 'EOF'
"use client"

import { useEffect, useState } from 'react';
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
} from 'lucide-react';

export default function ApprovalsPage() {
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

  const handleApprove = async (id: string) => {
    try {
      await approvalsApi.approve(id);
      loadPendingApprovals();
      alert('OS aprovada com sucesso!');
    } catch (error) {
      alert('Erro ao aprovar OS');
    }
  };

  const handleReject = async (id: string) => {
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
          <AlertCircle className="h-16 w-16 opacity-50" />
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
              className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-yellow-500"
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
                      {order.client?.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4 text-gray-400" />
                      {order.technician?.name || 'Sem técnico'}
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
                      onClick={() => handleApprove(order.id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-2 font-medium shadow-lg"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
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
EOF

echo -e "${GREEN}✅ Página de Aprovações criada!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Parte 2 Completa!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}Criadas:${NC}"
echo "  ✓ Ordens de Serviço"
echo "  ✓ Aprovações"
echo ""

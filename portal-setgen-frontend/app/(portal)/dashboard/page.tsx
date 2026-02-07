"use client"

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import { getRoleLabel } from '@/lib/utils';
import {
  Clock,
  FileText,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  const canSeeFinancials = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canSeeBillingAlerts = canSeeFinancials || user?.role === 'ADMINISTRATIVE';

  const canCreateClient = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ADMINISTRATIVE';
  const canCreateInvoice = canCreateClient;
  const canCreateVisit = user?.role !== 'WAREHOUSE';

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Bom dia' : today.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const dateStr = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          {greeting}, {user?.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-orange-100 capitalize">{dateStr}</p>
        <p className="text-sm text-orange-100 mt-1">
          Perfil: {user && getRoleLabel(user.role)}
        </p>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Aprovações Pendentes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Aprovações Pendentes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              <p className="text-xs text-gray-500 mt-2">Aguardando sua aprovação</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* OS Ativas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">OS Ativas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
              <p className="text-xs text-gray-500 mt-2">Em andamento</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Concluídas (Mês) */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Concluídas (Mês)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedThisMonth}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-xs text-green-600 font-medium">+12% vs mês anterior</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Faturamento Total */}
        {canSeeFinancials && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-emerald-500 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Faturamento Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">Acumulado no ano</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards Secundários */}
      <div className={`grid grid-cols-1 ${canSeeBillingAlerts ? 'md:grid-cols-2' : ''} gap-6`}>
        {/* Estoque Baixo */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estoque Baixo</p>
              <p className="text-3xl font-bold text-gray-900">{stats.lowStockItems}</p>
              <p className="text-xs text-yellow-600 mt-2">Itens abaixo do estoque mínimo</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* NFe Vencidas */}
        {canSeeBillingAlerts && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-red-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">NFe Vencidas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overdueInvoices}</p>
                <p className="text-xs text-red-600 mt-2">Requer atenção imediata</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Atividades Recentes</h2>
        <div className="space-y-3">
          {stats.recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma atividade recente</p>
          ) : (
            stats.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-l-4 border-l-blue-500 hover:bg-gray-100 transition-colors"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Ações Rápidas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {canCreateClient && (
            <button
              onClick={() => window.location.href = '/clients/new'}
              className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all hover:scale-105"
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-800">Novo Cliente</div>
            </button>
          )}
          
          {canCreateVisit && (
            <button
              onClick={() => window.location.href = '/visits/new'}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all hover:scale-105"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="text-sm font-medium text-gray-800">Nova Visita</div>
            </button>
          )}

          <button
            onClick={() => window.location.href = '/orders/new'}
            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all hover:scale-105"
          >
            <div className="text-3xl mb-2">📄</div>
            <div className="text-sm font-medium text-gray-800">Nova OS</div>
          </button>

          {canCreateInvoice && (
            <button
              onClick={() => window.location.href = '/invoices/new'}
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all hover:scale-105"
            >
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm font-medium text-gray-800">Nova NF-e/NFS-e</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

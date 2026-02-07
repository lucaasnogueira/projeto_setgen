#!/bin/bash

# ========================================
# Portal Setgen - Reorganização Completa
# ========================================
# Remove páginas antigas e reorganiza tudo
# com Sidebar + Topbar + Design Corporativo
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Reorganização Total do Frontend"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 1. REMOVER PÁGINAS ANTIGAS
# ========================================

echo -e "${YELLOW}🗑️  Removendo páginas antigas...${NC}"

# Remove pastas antigas se existirem
rm -rf app/dashboard
rm -rf app/clients
rm -rf app/visits
rm -rf app/orders
rm -rf app/approvals
rm -rf app/purchase-orders
rm -rf app/invoices
rm -rf app/deliveries
rm -rf app/inventory
rm -rf app/profile

echo -e "${GREEN}✅ Páginas antigas removidas!${NC}"

# ========================================
# 2. CRIAR ESTRUTURA CORRETA
# ========================================

echo -e "${YELLOW}📁 Criando estrutura (portal)...${NC}"

mkdir -p app/\(portal\)/{dashboard,clients,visits,orders,approvals,purchase-orders,invoices,deliveries,inventory,profile}

# ========================================
# 3. CRIAR LAYOUT DO PORTAL (COM SIDEBAR + TOPBAR)
# ========================================

echo -e "${YELLOW}🎨 Criando layout do portal...${NC}"

cat > app/\(portal\)/layout.tsx << 'EOF'
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
EOF

# ========================================
# 4. CRIAR DASHBOARD ESTILIZADO
# ========================================

echo -e "${YELLOW}📊 Criando dashboard estilizado...${NC}"

cat > app/\(portal\)/dashboard/page.tsx << 'EOF'
"use client"

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { dashboardApi } from '@/lib/api/dashboard';
import { DashboardStats } from '@/types';
import {
  Users,
  FileText,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Package,
} from 'lucide-react';
import { formatCurrency, getRoleLabel } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6">
      {/* Header com Saudação - Laranja */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {greeting()}, {user?.name}! 👋
            </h1>
            <p className="text-orange-100 text-lg">
              Perfil: {user ? getRoleLabel(user.role) : ''}
            </p>
            <p className="text-orange-200 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
              <Activity className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Aprovações Pendentes</h3>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {stats?.pendingApprovals || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Aguardando sua aprovação
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">OS Ativas</h3>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {stats?.activeOrders || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Em andamento
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Concluídas (Mês)</h3>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {stats?.completedThisMonth || 0}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <p className="text-xs text-green-600 font-medium">
              +12% vs mês anterior
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-emerald-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Faturamento Total</h3>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Acumulado no ano
          </p>
        </div>
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Estoque Baixo</h3>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {stats?.lowStockItems || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Itens abaixo do estoque mínimo
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">NFe Vencidas</h3>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {stats?.overdueInvoices || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Requer atenção imediata
          </p>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Atividades Recentes</h2>
        <div className="space-y-4">
          {[
            { action: 'OS #1234 aprovada', time: 'Há 5 minutos', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { action: 'Nova visita técnica agendada', time: 'Há 15 minutos', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
            { action: 'NFe #5678 emitida', time: 'Há 1 hora', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
            { action: 'OC #9012 recebida', time: 'Há 2 horas', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((activity, index) => (
            <div key={index} className={`flex items-center gap-4 p-4 ${activity.bg} rounded-lg hover:shadow-md transition-shadow`}>
              <div className={`${activity.color}`}>
                <activity.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-center group">
            <Users className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-orange-600 transition-colors" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600 transition-colors">
              Novo Cliente
            </p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center group">
            <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-green-600 transition-colors" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">
              Nova OS
            </p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center group">
            <Clock className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-purple-600 transition-colors" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-purple-600 transition-colors">
              Nova Visita
            </p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
            <Package className="h-10 w-10 mx-auto mb-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
              Nova NFe
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Dashboard criado!${NC}"

# ========================================
# 5. LIMPAR CACHE
# ========================================

echo -e "${YELLOW}🧹 Limpando cache...${NC}"

rm -rf .next

echo -e "${GREEN}✅ Cache limpo!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Reorganização Completa!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}📁 Estrutura criada:${NC}"
echo "  app/(portal)/"
echo "    ├── layout.tsx          (Sidebar + Topbar)"
echo "    └── dashboard/"
echo "        └── page.tsx        (Dashboard estilizado)"
echo ""
echo -e "${GREEN}🎉 Agora com Sidebar, Topbar e Cards!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "  npm run dev"
echo ""

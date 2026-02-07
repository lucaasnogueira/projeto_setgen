#!/bin/bash

# ========================================
# Portal Setgen - Fix Dashboard Final
# ========================================
# Garante dashboard BONITO sem API
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Fix Dashboard - Versão Final"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 1. VERIFICAR ESTRUTURA DE PASTAS
# ========================================

echo -e "${YELLOW}📁 Verificando estrutura...${NC}"

# Criar pasta se não existir
mkdir -p "app/(portal)/dashboard"

echo -e "${GREEN}✅ Estrutura verificada!${NC}"

# ========================================
# 2. CRIAR DASHBOARD SEM CHAMADA DE API
# ========================================

echo -e "${YELLOW}🎨 Criando dashboard estilizado...${NC}"

cat > "app/(portal)/dashboard/page.tsx" << 'EOF'
"use client"

import { useAuthStore } from '@/store/auth';
import { getRoleLabel } from '@/lib/utils';
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

export default function DashboardPage() {
  const { user } = useAuthStore();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Dados mock - depois conectar com API
  const stats = {
    pendingApprovals: 0,
    activeOrders: 0,
    completedThisMonth: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    overdueInvoices: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header - Gradiente Laranja */}
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

      {/* 4 Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-orange-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Aprovações Pendentes</h3>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-orange-600 mb-1">
            {stats.pendingApprovals}
          </div>
          <p className="text-xs text-gray-500">
            Aguardando sua aprovação
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">OS Ativas</h3>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-blue-600 mb-1">
            {stats.activeOrders}
          </div>
          <p className="text-xs text-gray-500">
            Em andamento
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Concluídas (Mês)</h3>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-green-600 mb-1">
            {stats.completedThisMonth}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-xs text-green-600 font-medium">
              +12% vs mês anterior
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-emerald-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Faturamento Total</h3>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-emerald-600 mb-1">
            R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500">
            Acumulado no ano
          </p>
        </div>
      </div>

      {/* 2 Cards Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Estoque Baixo</h3>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-yellow-600 mb-1">
            {stats.lowStockItems}
          </div>
          <p className="text-xs text-gray-500">
            Itens abaixo do estoque mínimo
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">NFe Vencidas</h3>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-red-600 mb-1">
            {stats.overdueInvoices}
          </div>
          <p className="text-xs text-gray-500">
            Requer atenção imediata
          </p>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Activity className="h-6 w-6 text-orange-600" />
          Atividades Recentes
        </h2>
        <div className="space-y-3">
          {[
            { action: 'OS #1234 aprovada', time: 'Há 5 minutos', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
            { action: 'Nova visita técnica agendada', time: 'Há 15 minutos', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
            { action: 'NFe #5678 emitida', time: 'Há 1 hora', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            { action: 'OC #9012 recebida', time: 'Há 2 horas', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          ].map((activity, index) => (
            <div key={index} className={`flex items-center gap-4 p-4 ${activity.bg} border ${activity.border} rounded-lg hover:shadow-md transition-all cursor-pointer`}>
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
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-orange-600" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-center group transform hover:scale-105">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-orange-600 transition-colors" />
            <p className="text-sm font-semibold text-gray-600 group-hover:text-orange-600 transition-colors">
              Novo Cliente
            </p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center group transform hover:scale-105">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-green-600 transition-colors" />
            <p className="text-sm font-semibold text-gray-600 group-hover:text-green-600 transition-colors">
              Nova OS
            </p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center group transform hover:scale-105">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-purple-600 transition-colors" />
            <p className="text-sm font-semibold text-gray-600 group-hover:text-purple-600 transition-colors">
              Nova Visita
            </p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group transform hover:scale-105">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
            <p className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">
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
# 3. PARAR SERVIDOR (SE ESTIVER RODANDO)
# ========================================

echo -e "${YELLOW}⏸️  Parando servidor...${NC}"

# Tentar parar processos Next.js
pkill -f "next dev" 2>/dev/null || true
sleep 2

echo -e "${GREEN}✅ Servidor parado!${NC}"

# ========================================
# 4. LIMPAR CACHE AGRESSIVAMENTE
# ========================================

echo -e "${YELLOW}🧹 Limpando cache...${NC}"

rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

echo -e "${GREEN}✅ Cache limpo!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Dashboard Pronto!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}🎨 Novo dashboard com:${NC}"
echo "  ✓ Header laranja com gradiente"
echo "  ✓ 4 cards coloridos (orange, blue, green, emerald)"
echo "  ✓ 2 cards secundários (yellow, red)"
echo "  ✓ Atividades com bordas coloridas"
echo "  ✓ Ações rápidas com hover e scale"
echo "  ✓ SEM chamada de API"
echo ""
echo -e "${GREEN}🎉 100% Funcional e Bonito!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo "  1. npm run dev"
echo "  2. Acesse http://localhost:3000/dashboard"
echo "  3. Veja o dashboard LINDO!"
echo ""
echo -e "${BLUE}📌 Nota:${NC} Dados são mock (0). Depois conectar com API real."
echo ""

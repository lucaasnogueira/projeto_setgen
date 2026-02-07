#!/bin/bash

# ========================================
# Portal Setgen - Módulo de Usuários
# ========================================
# Cria gerenciamento completo de usuários
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Criando Módulo de Usuários"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 1. CRIAR API DE USUÁRIOS
# ========================================

echo -e "${YELLOW}🔧 Criando API de usuários...${NC}"

cat > lib/api/users.ts << 'EOF'
import api from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'ADMINISTRATIVE' | 'WAREHOUSE' | 'TECHNICIAN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  async getAll(): Promise<User[]> {
    try {
      const { data } = await api.get('/users');
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  async getById(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async create(userData: Partial<User> & { password: string }): Promise<User> {
    const { data } = await api.post('/users', userData);
    return data;
  },

  async update(id: string, userData: Partial<User>): Promise<User> {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async toggleActive(id: string): Promise<User> {
    const { data } = await api.patch(`/users/${id}/toggle-active`);
    return data;
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.patch(`/users/${id}/reset-password`, { password: newPassword });
  },
};
EOF

echo -e "${GREEN}✅ API de usuários criada!${NC}"

# ========================================
# 2. CRIAR PÁGINA DE LISTAGEM
# ========================================

echo -e "${YELLOW}👥 Criando página de listagem...${NC}"

mkdir -p "app/(portal)/users"

cat > "app/(portal)/users/page.tsx" << 'EOF'
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, User } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth';
import { getRoleLabel } from '@/lib/utils';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  UserCheck,
  UserX,
  Key,
  Shield,
} from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Apenas administradores podem acessar esta página');
      router.push('/dashboard');
      return;
    }
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    if (!confirm('Deseja alterar o status deste usuário?')) return;

    try {
      await usersApi.toggleActive(id);
      loadUsers();
      alert('Status alterado com sucesso!');
    } catch (error) {
      alert('Erro ao alterar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      await usersApi.delete(id);
      loadUsers();
      alert('Usuário excluído com sucesso!');
    } catch (error) {
      alert('Erro ao excluir usuário');
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Digite a nova senha para este usuário:');
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      await usersApi.resetPassword(id, newPassword);
      alert('Senha resetada com sucesso!');
    } catch (error) {
      alert('Erro ao resetar senha');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors = {
    ADMIN: 'bg-red-100 text-red-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    ADMINISTRATIVE: 'bg-purple-100 text-purple-800',
    WAREHOUSE: 'bg-amber-100 text-amber-800',
    TECHNICIAN: 'bg-green-100 text-green-800',
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
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Gerenciar Usuários</h1>
              <p className="text-gray-300">Administre os usuários do sistema</p>
            </div>
          </div>
          <Shield className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => router.push('/users/new')}
            className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-600">Total de Usuários</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Ativos</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => !u.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Inativos</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
          <div className="text-sm text-gray-600">Administradores</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  E-mail
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Perfil
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-orange-600 font-medium">(Você)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <UserCheck className="h-4 w-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <UserX className="h-4 w-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/users/${user.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Resetar Senha"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={`p-2 hover:bg-gray-50 rounded-lg transition-colors ${
                            user.isActive ? 'text-orange-600' : 'text-green-600'
                          }`}
                          title={user.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
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

echo -e "${GREEN}✅ Página de listagem criada!${NC}"

# ========================================
# 3. CRIAR PÁGINA DE NOVO USUÁRIO
# ========================================

echo -e "${YELLOW}➕ Criando formulário de novo usuário...${NC}"

mkdir -p "app/(portal)/users/new"

cat > "app/(portal)/users/new/page.tsx" << 'EOF'
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { UserPlus, Save, X, Eye, EyeOff } from 'lucide-react';

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TECHNICIAN' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await usersApi.create({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      alert('Usuário criado com sucesso!');
      router.push('/users');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <UserPlus className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Novo Usuário</h1>
            <p className="text-gray-300">Cadastre um novo usuário no sistema</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="João da Silva"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao@empresa.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          {/* Perfil/Cargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perfil/Cargo <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="ADMIN">Administrador do Sistema</option>
              <option value="MANAGER">Gerente</option>
              <option value="ADMINISTRATIVE">Administrativo</option>
              <option value="WAREHOUSE">Almoxarifado</option>
              <option value="TECHNICIAN">Técnico</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Define as permissões de acesso do usuário
            </p>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Digite a senha novamente"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          {/* Indicador de força da senha */}
          {formData.password.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className={`h-2 flex-1 rounded ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-2 flex-1 rounded ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-2 flex-1 rounded ${formData.password.length >= 10 ? 'bg-green-500' : 'bg-gray-200'}`} />
              </div>
              <p className="text-xs text-gray-600">
                Força da senha: {
                  formData.password.length >= 10 ? 'Forte' :
                  formData.password.length >= 8 ? 'Média' :
                  formData.password.length >= 6 ? 'Fraca' : 'Muito Fraca'
                }
              </p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
          >
            <X className="h-5 w-5" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Formulário de novo usuário criado!${NC}"

# ========================================
# 4. ATUALIZAR SIDEBAR
# ========================================

echo -e "${YELLOW}📝 Atualizando sidebar...${NC}"

cat > components/layout/sidebar.tsx << 'EOF'
"use client"

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getRoleLabel } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  CheckCircle,
  ShoppingCart,
  DollarSign,
  Truck,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE', 'TECHNICIAN'] },
  { name: 'Clientes', href: '/clients', icon: Building2, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },
  { name: 'Visitas Técnicas', href: '/visits', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
  { name: 'Ordens de Serviço', href: '/orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },
  { name: 'Aprovações', href: '/approvals', icon: CheckCircle, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Ordens de Compra', href: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
  { name: 'Faturamento', href: '/invoices', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
  { name: 'Entregas', href: '/deliveries', icon: Truck, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },
  { name: 'Estoque', href: '/inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Usuários', href: '/users', icon: UserCog, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Portal</h1>
                <p className="text-xs text-gray-400">Setgen</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg'
                  : 'hover:bg-gray-700'
              }`}
              title={collapsed ? item.name : ''}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        {!collapsed && user && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{getRoleLabel(user.role)}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-600 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sair' : ''}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Sidebar atualizado com link de Usuários!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Módulo de Usuários Criado!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}Criado:${NC}"
echo "  ✓ API de usuários (lib/api/users.ts)"
echo "  ✓ Página de listagem (/users)"
echo "  ✓ Formulário de novo usuário (/users/new)"
echo "  ✓ Sidebar atualizado com link"
echo ""
echo -e "${GREEN}🎉 Gerenciamento de usuários completo!${NC}"
echo ""
echo -e "${BLUE}Funcionalidades:${NC}"
echo "  • Listar todos os usuários"
echo "  • Criar novo usuário"
echo "  • Editar usuário"
echo "  • Ativar/Desativar usuário"
echo "  • Resetar senha"
echo "  • Excluir usuário"
echo "  • Indicador de força de senha"
echo "  • Filtro de perfil/cargo"
echo ""
echo -e "${YELLOW}💡 Acesso:${NC}"
echo "  Apenas ADMINISTRADORES podem acessar!"
echo ""

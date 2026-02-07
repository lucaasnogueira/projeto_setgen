#!/bin/bash

# ========================================
# Portal Setgen - Design Corporativo Completo
# ========================================
# Refaz TUDO seguindo o prompt de design:
# - Login profissional
# - Sidebar componentizada
# - Topbar com breadcrumb e busca
# - Layout principal adequado
# - Cores corporativas (Laranja #F58B51)
# ========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "   Design Corporativo Profissional"
echo "========================================="
echo -e "${NC}"

cd portal-setgen-frontend

# ========================================
# 1. SIDEBAR COMPONENTIZADA
# ========================================

echo -e "${YELLOW}🎨 Criando Sidebar profissional...${NC}"

mkdir -p components/layout

cat > components/layout/sidebar.tsx << 'EOF'
"use client"

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getRoleLabel } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  CheckSquare,
  ShoppingCart,
  DollarSign,
  Truck,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE', 'TECHNICIAN'] },
  { name: 'Clientes', href: '/clients', icon: Users, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
  { name: 'Visitas Técnicas', href: '/visits', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
  { name: 'Ordens de Serviço', href: '/orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },
  { name: 'Aprovações', href: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Ordens de Compra', href: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
  { name: 'Faturamento', href: '/invoices', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
  { name: 'Entregas', href: '/deliveries', icon: Truck, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
  { name: 'Estoque', href: '/inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-gray-800 to-gray-900 min-h-screen flex flex-col transition-all duration-300 shadow-2xl`}>
      {/* Logo e Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Setgen</h1>
              <p className="text-orange-400 text-xs">Portal</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-orange-400'}`} />
              {!collapsed && (
                <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - Perfil do Usuário */}
      {user && (
        <div className="p-4 border-t border-gray-700">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-orange-400 text-xs truncate">{getRoleLabel(user.role)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
EOF

# ========================================
# 2. TOPBAR COM BREADCRUMB E BUSCA
# ========================================

echo -e "${YELLOW}📊 Criando Topbar profissional...${NC}"

cat > components/layout/topbar.tsx << 'EOF'
"use client"

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { Search, Bell, User, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function Topbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    authApi.logout();
    clearAuth();
    router.push('/auth/login');
  };

  // Gerar breadcrumb
  const getBreadcrumb = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbItems = paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1);
      return { label, href };
    });
    return breadcrumbItems;
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 hover:text-orange-600 transition-colors"
          >
            Início
          </button>
          {breadcrumb.map((item, index) => (
            <div key={item.href} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button
                onClick={() => router.push(item.href)}
                className={`${
                  index === breadcrumb.length - 1
                    ? 'text-orange-600 font-medium'
                    : 'text-gray-500 hover:text-orange-600'
                } transition-colors`}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>

        {/* Busca Global e Ações */}
        <div className="flex items-center gap-4">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Notificações */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Menu do Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 pr-3 transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      router.push('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </button>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
EOF

# ========================================
# 3. LAYOUT PRINCIPAL ATUALIZADO
# ========================================

echo -e "${YELLOW}🏗️ Atualizando layout principal...${NC}"

cat > app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal Setgen - Gestão de Serviços",
  description: "Sistema completo de gestão de serviços técnicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
EOF

# ========================================
# 4. LAYOUT INTERNO (COM SIDEBAR + TOPBAR)
# ========================================

echo -e "${YELLOW}📐 Criando layout interno...${NC}"

mkdir -p app/(portal)

cat > app/(portal)/layout.tsx << 'EOF'
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

# Mover páginas para dentro do grupo (portal)
echo -e "${YELLOW}📦 Reorganizando páginas...${NC}"

mkdir -p app/(portal)/{dashboard,clients,visits,orders,approvals,purchase-orders,invoices,deliveries,inventory,profile}

# Mover dashboard
if [ -f "app/dashboard/page.tsx" ]; then
  mv app/dashboard/page.tsx app/(portal)/dashboard/
  rmdir app/dashboard 2>/dev/null || true
fi

# Mover profile
if [ -f "app/profile/page.tsx" ]; then
  mv app/profile/page.tsx app/(portal)/profile/
  rmdir app/profile 2>/dev/null || true
fi

# ========================================
# 5. LOGIN PROFISSIONAL E BONITO
# ========================================

echo -e "${YELLOW}🔐 Criando login profissional...${NC}"

cat > app/auth/login/page.tsx << 'EOF'
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/ui/use-toast';
import { LogIn, Eye, EyeOff, Building2, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha e-mail e senha para continuar",
      });
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({ email, password });
      setAuth(data.user, data.access_token);
      
      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.response?.data?.message || "E-mail ou senha inválidos",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Portal Setgen</h1>
                <p className="text-orange-100 text-sm">Gestão de Serviços</p>
              </div>
            </div>

            <div className="mt-20">
              <h2 className="text-4xl font-bold mb-4">
                Transforme a gestão<br />dos seus serviços
              </h2>
              <p className="text-xl text-orange-100 mb-8">
                Plataforma completa para gerenciar visitas técnicas,<br />
                ordens de serviço e muito mais.
              </p>
              
              <div className="space-y-4">
                {[
                  'Controle total de visitas técnicas',
                  'Gestão completa de ordens de serviço',
                  'Faturamento e entregas integrados',
                  'Relatórios e indicadores em tempo real'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-orange-50">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-orange-100 text-sm">
            © 2024 Portal Setgen. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4">
              <Building2 className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Portal Setgen</h1>
            <p className="text-gray-600">Gestão de Serviços</p>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-gray-600">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="seu@email.com"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoFocus
              />
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => toast({ title: "Em breve", description: "Funcionalidade em desenvolvimento" })}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Lembrar-me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700 cursor-pointer select-none">
                Lembrar-me neste dispositivo
              </label>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar no sistema
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4 text-orange-600" />
              <span>Conexão segura e criptografada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Design corporativo criado!${NC}"

echo -e "${BLUE}"
echo "========================================="
echo "   ✅ Design Profissional Aplicado!"
echo "========================================="
echo -e "${NC}"

echo -e "${YELLOW}🎨 Componentes criados:${NC}"
echo "  ✓ Sidebar componentizada e elegante"
echo "  ✓ Topbar com breadcrumb e busca"
echo "  ✓ Login profissional (2 colunas)"
echo "  ✓ Layout interno organizado"
echo "  ✓ Cores corporativas aplicadas"
echo ""
echo -e "${GREEN}🎉 Agora está BONITO e PROFISSIONAL!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo "  npm run dev"
echo ""

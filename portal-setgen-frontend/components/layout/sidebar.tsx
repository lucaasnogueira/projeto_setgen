"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getRoleLabel, cn } from '@/lib/utils';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  CheckCircle,
  DollarSign,
  Truck,
  Package,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Wallet,
  Shield,
  Tags,
  ClipboardCheck,
  Zap,
  PackageSearch,
  ShoppingCart,
  Building,
  Car,
  Receipt,
  LayoutGrid,
  Layers,
  ChevronDown,
  Building2,
  Home,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { usersApi } from '@/lib/api/users';
import { DASHBOARD_PERMISSIONS } from '@/lib/dashboard-access';

export interface ModuleDefinition {
  id: string;
  name: string;
  badge: string;
  prefixes: string[];
  items: {
    name: string;
    href: string;
    icon: any;
    roles: string[];
    permissions?: string[];
  }[];
}

const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    id: 'commercial',
    name: 'Comercial & Propostas',
    badge: 'COMERCIAL',
    prefixes: ['/quotes', '/clients', '/art', '/purchase-orders'],
    items: [
      { name: 'Orçamentos', href: '/quotes', icon: Receipt, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'], permissions: ['orders:view', 'orders:create'] },
      { name: 'Clientes', href: '/clients', icon: Building2, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'], permissions: ['clients:view'] },
      { name: 'Ordens de Compra (Clientes)', href: '/purchase-orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'], permissions: ['orders:view'] },
    ],
  },
  {
    id: 'orders',
    name: 'Ordens de Serviço & Campo',
    badge: 'O.S. & CAMPO',
    prefixes: ['/orders', '/visits', '/deliveries', '/fleet', '/fuel-requests'],
    items: [
      { name: 'Ordens de Serviço', href: '/orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'], permissions: ['orders:view'] },
      { name: 'Gestão de Visitas', href: '/visits', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'], permissions: ['visits:view'] },
      { name: 'Entregas', href: '/deliveries', icon: Truck, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'], permissions: ['orders:view'] },
      { name: 'Frotas & Veículos', href: '/fleet', icon: Car, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'], permissions: ['fleet:view'] },
    ],
  },
  {
    id: 'inventory',
    name: 'Estoque & Armazém',
    badge: 'ESTOQUE',
    prefixes: ['/inventory', '/warehouse', '/equipment'],
    items: [
      { name: 'Estoque de Peças', href: '/inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'], permissions: ['inventory:view'] },
      { name: 'Mesa do Almoxarife', href: '/warehouse', icon: PackageSearch, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'], permissions: ['material-requests:view'] },
      { name: 'Equipamentos', href: '/equipment', icon: Zap, roles: ['WAREHOUSE', 'ADMIN', 'MANAGER'], permissions: ['equipment:view'] },
    ],
  },
  {
    id: 'procurement',
    name: 'Compras & Suprimentos',
    badge: 'COMPRAS',
    prefixes: ['/procurement', '/suppliers'],
    items: [
      { name: 'Pedidos de Compra (Peças)', href: '/procurement', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE'], permissions: ['procurement:view'] },
      { name: 'Fornecedores', href: '/suppliers', icon: Building, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'], permissions: ['suppliers:view'] },
    ],
  },
  {
    id: 'financial',
    name: 'Financeiro & Faturamento',
    badge: 'FINANCEIRO',
    prefixes: ['/financial', '/invoices', '/approvals'],
    items: [
      { name: 'Despesas & Caixa', href: '/financial', icon: Wallet, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'], permissions: ['expenses:view'] },
      { name: 'Faturamento Fiscal', href: '/invoices', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'], permissions: ['orders:view'] },
      { name: 'Aprovações', href: '/approvals', icon: CheckCircle, roles: ['ADMIN', 'MANAGER'], permissions: ['orders:approve', 'expenses:approve'] },
    ],
  },
  {
    id: 'rh',
    name: 'Recursos Humanos',
    badge: 'RH',
    prefixes: ['/rh'],
    items: [
      { name: 'Funcionários', href: '/rh/employees', icon: Users, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'], permissions: ['rh:view'] },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard & Análises',
    badge: 'DASHBOARD',
    prefixes: ['/dashboard', '/reports'],
    items: [
      { name: 'Painel Geral', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE', 'TECHNICIAN'], permissions: DASHBOARD_PERMISSIONS },
      { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    id: 'settings',
    name: 'Configurações',
    badge: 'SISTEMA',
    prefixes: ['/users', '/roles', '/settings', '/config-permissoes'],
    items: [
      { name: 'Usuários', href: '/users', icon: UserCog, roles: ['ADMIN'], permissions: ['users:view'] },
      { name: 'Cargos e Permissões', href: '/roles', icon: Shield, roles: ['ADMIN'], permissions: ['roles:view'] },
      { name: 'Módulos e Acessos', href: '/settings/modules', icon: Layers, roles: ['ADMIN'], permissions: ['roles:view'] },
      { name: 'Equipes e Grupos', href: '/settings/client-lookups', icon: Tags, roles: ['ADMIN', 'MANAGER'] },
      { name: 'Templates de Checklist', href: '/settings/checklist-templates', icon: ClipboardCheck, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, updateUser } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showModuleSwitcher, setShowModuleSwitcher] = useState(false);

  useEffect(() => {
    usersApi.getMe().then((fresh) => {
      updateUser({
        role: fresh.role as unknown as UserRole,
        roleId: fresh.roleId,
        permissions: fresh.permissions,
      });
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  // Identifica dinamicamente o módulo atual a partir do pathname
  const currentModule = useMemo(() => {
    const found = SYSTEM_MODULES.find((mod) =>
      mod.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
    );
    return found || SYSTEM_MODULES[0]; // Fallback para Comercial
  }, [pathname]);

  // Filtra itens apenas pertinentes ao módulo ativo e com permissão
  const visibleItems = useMemo(() => {
    return currentModule.items.filter((item) => {
      if (isAdmin) return true;
      if (item.permissions?.length) {
        return item.permissions.some((p) => user?.permissions?.includes(p));
      }
      return !!user?.role && item.roles.includes(user.role);
    });
  }, [currentModule, isAdmin, user]);

  return (
    <div
      className={cn(
        'flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden bg-sidebar text-sidebar-fg transition-[width] duration-200 ease-out z-30',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Header com Logo Setgen (clica para ir à Home de Módulos) */}
      <div className="flex items-center justify-between gap-3 px-4.5 py-4 border-b border-sidebar-border whitespace-nowrap">
        <button
          onClick={() => router.push('/modules')}
          className="flex items-center gap-2.5 min-w-0 text-left group transition-opacity hover:opacity-90"
          title="Ir para o Hub de Módulos"
        >
          <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-orange-950/30">
            <span className="font-black text-white text-xs">S</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-extrabold text-[14px] tracking-wide text-white block leading-tight">
                SETGEN
              </span>
              <span className="text-[10px] text-sidebar-fg-dim font-medium tracking-tight group-hover:text-primary transition-colors">
                Módulos do Sistema
              </span>
            </div>
          )}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-[26px] h-[26px] rounded-[7px] bg-sidebar-hover text-sidebar-fg-muted flex items-center justify-center shrink-0 hover:text-white transition-colors"
          title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Botão de Atalho "Início / Todos os Módulos" */}
      <div className="px-3 pt-3">
        <button
          onClick={() => router.push('/modules')}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-[9px] text-[12px] font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors border border-sidebar-border/40",
            collapsed && "justify-center px-0"
          )}
          title="Ir para a seleção de módulos"
        >
          <Home className="w-4 h-4 text-[#E2661D] shrink-0" />
          {!collapsed && <span>Início / Módulos</span>}
        </button>
      </div>

      {/* Identificação Dinâmica do Módulo Atual */}
      {!collapsed && (
        <div className="px-3 pt-2.5 pb-2 border-b border-sidebar-border/60">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-sidebar-hover/60 border border-sidebar-border/40">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E2661D]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2661D]">
                  {currentModule.badge}
                </span>
              </div>
              <h3 className="text-[12px] font-bold text-white truncate mt-0.5">
                {currentModule.name}
              </h3>
            </div>
            <button
              onClick={() => setShowModuleSwitcher(!showModuleSwitcher)}
              className="text-sidebar-fg-dim hover:text-white p-1 rounded transition-colors"
              title="Trocar de Módulo"
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showModuleSwitcher && "rotate-180")} />
            </button>
          </div>

          {/* Switcher Rápido de Módulo (Dropdown) */}
          {showModuleSwitcher && (
            <div className="mt-2 p-1.5 bg-[#0C111D] border border-sidebar-border rounded-lg shadow-xl space-y-1">
              <div className="text-[10px] font-semibold text-sidebar-fg-dim px-2 py-1">
                Trocar de Ambiente:
              </div>
              {SYSTEM_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => {
                    setShowModuleSwitcher(false);
                    router.push(mod.prefixes[0]);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-[11px] font-medium transition-colors flex items-center justify-between",
                    mod.id === currentModule.id
                      ? "bg-primary text-white font-bold"
                      : "text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <span className="truncate">{mod.name}</span>
                  <span className="text-[9px] opacity-70 ml-1">{mod.badge}</span>
                </button>
              ))}
              <div className="pt-1 border-t border-sidebar-border/40">
                <button
                  onClick={() => {
                    setShowModuleSwitcher(false);
                    router.push('/modules');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-[11px] font-semibold text-[#E2661D] hover:bg-sidebar-hover flex items-center gap-1.5"
                >
                  <LayoutGrid className="w-3 h-3" /> Ver Todos os Módulos
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navegação Dinâmica: Apenas itens pertinentes ao módulo ativo */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 whitespace-nowrap scrollbar-thin-sidebar">
        <div className="space-y-0.5">
          {visibleItems.length === 0 ? (
            <div className="p-4 text-center text-sidebar-fg-dim text-xs">
              Nenhuma ação permitida neste módulo.
            </div>
          ) : (
            visibleItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-[13px] font-medium transition-colors mb-0.5',
                    isActive
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-white'
                  )}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </button>
              );
            })
          )}
        </div>
      </nav>

      {/* Perfil do Usuário e Logout */}
      <div className="border-t border-sidebar-border p-3 whitespace-nowrap">
        {user && (
          <div className="flex items-center gap-2.5 p-1.5 rounded-[9px] mb-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-[12px] flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <div className="text-white text-[12px] font-bold truncate leading-tight">{user.name}</div>
                <div className="text-sidebar-fg-dim text-[10.5px] truncate">{getRoleLabel(user.role)}</div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[9px] text-sidebar-fg-muted text-[12px] font-semibold hover:bg-sidebar-hover hover:text-white transition-colors"
          title={collapsed ? 'Sair' : ''}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}


"use client"

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getRoleLabel, cn } from '@/lib/utils';
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
  Building2,
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
  ChevronDown,
  Car,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE', 'TECHNICIAN'] },

  { name: 'Clientes', href: '/clients', icon: Building2, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'], section: 'COMERCIAL' },
  { name: 'Equipamentos', href: '/equipment', icon: Zap, roles: ['WAREHOUSE'] },
  { name: 'Gestão de Visitas', href: '/visits', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },

  { name: 'Ordem de Serviço', href: '/orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'], section: 'OPERAÇÕES' },
  { name: 'Aprovações', href: '/approvals', icon: CheckCircle, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Entregas', href: '/deliveries', icon: Truck, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },

  { name: 'Estoque', href: '/inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'], section: 'ESTOQUE' },
  { name: 'Mesa do Almoxarife', href: '/warehouse', icon: PackageSearch, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Compras', href: '/procurement', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
  { name: 'Fornecedores', href: '/suppliers', icon: Building, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
  { name: 'Frota', href: '/fleet', icon: Car, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },

  { name: 'Despesas', href: '/financial', icon: Wallet, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'], section: 'FINANCEIRO' },
  { name: 'Faturamento', href: '/invoices', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },

  { name: 'Funcionários', href: '/rh/employees', icon: Users, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'], section: 'RH' },

  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'], section: 'ANÁLISE' },

  { name: 'Usuários', href: '/users', icon: UserCog, roles: ['ADMIN'], section: 'CONFIGURAÇÕES' },
  { name: 'Cargos e Permissões', href: '/roles', icon: Shield, roles: ['ADMIN'] },
  { name: 'Equipes e Grupos', href: '/settings/client-lookups', icon: Tags, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Templates de Checklist', href: '/settings/checklist-templates', icon: ClipboardCheck, roles: ['ADMIN', 'MANAGER'] },
];

type NavItem = (typeof navigation)[number];
type NavGroup = { section: string | null; items: NavItem[] };

function groupNavigation(items: NavItem[]): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const item of items) {
    if (item.section || groups.length === 0) {
      groups.push({ section: item.section ?? null, items: [item] });
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }
  return groups;
}

const allSections = new Set(
  navigation.map((item) => item.section).filter((s): s is string => !!s)
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set(allSections));

  const toggleSection = (section: string) => {
    setClosedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const filteredNavigation = navigation.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const navGroups = groupNavigation(filteredNavigation);

  return (
    <div
      className={cn(
        'flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden bg-sidebar text-sidebar-fg transition-[width] duration-200 ease-out',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4.5 py-5 border-b border-sidebar-border whitespace-nowrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-[9px] bg-primary flex items-center justify-center shrink-0">
            <Building2 className="h-[18px] w-[18px] text-white" />
          </div>
          {!collapsed && (
            <span className="font-extrabold text-[15px] tracking-wide truncate">SETGEN</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-[26px] h-[26px] rounded-[7px] bg-sidebar-hover text-sidebar-fg-muted flex items-center justify-center shrink-0 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 whitespace-nowrap scrollbar-thin-sidebar">
        {navGroups.map((group, groupIdx) => {
          const isSectionClosed = !!group.section && !collapsed && closedSections.has(group.section);
          return (
            <div key={group.section ?? `top-${groupIdx}`}>
              {group.section && !collapsed && (
                <button
                  onClick={() => toggleSection(group.section as string)}
                  className="w-full flex items-center justify-between px-3 pt-3.5 pb-2 text-[10.5px] font-bold tracking-wider text-sidebar-fg-dim hover:text-sidebar-fg-muted transition-colors"
                >
                  <span>{group.section}</span>
                  <ChevronDown
                    className={cn('h-3 w-3 transition-transform', isSectionClosed && '-rotate-90')}
                  />
                </button>
              )}
              {group.section && collapsed && <div className="h-2" />}
              {!isSectionClosed &&
                group.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-[13.5px] font-medium transition-colors mb-0.5',
                        isActive
                          ? 'bg-primary text-white font-bold'
                          : 'text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-white'
                      )}
                      title={collapsed ? item.name : ''}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3.5 whitespace-nowrap">
        {user && (
          <div className="flex items-center gap-2.5 p-2 rounded-[9px] mb-1.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-[12.5px] flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <div className="text-white text-[12.5px] font-bold truncate">{user.name}</div>
                <div className="text-sidebar-fg-dim text-[11px] truncate">{getRoleLabel(user.role)}</div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[9px] text-sidebar-fg-muted text-[12.5px] font-semibold hover:bg-sidebar-hover hover:text-white transition-colors"
          title={collapsed ? 'Sair' : ''}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}

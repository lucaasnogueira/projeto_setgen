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
  Wallet,
  ChevronDown,
  ChevronUp,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'WAREHOUSE', 'TECHNICIAN'] },
  { 
    name: 'Serviços', 
    id: 'services',
    icon: ClipboardList, 
    roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'],
    children: [
      { name: 'Clientes', href: '/clients', icon: Building2, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },
      { name: 'Visitas Técnicas', href: '/visits', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
      { name: 'Ordens de Serviço', href: '/orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },
      { name: 'Aprovações', href: '/approvals', icon: CheckCircle, roles: ['ADMIN', 'MANAGER'] },
      { name: 'Entregas', href: '/deliveries', icon: Truck, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE', 'TECHNICIAN'] },
    ]
  },
  {
    name: 'Administrativo',
    id: 'admin',
    icon: Settings,
    roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'],
    children: [
      { name: 'Ordens de Compra', href: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
      { name: 'Faturamento', href: '/invoices', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
      { name: 'Financeiro', href: '/financial', icon: Wallet, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
      { name: 'Cargos e Permissões', href: '/roles', icon: Shield, roles: ['ADMIN'] },
      { name: 'Funcionários', href: '/rh/employees', icon: Users, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE'] },
    ]
  },
  { name: 'Estoque', href: '/inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'WAREHOUSE'] },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Usuários', href: '/users', icon: UserCog, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const toggleSection = (id: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenSections({ [id]: true });
    } else {
      setOpenSections(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }
  };

  const filteredNavigation = navigation.map(item => {
    if (item.children) {
      const filteredChildren = item.children.filter(child => 
        user?.role && child.roles.includes(user.role)
      );
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren };
    }
    return user?.role && item.roles.includes(user.role) ? item : null;
  }).filter(Boolean);

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
        {filteredNavigation.map((item: any) => {
          if (item.children) {
            const isAnyChildActive = item.children.some((child: any) => 
              pathname === child.href || pathname?.startsWith(child.href + '/')
            );
            const isOpen = openSections[item.id];

            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggleSection(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all ${
                    isAnyChildActive && !isOpen
                      ? 'bg-gray-700/50 text-orange-400'
                      : 'hover:bg-gray-700'
                  }`}
                  title={collapsed ? item.name : ''}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                  </div>
                  {!collapsed && (
                    isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {isOpen && !collapsed && (
                  <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.children.map((child: any) => {
                      const isChildActive = pathname === child.href || pathname?.startsWith(child.href + '/');
                      return (
                        <button
                          key={child.name}
                          onClick={() => router.push(child.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            isChildActive
                              ? 'bg-orange-500/20 text-orange-500 font-semibold'
                              : 'hover:bg-gray-700/50 text-gray-300'
                          }`}
                        >
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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

"use client"

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { Search, Bell, User, Settings, LogOut, ChevronRight } from 'lucide-react';
import { CommandMenu } from './CommandMenu';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clientes',
  equipment: 'Equipamentos',
  visits: 'Gestão de Visitas',
  agenda: 'Agenda',
  orders: 'Ordem de Serviço',
  approvals: 'Aprovações',
  deliveries: 'Entregas',
  inventory: 'Estoque',
  warehouse: 'Mesa do Almoxarife',
  procurement: 'Compras',
  suppliers: 'Fornecedores',
  financial: 'Despesas',
  expenses: 'Despesas',
  invoices: 'Faturamento',
  'purchase-orders': 'Pedidos de Compra',
  rh: 'RH',
  employees: 'Funcionários',
  reports: 'Relatórios',
  users: 'Usuários',
  roles: 'Cargos e Permissões',
  settings: 'Configurações',
  'client-lookups': 'Equipes e Grupos',
  'checklist-templates': 'Templates de Checklist',
  profile: 'Meu Perfil',
  new: 'Novo',
  edit: 'Editar',
};

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
      const isDynamicSegment = paths[index - 1] !== undefined && /^[0-9a-f-]{8,}$|^\d+$/i.test(path);
      const label = isDynamicSegment
        ? 'Detalhes'
        : BREADCRUMB_LABELS[path] ?? path.charAt(0).toUpperCase() + path.slice(1);
      return { label, href };
    });
    return breadcrumbItems;
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-20 h-16 shrink-0">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13.5px]">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-text-muted font-semibold hover:text-foreground transition-colors"
          >
            Início
          </button>
          {breadcrumb.map((item, index) => (
            <div key={item.href} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-border" />
              <button
                onClick={() => router.push(item.href)}
                className={
                  index === breadcrumb.length - 1
                    ? 'text-foreground font-bold'
                    : 'text-text-muted font-semibold hover:text-foreground transition-colors'
                }
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>

        {/* Busca Global e Ações */}
        <div className="flex items-center gap-3.5">
          <CommandMenu />

          <NotificationCenter />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Menu do Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 border border-border rounded-[9px] py-[5px] pl-[5px] pr-2.5 hover:bg-muted/40 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[11.5px]">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-semibold text-foreground hidden md:block">{user?.name}</span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-card rounded-xl shadow-[0_12px_32px_rgba(20,30,40,0.14)] border border-border py-1.5 z-50">
                  <button
                    onClick={() => {
                      router.push('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-foreground hover:bg-muted/40 rounded-lg transition-colors"
                  >
                    <User className="h-[15px] w-[15px]" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => {
                      router.push('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-foreground hover:bg-muted/40 rounded-lg transition-colors"
                  >
                    <Settings className="h-[15px] w-[15px]" />
                    Configurações
                  </button>
                  <hr className="my-1.5 border-border mx-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-destructive hover:bg-status-red-bg rounded-lg transition-colors"
                  >
                    <LogOut className="h-[15px] w-[15px]" />
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

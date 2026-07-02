"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { dashboardApi, DashboardStats } from '@/lib/api/dashboard';
import {
  Clock,
  FileText,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Users,
  ArrowRight,
} from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OSStatusChart } from '@/components/dashboard/OSStatusChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
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

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-[14px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[380px] lg:col-span-2 rounded-[14px]" />
          <Skeleton className="h-[380px] rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const canSeeFinancials = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canSeeBillingAlerts = canSeeFinancials || user?.role === 'ADMINISTRATIVE';
  const canCreateClient = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ADMINISTRATIVE';
  const canCreateVisit = user?.role !== 'WAREHOUSE';

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Dashboard"
        subtitle={<span className="capitalize">{dateStr}</span>}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aprovações Pendentes" value={stats.pendingApprovals} icon={Clock} tone="amber" />
        <StatCard label="OS Ativas" value={stats.activeOrders} icon={FileText} tone="blue" />
        <StatCard label="Concluídas Este Mês" value={stats.completedThisMonth} icon={CheckCircle} tone="green" />
        {canSeeFinancials && (
          <StatCard
            label="Faturamento Acumulado"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
            icon={DollarSign}
            tone="green"
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart data={stats.monthlyRevenue} />
        <OSStatusChart data={stats.ordersByStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activities */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-[14.5px] font-bold text-foreground">Atividades Recentes</h3>
            <button className="text-[12.5px] font-bold text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {stats.recentActivities.length === 0 ? (
              <div className="p-10 text-center text-text-muted text-sm">Nenhuma atividade registrada</div>
            ) : (
              stats.recentActivities.slice(0, 5).map((activity) => {
                const isOrder = activity.type === 'ORDER_APPROVED';
                return (
                  <div key={activity.id} className="flex items-center gap-3.5 px-5 py-4">
                    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                      isOrder ? 'bg-status-blue-bg text-status-blue-fg' : 'bg-status-purple-bg text-status-purple-fg'
                    }`}>
                      {isOrder ? <FileText className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{activity.description}</p>
                      <p className="text-[12px] text-text-muted">{new Date(activity.timestamp).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-5">
          <h3 className="text-[14.5px] font-bold text-foreground mb-3.5">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <QuickActionButton label="Novo Cliente" icon={Users} tone="amber" href="/clients/new" visible={canCreateClient} router={router} />
            <QuickActionButton label="Nova Visita" icon={FileText} tone="purple" href="/visits/new" visible={canCreateVisit} router={router} />
            <QuickActionButton label="Nova OS" icon={FileText} tone="blue" href="/orders/new" visible router={router} />
            <QuickActionButton label="Nova Fatura" icon={DollarSign} tone="green" href="/invoices/new" visible={canSeeFinancials} router={router} />
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      {(stats.lowStockItems > 0 || stats.overdueInvoices > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.lowStockItems > 0 && (
            <AlertCard label="Itens com Estoque Baixo" count={stats.lowStockItems} desc="Reposição necessária" tone="amber" />
          )}
          {stats.overdueInvoices > 0 && canSeeBillingAlerts && (
            <AlertCard label="Faturas Vencidas" count={stats.overdueInvoices} desc="Cobrança pendente" tone="red" />
          )}
        </div>
      )}
    </div>
  );
}

const TONES = {
  amber: { box: 'bg-status-amber-bg text-status-amber-fg' },
  blue: { box: 'bg-status-blue-bg text-status-blue-fg' },
  green: { box: 'bg-status-green-bg text-status-green-fg' },
  purple: { box: 'bg-status-purple-bg text-status-purple-fg' },
  red: { box: 'bg-status-red-bg text-status-red-fg' },
};

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: any; tone: keyof typeof TONES }) {
  return (
    <Card className="p-5">
      <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-3.5 ${TONES[tone].box}`}>
        <Icon className="h-[19px] w-[19px]" />
      </div>
      <div className="text-[26px] font-extrabold text-foreground leading-none">{value}</div>
      <div className="text-[12.5px] font-semibold text-text-muted mt-1.5">{label}</div>
    </Card>
  );
}

function AlertCard({ label, count, desc, tone }: { label: string; count: number; desc: string; tone: keyof typeof TONES }) {
  return (
    <Card className={`p-5 flex items-center justify-between ${tone === 'red' ? 'border-status-red-fg/20' : 'border-status-amber-fg/20'}`}>
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center font-extrabold text-lg ${TONES[tone].box}`}>
          {count}
        </div>
        <div>
          <p className="font-bold text-foreground text-sm leading-none mb-1">{label}</p>
          <p className="text-xs text-text-muted font-semibold">{desc}</p>
        </div>
      </div>
      <AlertTriangle className={`h-5 w-5 ${tone === 'red' ? 'text-status-red-fg' : 'text-status-amber-fg'}`} />
    </Card>
  );
}

function QuickActionButton({ label, icon: Icon, tone, href, visible, router }: { label: string; icon: any; tone: keyof typeof TONES; href: string; visible: boolean; router: ReturnType<typeof useRouter> }) {
  if (!visible) return null;
  return (
    <button
      onClick={() => router.push(href)}
      className="text-left p-3.5 border border-border rounded-[11px] bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-colors"
    >
      <div className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center mb-2.5 ${TONES[tone].box}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-[12.5px] font-bold text-foreground">{label}</div>
    </button>
  );
}

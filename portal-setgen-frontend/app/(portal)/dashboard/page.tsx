"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { dashboardApi, DashboardStats, OperationalKpis } from "@/lib/api/dashboard";
import {
  Clock,
  FileText,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Users,
  ArrowRight,
  PackageSearch,
  Percent,
  Truck,
  RotateCcw,
  Building2,
  LayoutGrid,
  Wrench,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Receipt,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OSStatusChart } from "@/components/dashboard/OSStatusChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { canSeeDashboard } from "@/lib/dashboard-access";
import { canViewFinancialValues } from "@/lib/permissions";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpis, setKpis] = useState<OperationalKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const showKpis = canSeeDashboard(user?.role, user?.permissions);

  useEffect(() => {
    if (!showKpis) {
      setLoading(false);
      return;
    }
    loadStats();
  }, [showKpis]);

  const loadStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsData, kpisData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getOperationalKpis(),
      ]);
      setStats(statsData);
      setKpis(kpisData);
      if (isManualRefresh) toast.success("Painel atualizado");
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      if (isManualRefresh) toast.error("Falha ao atualizar painel");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Saudação de acordo com o horário local
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const dateStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!showKpis) {
    const firstName = user?.name?.split(" ")[0];

    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-lg w-full p-6 text-center space-y-3.5 border-gray-200/80 shadow-2xs rounded-xl bg-white">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto text-[#E2661D]">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">
              Bem-vindo(a) ao Portal Setgen
            </h1>
            <p className="text-[13.5px] text-muted-foreground">
              {firstName ? `Olá, ${firstName}. ` : ""}
              Use o menu ao lado para acessar os módulos liberados para o seu perfil.
            </p>
          </div>
          <p className="text-xs text-muted-foreground capitalize pt-2 border-t border-border">
            {dateStr}
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[340px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const canSeeFinancials = canViewFinancialValues(user?.role);
  const canSeeBillingAlerts = canSeeFinancials || user?.role === "ADMINISTRATIVE";
  const canCreateClient =
    user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "ADMINISTRATIVE";
  const canCreateVisit = user?.role !== "WAREHOUSE";
  const firstName = user?.name?.split(" ")[0] || "Usuário";

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header com Saudação & Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {getGreeting()}, {firstName}!
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-primary/10 text-primary border border-primary/20">
              {user?.role === "ADMIN" ? "Administrador" : user?.role || "Membro"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
            <span>{dateStr}</span>
            <span>•</span>
            <span>Visão operacional consolidada</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs border-border"
            title="Atualizar dados do painel"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={() => router.push("/modules")}
            size="sm"
            className="h-9 rounded-lg font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Hub de Módulos</span>
          </Button>
        </div>
      </div>

      {/* ALERTAS CRÍTICOS (Se houver pendências graves) */}
      {(stats.lowStockItems > 0 || (stats.overdueInvoices > 0 && canSeeBillingAlerts)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {stats.lowStockItems > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/50 flex items-center justify-between text-amber-950 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                  {stats.lowStockItems}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Itens com Estoque Baixo</p>
                  <p className="text-[11px] text-amber-800">Produtos no ponto ou abaixo do estoque mínimo</p>
                </div>
              </div>
              <Link
                href="/inventory"
                className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors inline-flex items-center gap-1 shrink-0"
              >
                Ver Estoque
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {stats.overdueInvoices > 0 && canSeeBillingAlerts && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/50 flex items-center justify-between text-rose-950 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-200/80 text-rose-900 flex items-center justify-center font-bold text-sm shrink-0">
                  {stats.overdueInvoices}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Notas Fiscais com Pendência</p>
                  <p className="text-[11px] text-rose-800">Notas rejeitadas que necessitam de correção</p>
                </div>
              </div>
              <Link
                href="/invoices"
                className="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-200/80 hover:bg-rose-300 text-rose-900 transition-colors inline-flex items-center gap-1 shrink-0"
              >
                Corrigir Notas
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* CARDS DE KPIS PRINCIPAIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
        {/* KPI 1: Aprovações Pendentes */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-border border-l-4 border-l-amber-500 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Aprovações Pendentes
            </span>
            <div className="p-1 rounded-md bg-amber-100 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {stats.pendingApprovals}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            Orçamentos aguardando validação
          </p>
        </Card>

        {/* KPI 2: OS Ativas */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-border border-l-4 border-l-blue-500 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              OS em Andamento
            </span>
            <div className="p-1 rounded-md bg-blue-100 text-blue-700">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {stats.activeOrders}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            Ordens em execução ou separação
          </p>
        </Card>

        {/* KPI 3: Concluídas no Mês */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-border border-l-4 border-l-emerald-500 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Concluídas Este Mês
            </span>
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {stats.completedThisMonth}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            Serviços entregues e finalizados
          </p>
        </Card>

        {/* KPI 4: Faturamento Acumulado */}
        {canSeeFinancials ? (
          <Card className="p-3.5 sm:p-4 rounded-xl border border-border border-l-4 border-l-green-600 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Faturamento Total
              </span>
              <div className="p-1 rounded-md bg-green-100 text-green-700">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <div
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate"
              title={new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.totalRevenue)}
            >
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(stats.totalRevenue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Notas fiscais autorizadas</p>
          </Card>
        ) : (
          <Card className="p-3.5 sm:p-4 rounded-xl border border-border border-l-4 border-l-primary shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Operação Geral
              </span>
              <div className="p-1 rounded-md bg-orange-100 text-primary">
                <CalendarCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {stats.activeOrders + stats.completedThisMonth}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Volume de ordens no período</p>
          </Card>
        )}
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart data={stats.monthlyRevenue} />
        <OSStatusChart data={stats.ordersByStatus} />
      </div>

      {/* KPIS OPERACIONAIS & EFICIÊNCIA BPM */}
      {kpis && (canSeeFinancials || user?.role === "ADMINISTRATIVE" || user?.role === "WAREHOUSE") && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Métricas de Eficiência Operacional & Logística (BPM)
            </h2>
            <Link
              href="/reports"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Ver Relatórios Detalhados
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
            <Card className="p-3 sm:p-3.5 rounded-xl border border-border shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                <div className="p-1 rounded-md bg-purple-100 text-purple-700">
                  <PackageSearch className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground">SLA de Separação</span>
              </div>
              <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {kpis.materialSeparationSla.sampleSize > 0
                  ? `${kpis.materialSeparationSla.averageHours}h`
                  : "-"}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Tempo médio do almoxarifado
              </p>
            </Card>

            <Card className="p-3 sm:p-3.5 rounded-xl border border-border shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <Percent className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Aprovação de Orçamentos</span>
              </div>
              <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {kpis.quoteApprovalRate.rate}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {kpis.quoteApprovalRate.approved} de {kpis.quoteApprovalRate.sentNotExpired} orçamentos
              </p>
            </Card>

            <Card className="p-3 sm:p-3.5 rounded-xl border border-border shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                <div className="p-1 rounded-md bg-amber-100 text-amber-700">
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Lead Time Fornecedor</span>
              </div>
              <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {kpis.supplierLeadTime.length > 0
                  ? `${(
                      kpis.supplierLeadTime.reduce((a, s) => a + s.averageDays, 0) /
                      kpis.supplierLeadTime.length
                    ).toFixed(1)}d`
                  : "-"}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Prazo médio de entrega de peças
              </p>
            </Card>

            <Card className="p-3 sm:p-3.5 rounded-xl border border-border shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                <div
                  className={`p-1 rounded-md ${
                    kpis.reworkRate.rate > 10
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Taxa de Retrabalho</span>
              </div>
              <div
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  kpis.reworkRate.rate > 10 ? "text-rose-600" : "text-foreground"
                }`}
              >
                {kpis.reworkRate.rate}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {kpis.reworkRate.rate <= 10 ? "Dentro da meta" : "Acima da meta"}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ATIVIDADES RECENTES E AÇÕES RÁPIDAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Atividades Recentes */}
        <Card className="overflow-hidden border-border shadow-xs">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-muted/20">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
              Atividades Recentes
            </h3>
            <Link
              href="/orders"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {stats.recentActivities.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-xs">
                Nenhuma atividade recente registrada
              </div>
            ) : (
              stats.recentActivities.slice(0, 5).map((activity) => {
                const isOrder = activity.type === "ORDER_APPROVED";
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3.5 px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isOrder
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {isOrder ? <FileText className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Ações Rápidas */}
        <Card className="p-5 border-border shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">
              Ações Rápidas & Cadastros
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {canCreateClient && (
                <QuickActionButton
                  label="Novo Cliente"
                  desc="Cadastrar pessoa física ou jurídica"
                  icon={Users}
                  colorClass="bg-amber-100 text-amber-800"
                  href="/clients/new"
                  router={router}
                />
              )}
              {canCreateVisit && (
                <QuickActionButton
                  label="Nova Visita"
                  desc="Agendar vistoria técnica"
                  icon={CalendarCheck}
                  colorClass="bg-purple-100 text-purple-800"
                  href="/visits/new"
                  router={router}
                />
              )}
              <QuickActionButton
                label="Novo Orçamento"
                desc="Gerar proposta comercial"
                icon={FileText}
                colorClass="bg-blue-100 text-blue-800"
                href="/quotes/new"
                router={router}
              />
              {canSeeFinancials && (
                <QuickActionButton
                  label="Nova Fatura / NF-e"
                  desc="Emitir cobrança ou nota"
                  icon={Receipt}
                  colorClass="bg-emerald-100 text-emerald-800"
                  href="/invoices/new"
                  router={router}
                />
              )}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Precisa de relatórios operacionais completos?</span>
            <Link
              href="/reports"
              className="font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              Acessar Relatórios
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  desc,
  icon: Icon,
  colorClass,
  href,
  router,
}: {
  label: string;
  desc: string;
  icon: any;
  colorClass: string;
  href: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      onClick={() => router.push(href)}
      className="text-left p-3 border border-border/80 rounded-xl bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-all group flex flex-col justify-between"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorClass} group-hover:scale-105 transition-transform`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
          {desc}
        </div>
      </div>
    </button>
  );
}

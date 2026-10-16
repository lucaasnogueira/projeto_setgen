"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { reportsApi, ReportOverview } from "@/lib/api/reports";
import { clientsApi } from "@/lib/api/clients";
import {
  Download,
  Filter,
  Printer,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  Percent,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/pagination";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type PresetFilter = "ALL" | "7D" | "30D" | "THIS_MONTH" | "90D" | "THIS_YEAR";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [activePreset, setActivePreset] = useState<PresetFilter>("ALL");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    clientId: "",
  });

  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [visitsByMonth, setVisitsByMonth] = useState<any>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<any>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any>(null);
  const [technicianPerformance, setTechnicianPerformance] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadCharts();
  }, [filters.startDate, filters.endDate, filters.clientId]);

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  };

  const loadCharts = async () => {
    setLoading(true);
    try {
      const [overviewData, visits, orders, revenue, performance] = await Promise.all([
        reportsApi.getOverview(filters),
        reportsApi.getVisitsByMonth(filters),
        reportsApi.getOrdersByStatus(filters),
        reportsApi.getMonthlyRevenue(filters),
        reportsApi.getTechnicianPerformance(filters),
      ]);

      setOverview(overviewData);
      setVisitsByMonth(visits);
      setOrdersByStatus(orders);
      setMonthlyRevenue(revenue);
      setTechnicianPerformance(performance);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast.error("Erro ao atualizar dados do relatório");
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: PresetFilter) => {
    setActivePreset(preset);
    const now = new Date();
    const end = now.toISOString().split("T")[0];

    if (preset === "ALL") {
      setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
      return;
    }

    let start = "";
    if (preset === "7D") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
    } else if (preset === "30D") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split("T")[0];
    } else if (preset === "THIS_MONTH") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      start = d.toISOString().split("T")[0];
    } else if (preset === "90D") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      start = d.toISOString().split("T")[0];
    } else if (preset === "THIS_YEAR") {
      const d = new Date(now.getFullYear(), 0, 1);
      start = d.toISOString().split("T")[0];
    }

    setFilters((prev) => ({ ...prev, startDate: start, endDate: end }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    try {
      const rows = [
        ["RELATÓRIO OPERACIONAL - SETGEN & SERVIÇOS"],
        ["Gerado em", new Date().toLocaleString("pt-BR")],
        ["Filtro Cliente", filters.clientId ? (clients.find((c) => c.id === filters.clientId)?.tradeName || "Selecionado") : "Todos"],
        ["Período", `${filters.startDate || "Início"} até ${filters.endDate || "Hoje"}`],
        [],
        ["INDICADORES PRINCIPAIS (KPIs)"],
        ["Total de Visitas Técnicas", overview?.kpis.totalVisits ?? 0],
        ["Total de Ordens de Serviço", overview?.kpis.totalOrders ?? 0],
        ["OS Concluídas", overview?.kpis.completedOrders ?? 0],
        ["OS em Andamento", overview?.kpis.inProgressOrders ?? 0],
        ["OS Aguardando Materiais", overview?.kpis.awaitingOrders ?? 0],
        ["Taxa de Eficiência / Conclusão (%)", `${overview?.kpis.completionRate ?? 0}%`],
        ["Faturamento Faturado (R$)", overview?.kpis.totalRevenue ?? 0],
        [],
        ["ÚLTIMAS ORDENS DE SERVIÇO"],
        ["Número OS", "Status", "Cliente", "Equipamento", "Escopo", "Data Abertura"],
      ];

      (overview?.recentOrders || []).forEach((o) => {
        rows.push([
          o.orderNumber || "-",
          o.status || "-",
          o.client?.tradeName || o.client?.companyName || "-",
          o.equipment?.model || "-",
          `"${(o.scope || "").replace(/"/g, '""')}"`,
          new Date(o.createdAt).toLocaleDateString("pt-BR"),
        ]);
      });

      const csvContent = "\uFEFF" + rows.map((e) => e.join(";")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio-operacional-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Relatório CSV exportado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao exportar CSV");
    }
  };

  // Formatação em Reais
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Status mapping
  const formatStatus = (st: string) => {
    const map: Record<string, { label: string; color: string }> = {
      COMPLETED: { label: "Concluída", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
      IN_PROGRESS: { label: "Em Andamento", color: "bg-blue-100 text-blue-800 border-blue-300" },
      AWAITING_MATERIALS: { label: "Aguardando Materiais", color: "bg-amber-100 text-amber-800 border-amber-300" },
      PENDING_APPROVAL: { label: "Aguardando Aprovação", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      APPROVED: { label: "Aprovada", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
      DRAFT: { label: "Rascunho", color: "bg-slate-100 text-slate-800 border-slate-300" },
      REJECTED: { label: "Rejeitada", color: "bg-rose-100 text-rose-800 border-rose-300" },
      CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-800 border-gray-300" },
    };
    return map[st] || { label: st, color: "bg-gray-100 text-gray-700 border-gray-300" };
  };

  // Configuração comum dos gráficos (com inteiros no eixo Y)
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 12, weight: 600 as any } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw} visitas`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
          font: { size: 11 },
          color: "#64748b",
        },
        grid: {
          color: "rgba(226, 232, 240, 0.7)",
        },
      },
      x: {
        ticks: { font: { size: 11 }, color: "#64748b" },
        grid: { display: false },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11, weight: 500 as any },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} OS`,
        },
      },
    },
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 12, weight: 600 as any } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${formatBRL(ctx.raw)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatBRL(value),
          font: { size: 11 },
          color: "#64748b",
        },
        grid: {
          color: "rgba(226, 232, 240, 0.7)",
        },
      },
      x: {
        ticks: { font: { size: 11 }, color: "#64748b" },
        grid: { display: false },
      },
    },
  };

  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 12, weight: 600 as any } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw} OS`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
          font: { size: 11 },
          color: "#64748b",
        },
        grid: {
          color: "rgba(226, 232, 240, 0.7)",
        },
      },
      x: {
        ticks: { font: { size: 11 }, color: "#64748b" },
        grid: { display: false },
      },
    },
  };

  const totalDoughnutCount = (ordersByStatus?.datasets?.[0]?.data || []).reduce(
    (acc: number, curr: number) => acc + curr,
    0
  );

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* Cabeçalho Oficial exclusivo para Impressão / PDF */}
      <div className="hidden print:block border-b-2 border-gray-900 pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-gray-950 uppercase tracking-tight">SETGEN & SERVIÇOS</h1>
            <p className="text-xs font-semibold text-gray-700">R G VIEIRA BENTES • CNPJ: 10.744.400/0001-65</p>
            <p className="text-[10px] text-gray-500">Relatório Executivo de Desempenho Operacional</p>
          </div>
          <div className="text-right text-[10px] text-gray-600">
            <p>Data de Emissão: {new Date().toLocaleDateString("pt-BR")}</p>
            <p>
              Período: {filters.startDate ? new Date(filters.startDate).toLocaleDateString("pt-BR") : "Início"} até{" "}
              {filters.endDate ? new Date(filters.endDate).toLocaleDateString("pt-BR") : "Hoje"}
            </p>
          </div>
        </div>
      </div>

      {/* Top Header & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <PageHeader
          title="Relatórios Operacionais"
          subtitle="Análises e indicadores de desempenho, volume de serviços e produtividade técnica"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-border bg-card text-foreground rounded-lg hover:bg-muted/50 flex items-center gap-2 text-xs font-semibold shadow-sm transition-colors"
            title="Exportar dados para Excel/CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 text-xs font-semibold shadow-sm transition-colors"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Atalhos Rápidos */}
      <Card className="p-4 border-border/80 shadow-sm print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Filtros de Período</span>
          </div>

          {/* Atalhos rápidos (Pills) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Tudo" },
              { id: "7D", label: "7 Dias" },
              { id: "30D", label: "30 Dias" },
              { id: "THIS_MONTH", label: "Este Mês" },
              { id: "90D", label: "90 Dias" },
              { id: "THIS_YEAR", label: "Este Ano" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id as PresetFilter)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  activePreset === p.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Data Inicial</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setActivePreset("ALL");
                setFilters({ ...filters, startDate: e.target.value });
              }}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/25 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Data Final</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setActivePreset("ALL");
                setFilters({ ...filters, endDate: e.target.value });
              }}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/25 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Cliente</label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/25 bg-background text-foreground truncate"
            >
              <option value="">Todos os Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName || c.companyName || c.name || "Cliente"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadCharts}
              disabled={loading}
              className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>

            {(filters.startDate || filters.endDate || filters.clientId) && (
              <button
                onClick={() => {
                  setActivePreset("ALL");
                  setFilters({ startDate: "", endDate: "", clientId: "" });
                }}
                className="px-2.5 py-1.5 border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium hover:bg-muted/50"
                title="Limpar filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* CARDS DE KPIS / INDICADORES EXECUTIVOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Visitas Técnicas */}
        <Card className="p-4 border-l-4 border-l-primary shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Visitas Técnicas</span>
            <div className="p-1.5 rounded-md bg-orange-100 text-primary">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {overview?.kpis.totalVisits ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            Visitas de campo registradas
          </p>
        </Card>

        {/* KPI 2: Ordens de Serviço */}
        <Card className="p-4 border-l-4 border-l-blue-500 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de OS</span>
            <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {overview?.kpis.totalOrders ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span className="font-semibold text-blue-600">{overview?.kpis.inProgressOrders ?? 0}</span> em andamento •{" "}
            <span className="font-semibold text-amber-600">{overview?.kpis.awaitingOrders ?? 0}</span> aguardando
          </p>
        </Card>

        {/* KPI 3: Taxa de Conclusão */}
        <Card className="p-4 border-l-4 border-l-emerald-500 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Taxa de Conclusão</span>
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-foreground">
              {overview?.kpis.completionRate ?? 0}%
            </div>
            <span className="text-[11px] font-semibold text-emerald-600">
              ({overview?.kpis.completedOrders ?? 0} finalizadas)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overview?.kpis.completionRate ?? 0, 100)}%` }}
            />
          </div>
        </Card>

        {/* KPI 4: Faturamento Realizado */}
        <Card className="p-4 border-l-4 border-l-green-600 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faturamento Faturado</span>
            <div className="p-1.5 rounded-md bg-green-100 text-green-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground truncate" title={formatBRL(overview?.kpis.totalRevenue ?? 0)}>
            {formatBRL(overview?.kpis.totalRevenue ?? 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Notas fiscais autorizadas</p>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico 1: Visitas por Mês */}
        <Card className="p-5 border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Visitas Técnicas por Mês</h3>
              <p className="text-[11px] text-muted-foreground">Evolução do volume de deslocamentos e vistorias</p>
            </div>
          </div>
          <div className="h-64">
            {visitsByMonth && visitsByMonth.labels && visitsByMonth.labels.length > 0 ? (
              <Line data={visitsByMonth} options={lineChartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
                <span>Nenhum dado de visita encontrado para o filtro</span>
              </div>
            )}
          </div>
        </Card>

        {/* Gráfico 2: OS por Status */}
        <Card className="p-5 border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Ordens de Serviço por Status</h3>
              <p className="text-[11px] text-muted-foreground">
                Distribuição de status no período {totalDoughnutCount > 0 && `(${totalDoughnutCount} ordens)`}
              </p>
            </div>
          </div>
          <div className="h-64 relative">
            {ordersByStatus && ordersByStatus.labels && ordersByStatus.labels.length > 0 ? (
              <Doughnut data={ordersByStatus} options={doughnutChartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
                <span>Nenhum dado de status no período</span>
              </div>
            )}
          </div>
        </Card>

        {/* Gráfico 3: Faturamento Mensal */}
        <Card className="p-5 border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Faturamento Mensal (R$)</h3>
              <p className="text-[11px] text-muted-foreground">Valores brutos autorizados em notas fiscais</p>
            </div>
          </div>
          <div className="h-64">
            {monthlyRevenue && monthlyRevenue.labels && monthlyRevenue.labels.length > 0 ? (
              <Bar data={monthlyRevenue} options={revenueChartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
                <span>Sem notas autorizadas no período</span>
              </div>
            )}
          </div>
        </Card>

        {/* Gráfico 4: Performance por Técnico */}
        <Card className="p-5 border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Produtividade por Responsável Técnico</h3>
              <p className="text-[11px] text-muted-foreground">Ordens de serviço atribuídas e executadas</p>
            </div>
          </div>
          <div className="h-64">
            {technicianPerformance && technicianPerformance.labels && technicianPerformance.labels.length > 0 ? (
              <Bar data={technicianPerformance} options={performanceChartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
                <span>Sem dados de técnicos atribuídos</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* TABELA DE DETALHAMENTO (DRILL-DOWN) */}
      <Card className="p-5 border-border shadow-xs print:p-0 print:border-none print:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Últimas Ordens de Serviço do Período</h3>
            <p className="text-[11px] text-muted-foreground">Detalhamento e consulta rápida das atividades recentes</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {overview?.recentOrders?.length || 0} ordens listadas
          </span>
        </div>

        {overview?.recentOrders && overview.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-border rounded-lg overflow-hidden">
              <thead className="bg-muted/70 text-text-secondary border-b border-border uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Número OS</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Equipamento</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right print:hidden">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview.recentOrders
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((order) => {
                  const statusInfo = formatStatus(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        #{order.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {order.client?.tradeName || order.client?.companyName || "Cliente"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {order.equipment?.model ? (
                          <span>
                            {order.equipment.model}{" "}
                            {order.equipment.serialNumber && (
                              <span className="text-[10px] text-muted-foreground/70">
                                (S/N: {order.equipment.serialNumber})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right print:hidden">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          Ver OS
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <TablePagination
              currentPage={currentPage}
              totalPages={Math.ceil((overview.recentOrders.length || 0) / ITEMS_PER_PAGE) || 1}
              totalItems={overview.recentOrders.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="ordens de serviço"
              className="print:hidden mt-3"
            />
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Nenhuma ordem de serviço encontrada com os filtros selecionados.
          </div>
        )}
      </Card>
    </div>
  );
}

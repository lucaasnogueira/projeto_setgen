"use client"

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api/reports';
import { clientsApi } from '@/lib/api/clients';
import { Download, Filter } from 'lucide-react';
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
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    clientId: '',
  });

  const [visitsByMonth, setVisitsByMonth] = useState<any>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<any>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any>(null);
  const [technicianPerformance, setTechnicianPerformance] = useState<any>(null);

  useEffect(() => {
    loadClients();
    loadCharts();
  }, []);

  const loadClients = async () => {
    const data = await clientsApi.getAll();
    setClients(data);
  };

  const loadCharts = async () => {
    setLoading(true);
    try {
      const [visits, orders, revenue, performance] = await Promise.all([
        reportsApi.getVisitsByMonth(filters),
        reportsApi.getOrdersByStatus(filters),
        reportsApi.getMonthlyRevenue(filters),
        reportsApi.getTechnicianPerformance(filters),
      ]);

      setVisitsByMonth(visits);
      setOrdersByStatus(orders);
      setMonthlyRevenue(revenue);
      setTechnicianPerformance(performance);
    } catch (error) {
      console.error('Erro ao carregar gráficos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await reportsApi.exportPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
    } catch (error) {
      alert('Erro ao exportar PDF');
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Relatórios" subtitle="Análises e indicadores de desempenho" />

      {/* Filtros */}
      <Card className="p-5">
        <h2 className="text-[14.5px] font-bold text-foreground mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5">
              Cliente
            </label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos os Clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={loadCharts}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[9px] hover:bg-primary/90 flex items-center justify-center gap-2 text-[12.5px] font-bold"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 border border-border text-text-secondary rounded-[9px] hover:bg-muted/40 flex items-center justify-center gap-2 text-[12.5px] font-bold"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-[14.5px] font-bold text-foreground mb-4">Visitas por Mês</h3>
          <div className="h-64">
            {visitsByMonth && visitsByMonth.labels.length > 0 ? (
              <Line data={visitsByMonth} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[14.5px] font-bold text-foreground mb-4">OS por Status</h3>
          <div className="h-64">
            {ordersByStatus && ordersByStatus.labels.length > 0 ? (
              <Doughnut data={ordersByStatus} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[14.5px] font-bold text-foreground mb-4">Faturamento Mensal</h3>
          <div className="h-64">
            {monthlyRevenue && monthlyRevenue.labels.length > 0 ? (
              <Bar data={monthlyRevenue} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[14.5px] font-bold text-foreground mb-4">Performance por Técnico</h3>
          <div className="h-64">
            {technicianPerformance && technicianPerformance.labels.length > 0 ? (
              <Bar data={technicianPerformance} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

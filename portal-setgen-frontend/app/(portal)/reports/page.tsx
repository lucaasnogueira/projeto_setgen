"use client"

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api/reports';
import { clientsApi } from '@/lib/api/clients';
import { BarChart3, Download, Calendar, Filter } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Relatórios</h1>
              <p className="text-purple-100">Análises e indicadores de desempenho</p>
            </div>
          </div>
          <BarChart3 className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-600" />
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleExportPDF}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 flex items-center justify-center gap-2 shadow-lg"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visitas por Mês */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Visitas por Mês</h3>
          <div className="h-64">
            {visitsByMonth && visitsByMonth.labels.length > 0 ? (
              <Line data={visitsByMonth} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>

        {/* OS por Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">OS por Status</h3>
          <div className="h-64">
            {ordersByStatus && ordersByStatus.labels.length > 0 ? (
              <Doughnut data={ordersByStatus} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>

        {/* Faturamento Mensal */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Faturamento Mensal</h3>
          <div className="h-64">
            {monthlyRevenue && monthlyRevenue.labels.length > 0 ? (
              <Bar data={monthlyRevenue} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>

        {/* Performance por Técnico */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Performance por Técnico</h3>
          <div className="h-64">
            {technicianPerformance && technicianPerformance.labels.length > 0 ? (
              <Bar data={technicianPerformance} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

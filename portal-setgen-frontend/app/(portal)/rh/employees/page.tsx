"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeApi } from '@/lib/api/employees';
import { Employee, EmployeeStatus } from '@/types';
import { 
  Users, 
  Plus, 
  Search, 
  UserCheck, 
  UserX, 
  Briefcase, 
  Calendar,
  AlertTriangle,
  FileText,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pagination } from '@/components/ui/pagination';
import { PaginatedResponse } from '@/types';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<Employee>['meta'] | null>(null);

  useEffect(() => {
    loadEmployees();
  }, [statusFilter, currentPage]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeApi.getAll(
        statusFilter === 'ALL' ? undefined : statusFilter,
        currentPage,
        12 // 12 per page for the grid
      );
      setEmployees(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (status: EmployeeStatus | 'ALL') => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf.includes(searchTerm) ||
    (emp.position?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getASOStatus = (aso: any) => {
    if (!aso) return { label: 'Pendente', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    
    const expiryDate = new Date(aso.expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (today > expiryDate) {
      return { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    
    if (thirtyDaysFromNow > expiryDate) {
      return { label: 'Próximo do Vencimento', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle };
    }

    return { label: 'Regular', color: 'bg-green-100 text-green-800', icon: UserCheck };
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Recursos Humanos</h1>
              <p className="text-gray-300">Gestão de funcionários, ASOs e documentação</p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/rh/employees/new')}
            className="bg-orange-600 hover:bg-orange-500 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['ALL', ...Object.values(EmployeeStatus)] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange(status)}
                size="sm"
                className={statusFilter === status ? 'bg-gray-700' : ''}
              >
                {status === 'ALL' ? 'Todos' : 
                 status === EmployeeStatus.ACTIVE ? 'Ativos' : 
                 status === EmployeeStatus.AWAY ? 'Afastados' : 
                 status === EmployeeStatus.VACATION ? 'Férias' : 'Desligados'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Funcionários */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs uppercase text-gray-500 font-bold tracking-wider">Funcionário</th>
                <th className="px-6 py-4 text-xs uppercase text-gray-500 font-bold tracking-wider">CPF</th>
                <th className="px-6 py-4 text-xs uppercase text-gray-500 font-bold tracking-wider">Cargo / Depto</th>
                <th className="px-6 py-4 text-xs uppercase text-gray-500 font-bold tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs uppercase text-gray-500 font-bold tracking-wider">Status ASO</th>
                <th className="px-6 py-4 text-right text-xs uppercase text-gray-500 font-bold tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Users className="h-12 w-12" />
                      <p className="font-medium">Nenhum funcionário encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const latestAso = employee.asos?.[0];
                  const asoStatus = getASOStatus(latestAso);
                  const AsoIcon = asoStatus.icon;

                  return (
                    <tr 
                      key={employee.id} 
                      className="hover:bg-orange-50/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/rh/employees/${employee.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-bold group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{employee.name}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-tighter">
                              Admissão: {employee.admissionDate 
                                ? format(new Date(employee.admissionDate), 'dd/MM/yyyy', { locale: ptBR })
                                : 'Pendente'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{employee.cpf}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">{employee.position || '—'}</div>
                        <div className="text-xs text-gray-500">{employee.department || 'Setor não informado'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge 
                          variant={employee.status === EmployeeStatus.ACTIVE ? 'default' : 'outline'} 
                          className={`text-[10px] uppercase font-bold border-none ${
                            employee.status === EmployeeStatus.ACTIVE ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                            employee.status === EmployeeStatus.TERMINATED ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                            employee.status === EmployeeStatus.VACATION ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {employee.status === EmployeeStatus.ACTIVE ? 'Ativo' : 
                           employee.status === EmployeeStatus.AWAY ? 'Afastado' :
                           employee.status === EmployeeStatus.VACATION ? 'Férias' : 'Desligado'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold flex items-center gap-1 w-fit ring-1 ring-inset ${
                          asoStatus.label === 'Regular' ? 'text-green-700 bg-green-50 ring-green-600/20' :
                          asoStatus.label === 'Vencido' ? 'text-red-700 bg-red-50 ring-red-600/20' :
                          'text-amber-700 bg-amber-50 ring-amber-600/20'
                        }`}>
                          <AsoIcon className="h-3 w-3" />
                          {asoStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-md p-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={meta.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

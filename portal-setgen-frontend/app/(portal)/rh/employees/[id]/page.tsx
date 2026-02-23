"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { employeeApi } from '@/lib/api/employees';
import { Employee, ASO, EmployeeDocument, EmployeeStatus } from '@/types';
import { 
  User, 
  Briefcase, 
  ArrowLeft,
  Info,
  ShieldCheck,
  FileBox,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeForm } from '@/components/rh/EmployeeForm';
import { ASOList } from '@/components/rh/ASOList';
import { DocumentList } from '@/components/rh/DocumentList';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (params.id) {
      loadEmployee();
    }
  }, [params.id]);

  const loadEmployee = async () => {
    try {
      const data = await employeeApi.getById(params.id as string);
      setEmployee(data);
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
      router.push('/rh/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    try {
      await employeeApi.update(params.id as string, formData);
      alert('Funcionário atualizado com sucesso!');
      loadEmployee();
    } catch (error) {
      alert('Erro ao atualizar funcionário');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <button 
            onClick={() => router.push('/rh/employees')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Voltar para lista
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                <p className="text-gray-300 mt-1 opacity-90 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {employee.position || 'Cargo não informado'} • CPF: {employee.cpf}
                </p>
              </div>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-sm">
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 font-bold ${
                employee.status === EmployeeStatus.ACTIVE ? 'text-green-400' : 
                employee.status === EmployeeStatus.TERMINATED ? 'text-red-400' : 
                employee.status === EmployeeStatus.VACATION ? 'text-blue-400' : 
                'text-amber-400'
              }`}>
                {employee.status === EmployeeStatus.ACTIVE ? 'Ativo' : 
                 employee.status === EmployeeStatus.AWAY ? 'Afastado' :
                 employee.status === EmployeeStatus.VACATION ? 'Férias' : 'Desligado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-md border mb-6">
          <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <Info className="h-4 w-4 mr-2" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="aso" className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <ShieldCheck className="h-4 w-4 mr-2" />
            ASO (Saúde)
          </TabsTrigger>
          <TabsTrigger value="docs" className="rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
            <FileBox className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-0 space-y-6">
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Edit className="h-5 w-5 text-gray-400" />
                Editar Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <EmployeeForm 
                initialData={employee} 
                onSubmit={handleUpdate} 
                onCancel={() => router.push('/rh/employees')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aso" className="mt-0">
          <ASOList 
            employeeId={employee.id} 
            initialAsos={employee.asos || []} 
            onSuccess={loadEmployee}
          />
        </TabsContent>

        <TabsContent value="docs" className="mt-0">
          <DocumentList 
            employeeId={employee.id} 
            initialDocuments={employee.documents || []} 
            onSuccess={loadEmployee}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

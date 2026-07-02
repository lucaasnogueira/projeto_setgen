"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { employeeApi } from '@/lib/api/employees';
import { Employee, ASO, EmployeeDocument } from '@/types';
import {
  User,
  Briefcase,
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
import { DetailHeader } from '@/components/layout/DetailHeader';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={User}
        tone="gray"
        title={employee.name}
        subtitle={
          <>
            <Briefcase className="h-3.5 w-3.5" />
            {employee.position || 'Cargo não informado'} • CPF: {employee.cpf}
            <span className={`ml-2 px-2.5 py-0.5 text-[11px] font-bold rounded-full ${getStatusColor(employee.status)}`}>
              {getStatusLabel(employee.status)}
            </span>
          </>
        }
        onBack={() => router.push('/rh/employees')}
        backLabel="Voltar para lista"
      />

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

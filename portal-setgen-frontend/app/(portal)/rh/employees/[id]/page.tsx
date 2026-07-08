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
import { CompactDetailHeader } from '@/components/layout/CompactDetailHeader';
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
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={User}
        tone="gray"
        title={employee.name}
        badge={{ label: getStatusLabel(employee.status), className: getStatusColor(employee.status) }}
        meta={<><Briefcase className="h-3.5 w-3.5" />{employee.position || 'Cargo não informado'} · CPF: {employee.cpf}</>}
        onBack={() => router.push('/rh/employees')}
        backLabel="Voltar para lista"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="info">
            <Info className="h-4 w-4 mr-2" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="aso">
            <ShieldCheck className="h-4 w-4 mr-2" />
            ASO (Saúde)
          </TabsTrigger>
          <TabsTrigger value="docs">
            <FileBox className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Edit className="h-5 w-5 text-muted-foreground" />
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

        <TabsContent value="aso" className="mt-4">
          <ASOList 
            employeeId={employee.id} 
            initialAsos={employee.asos || []} 
            onSuccess={loadEmployee}
          />
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
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

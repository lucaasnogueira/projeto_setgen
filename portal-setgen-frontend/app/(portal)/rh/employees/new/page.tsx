"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeApi } from '@/lib/api/employees';
import { EmployeeForm } from '@/components/rh/EmployeeForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await employeeApi.create(data);
      toast.success('Funcionário cadastrado com sucesso!');
      router.push('/rh/employees');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar funcionário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20">
      <PageHeader title="Novo Funcionário" subtitle="Cadastre e organize as informações do novo colaborador" />

      {/* Form Container */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
        <EmployeeForm
          onSubmit={handleSubmit} 
          onCancel={() => router.push('/rh/employees')} 
          loading={loading}
        />
      </div>
    </div>
  );
}

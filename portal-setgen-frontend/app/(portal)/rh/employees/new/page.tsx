"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeApi } from '@/lib/api/employees';
import { EmployeeForm } from '@/components/rh/EmployeeForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } z-50 animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await employeeApi.create(data);
      showToast('Funcionário cadastrado com sucesso!');
      router.push('/rh/employees');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao cadastrar funcionário', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20">
      <PageHeader title="Novo Funcionário" subtitle="Cadastre e organize as informações do novo colaborador" />

      {/* Form Container */}
      <div className="bg-card border border-border rounded-[14px] p-6 md:p-8">
        <EmployeeForm
          onSubmit={handleSubmit} 
          onCancel={() => router.push('/rh/employees')} 
          loading={loading}
        />
      </div>
    </div>
  );
}

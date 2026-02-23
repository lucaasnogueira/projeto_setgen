"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeApi } from '@/lib/api/employees';
import { EmployeeForm } from '@/components/rh/EmployeeForm';
import { UserPlus } from 'lucide-react';

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
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gray-900 rounded-3xl p-8 text-white shadow-2xl">
        {/* Abstract background decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-white/70">Módulo RH</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">Novo Funcionário</h1>
              <p className="text-gray-400 mt-1 font-medium">Cadastre e organize as informações do novo colaborador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl p-8 md:p-12">
        <EmployeeForm 
          onSubmit={handleSubmit} 
          onCancel={() => router.push('/rh/employees')} 
          loading={loading}
        />
      </div>
    </div>
  );
}

"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { FileText } from 'lucide-react';
import { ServiceOrderForm } from '../components/ServiceOrderForm';

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await ordersApi.create(payload);
      alert('OS criada com sucesso!');
      router.push('/orders');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar OS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Azul */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
              <p className="text-blue-100 mt-1 opacity-90">Criação de OS para atendimento ou execução</p>
            </div>
          </div>
        </div>
      </div>

      <ServiceOrderForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Criar Ordem de Serviço"
      />
    </div>
  );
}

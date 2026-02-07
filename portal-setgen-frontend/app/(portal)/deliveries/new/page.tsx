"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Truck } from 'lucide-react';
import { DeliveryForm } from '../components/DeliveryForm';

export default function NewDeliveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await deliveriesApi.create(payload);
      alert('Baixa de serviço registrada com sucesso!');
      router.push('/deliveries');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao registrar baixa de serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Truck className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Registrar Baixa de Serviço</h1>
            <p className="text-indigo-100">Registre a conclusão e aceite do serviço</p>
          </div>
        </div>
      </div>

      <DeliveryForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Registrar Baixa"
      />
    </div>
  );
}

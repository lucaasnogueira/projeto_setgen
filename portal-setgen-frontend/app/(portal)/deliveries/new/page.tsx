"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { DeliveryForm } from '../components/DeliveryForm';
import { PageHeader } from '@/components/layout/PageHeader';

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
    <div className="space-y-5">
      <PageHeader title="Registrar Baixa de Serviço" subtitle="Registre a conclusão e aceite do serviço" />

      <DeliveryForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Registrar Baixa"
      />
    </div>
  );
}

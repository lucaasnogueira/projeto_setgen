"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrderForm } from '../components/ServiceOrderForm';
import { PageHeader } from '@/components/layout/PageHeader';

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
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Nova Ordem de Serviço" subtitle="Criação de OS para atendimento ou execução" />

      <ServiceOrderForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Criar Ordem de Serviço"
      />
    </div>
  );
}

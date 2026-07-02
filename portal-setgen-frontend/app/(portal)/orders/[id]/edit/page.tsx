"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { ServiceOrder } from '@/types';
import { ServiceOrderForm } from '../../components/ServiceOrderForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(params.id as string);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Erro ao carregar OS para edição');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await ordersApi.update(params.id as string, payload);
      alert('OS atualizada com sucesso!');
      router.push(`/orders/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar OS');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title={`Editar OS #${order.orderNumber}`} subtitle="Atualize os detalhes e o escopo da ordem de serviço" />

      <ServiceOrderForm
        initialData={order}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

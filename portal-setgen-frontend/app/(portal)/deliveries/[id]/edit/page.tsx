"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Delivery } from '@/types';
import { DeliveryForm } from '../../components/DeliveryForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadDelivery();
    }
  }, [params.id]);

  const loadDelivery = async () => {
    try {
      const data = await deliveriesApi.getById(params.id as string);
      setDelivery(data);
    } catch (error) {
      console.error('Error loading delivery:', error);
      alert('Erro ao carregar entrega para edição');
      router.push('/deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await deliveriesApi.update(params.id as string, payload);
      alert('Entrega atualizada com sucesso!');
      router.push(`/deliveries/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar entrega');
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

  if (!delivery) return null;

  return (
    <div className="space-y-5">
      <PageHeader title="Editar Entrega" subtitle="Atualize as informações do registro de entrega" />

      <DeliveryForm
        initialData={delivery}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

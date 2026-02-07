"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { deliveriesApi } from '@/lib/api/deliveries';
import { Delivery } from '@/types';
import { Truck } from 'lucide-react';
import { DeliveryForm } from '../../components/DeliveryForm';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!delivery) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Truck className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Editar Entrega</h1>
            <p className="text-indigo-100">Atualize as informações do registro de entrega</p>
          </div>
        </div>
      </div>

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

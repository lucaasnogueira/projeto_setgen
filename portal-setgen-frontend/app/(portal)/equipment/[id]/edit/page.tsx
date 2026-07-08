"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { equipmentApi } from '@/lib/api/equipment';
import { Equipment } from '@/types';
import { EquipmentForm } from '../../components/EquipmentForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadEquipment();
    }
  }, [params.id]);

  const loadEquipment = async () => {
    try {
      const data = await equipmentApi.getOne(params.id as string);
      setEquipment(data);
    } catch (error) {
      console.error('Error loading equipment:', error);
      alert('Erro ao carregar equipamento para edição');
      router.push('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await equipmentApi.update(params.id as string, payload);
      alert('Equipamento atualizado com sucesso!');
      router.push(`/equipment/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar equipamento');
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

  if (!equipment) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Editar Equipamento" subtitle="Atualize as especificações do equipamento" />

      <EquipmentForm
        initialData={equipment}
        fixedClientId={equipment.clientId}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

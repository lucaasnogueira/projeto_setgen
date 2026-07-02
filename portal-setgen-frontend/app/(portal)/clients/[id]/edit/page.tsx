"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { clientsApi } from '@/lib/api/clients';
import { Client } from '@/types';
import { ClientForm } from '../../components/ClientForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadClient();
    }
  }, [params.id]);

  const loadClient = async () => {
    try {
      const data = await clientsApi.getOne(params.id as string);
      setClient(data);
    } catch (error) {
      console.error('Error loading client:', error);
      alert('Erro ao carregar cliente para edição');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await clientsApi.update(params.id as string, payload);
      alert('Cliente atualizado com sucesso!');
      router.push(`/clients/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar cliente');
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

  if (!client) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Editar Cliente" subtitle="Atualize as informações cadastrais do parceiro" />

      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

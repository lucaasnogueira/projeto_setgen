"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { clientsApi } from '@/lib/api/clients';
import { Client } from '@/types';
import { Building2 } from 'lucide-react';
import { ClientForm } from '../../components/ClientForm';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Laranja */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
              <p className="text-orange-100 mt-1 opacity-90">Atualize as informações cadastrais do parceiro</p>
            </div>
          </div>
        </div>
      </div>

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

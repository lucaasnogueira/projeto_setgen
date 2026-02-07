"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';
import { ClipboardList } from 'lucide-react';
import { VisitForm } from '../../components/VisitForm';

export default function EditVisitPage() {
  const params = useParams();
  const router = useRouter();
  const [visit, setVisit] = useState<TechnicalVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadVisit();
    }
  }, [params.id]);

  const loadVisit = async () => {
    try {
      const data = await visitsApi.getOne(params.id as string);
      setVisit(data);
    } catch (error) {
      console.error('Error loading visit:', error);
      alert('Erro ao carregar visita para edição');
      router.push('/visits');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await visitsApi.update(params.id as string, payload);
      alert('Visita atualizada com sucesso!');
      router.push(`/visits/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar visita');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!visit) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Roxo */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <ClipboardList className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Visita</h1>
              <p className="text-purple-100 mt-1 opacity-90">Atualize as informações do agendamento técnico</p>
            </div>
          </div>
        </div>
      </div>

      <VisitForm 
        initialData={visit}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        title="Editar Visita"
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

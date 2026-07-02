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
      if (payload instanceof FormData) {
        const files = payload.getAll('files');
        const legends = payload.getAll('legends[]');

        payload.delete('files');
        payload.delete('legends[]');

        const visitData: any = {};
        payload.forEach((value, key) => {
          if (key === 'responsibleIds[]') {
            if (!visitData.responsibleIds) visitData.responsibleIds = [];
            visitData.responsibleIds.push(value);
          } else {
            visitData[key] = value;
          }
        });

        await visitsApi.update(params.id as string, visitData);

        if (files.length > 0) {
          const attachmentData = new FormData();
          files.forEach((file, index) => {
            attachmentData.append('files', file);
            if (legends[index]) attachmentData.append('legends[]', legends[index]);
          });
          await visitsApi.addAttachments(params.id as string, attachmentData);
        }
      } else {
        await visitsApi.update(params.id as string, payload);
      }
      
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
    <div className="w-full max-w-4xl mx-auto pt-4 pb-12 flex flex-col">

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

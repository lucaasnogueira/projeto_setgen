"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { checklistTemplatesApi } from '@/lib/api/checklist-templates';
import { ChecklistTemplate } from '@/types';
import { ChecklistTemplateForm } from '../../components/ChecklistTemplateForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditChecklistTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadTemplate();
    }
  }, [params.id]);

  const loadTemplate = async () => {
    try {
      const data = await checklistTemplatesApi.getOne(params.id as string);
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Erro ao carregar template');
      router.push('/settings/checklist-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await checklistTemplatesApi.update(params.id as string, payload);
      alert('Template atualizado com sucesso!');
      router.push('/settings/checklist-templates');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar template');
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

  if (!template) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title={`Editar Template: ${template.name}`} subtitle="Alterações não afetam OS já criadas com este template" />

      <ChecklistTemplateForm
        initialData={template}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

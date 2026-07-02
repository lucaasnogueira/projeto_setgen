"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checklistTemplatesApi } from '@/lib/api/checklist-templates';
import { ChecklistTemplateForm } from '../components/ChecklistTemplateForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NewChecklistTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await checklistTemplatesApi.create(payload);
      alert('Template criado com sucesso!');
      router.push('/settings/checklist-templates');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Novo Template de Checklist" subtitle="Monte os campos que a OS vai carregar" />

      <ChecklistTemplateForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Criar Template"
      />
    </div>
  );
}

"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { quotesApi } from '@/lib/api/quotes';
import { QuoteForm } from '../components/QuoteForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      const created = await quotesApi.create(payload);
      alert('Orçamento criado com sucesso!');
      router.push(`/quotes/${created.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar orçamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Novo Orçamento" subtitle="Elaboração de orçamento comercial" />

      <QuoteForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Criar Orçamento"
      />
    </div>
  );
}

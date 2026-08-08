"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quotesApi } from '@/lib/api/quotes';
import { Quote } from '@/types';
import { QuoteForm } from '../../components/QuoteForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadQuote();
    }
  }, [params.id]);

  const loadQuote = async () => {
    try {
      const data = await quotesApi.getById(params.id as string);
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Erro ao carregar orçamento para edição');
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await quotesApi.update(params.id as string, payload);
      alert('Orçamento atualizado com sucesso!');
      router.push(`/quotes/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar orçamento');
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

  if (!quote) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title={`Editar Orçamento #${quote.quoteNumber}`} subtitle="Atualize o escopo e as condições comerciais" />

      <QuoteForm
        initialData={quote}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

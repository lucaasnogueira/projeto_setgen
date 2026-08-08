"use client"

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { quotesApi } from '@/lib/api/quotes';
import { Quote, QuoteStatus } from '@/types';
import { ServiceOrderForm } from '../components/ServiceOrderForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!quoteId) {
      setLoading(false);
      return;
    }
    quotesApi.getById(quoteId)
      .then(setQuote)
      .catch(() => setQuote(null))
      .finally(() => setLoading(false));
  }, [quoteId]);

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      const created = await ordersApi.createFromQuote(payload);
      alert('Ordem de Serviço criada com sucesso!');
      router.push(`/orders/${created.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar OS');
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

  if (!quoteId || !quote) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <Card className="p-8 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-status-amber-fg mx-auto" />
          <p className="font-bold text-foreground">Nenhum orçamento selecionado</p>
          <p className="text-sm text-text-muted">
            Ordens de Serviço são geradas a partir de um orçamento aceito. Abra o orçamento e use o botão "Gerar OS".
          </p>
        </Card>
      </div>
    );
  }

  if (quote.status !== QuoteStatus.ACCEPTED) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <Card className="p-8 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-status-amber-fg mx-auto" />
          <p className="font-bold text-foreground">Orçamento ainda não foi aceito</p>
          <p className="text-sm text-text-muted">
            O orçamento #{quote.quoteNumber} está com status atual — confirme a OC/OP e aceite o orçamento antes de gerar a OS.
          </p>
        </Card>
      </div>
    );
  }

  if (quote.serviceOrder) {
    router.replace(`/orders/${quote.serviceOrder.id}`);
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader
        title="Gerar Ordem de Serviço"
        subtitle={`A partir do orçamento #${quote.quoteNumber} — ${quote.client?.companyName}`}
      />

      <Card className="p-5 bg-muted/40">
        <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Escopo aprovado</p>
        <p className="text-[13.5px] text-text-secondary whitespace-pre-wrap">{quote.scope}</p>
      </Card>

      <ServiceOrderForm
        quoteId={quote.id}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Gerar Ordem de Serviço"
      />
    </div>
  );
}

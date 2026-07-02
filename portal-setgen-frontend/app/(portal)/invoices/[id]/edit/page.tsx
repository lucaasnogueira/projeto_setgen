"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { Invoice } from '@/types';
import { InvoiceForm } from '../../components/InvoiceForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const data = await invoicesApi.getById(params.id as string);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Erro ao carregar nota fiscal para edição');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await invoicesApi.update(params.id as string, payload);
      alert('Nota fiscal atualizada com sucesso!');
      router.push(`/invoices/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar nota fiscal');
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

  if (!invoice) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Editar Nota Fiscal" subtitle="Atualize os dados da NFe emitida" />

      <InvoiceForm
        initialData={invoice}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

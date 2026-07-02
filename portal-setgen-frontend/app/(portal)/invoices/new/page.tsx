"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { InvoiceForm } from '../components/InvoiceForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await invoicesApi.create(payload);
      alert('NFe emitida com sucesso!');
      router.push('/invoices');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao emitir NFe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Emitir Nota Fiscal" subtitle="Emissão de NFe baseada em Ordem de Compra" />

      <InvoiceForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Emitir NFe"
      />
    </div>
  );
}

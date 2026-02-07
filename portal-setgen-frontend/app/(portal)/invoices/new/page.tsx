"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api/invoices';
import { DollarSign } from 'lucide-react';
import { InvoiceForm } from '../components/InvoiceForm';

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Esmeralda */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Emitir Nota Fiscal</h1>
              <p className="text-emerald-100 mt-1 opacity-90">Emissão de NFe baseada em Ordem de Compra</p>
            </div>
          </div>
        </div>
      </div>

      <InvoiceForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Emitir NFe"
      />
    </div>
  );
}

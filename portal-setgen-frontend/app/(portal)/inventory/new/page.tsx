"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { Package } from 'lucide-react';
import { ProductForm } from '../components/ProductForm';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await inventoryApi.create(payload);
      alert('Produto cadastrado com sucesso!');
      router.push('/inventory');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cadastrar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Âmbar */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <Package className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Produto</h1>
              <p className="text-amber-100 mt-1 opacity-90">Adicione itens ao controle de estoque</p>
            </div>
          </div>
        </div>
      </div>

      <ProductForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Salvar Produto"
      />
    </div>
  );
}

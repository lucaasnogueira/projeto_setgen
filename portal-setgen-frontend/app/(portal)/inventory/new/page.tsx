"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { ProductForm } from '../components/ProductForm';
import { PageHeader } from '@/components/layout/PageHeader';

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
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Novo Produto" subtitle="Adicione itens ao controle de estoque" />

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Salvar Produto"
      />
    </div>
  );
}

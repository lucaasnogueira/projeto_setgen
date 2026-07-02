"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { Product } from '@/types';
import { ProductForm } from '../../components/ProductForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EditInventoryItemPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const data = await inventoryApi.getById(params.id as string);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Erro ao carregar produto para edição');
      router.push('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    try {
      await inventoryApi.update(params.id as string, payload);
      alert('Produto atualizado com sucesso!');
      router.push(`/inventory/${params.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar produto');
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

  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Editar Produto" subtitle="Atualize as informações do item em estoque" />

      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

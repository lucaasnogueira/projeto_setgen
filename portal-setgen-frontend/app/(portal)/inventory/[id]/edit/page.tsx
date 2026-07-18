"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { Product } from '@/types';
import { ProductForm } from '../../components/ProductForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthImage } from '@/components/ui/auth-image';
import { Camera, Loader2 } from 'lucide-react';

export default function EditInventoryItemPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const handlePhotoChange = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const updated = await inventoryApi.uploadPhoto(params.id as string, file);
      setProduct(updated);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Editar Produto" subtitle="Atualize as informações do item em estoque" />

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Camera className="h-5 w-5 text-blue-600" />
            Foto do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-3">
          {product.photoUrl && (
            <AuthImage
              src={product.photoUrl}
              alt={product.name}
              className="h-32 rounded-xl border object-cover"
            />
          )}
          <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border bg-card cursor-pointer text-sm font-semibold hover:bg-muted">
            {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {product.photoUrl ? 'Trocar foto' : 'Enviar foto'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoChange(file);
              }}
            />
          </label>
        </CardContent>
      </Card>

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

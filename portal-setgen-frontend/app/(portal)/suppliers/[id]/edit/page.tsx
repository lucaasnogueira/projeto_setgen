"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { suppliersApi } from "@/lib/api/suppliers";
import { Supplier } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupplierForm } from "../../components/SupplierForm";

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      suppliersApi
        .getOne(params.id as string)
        .then(setSupplier)
        .catch((error) => {
          console.error("Erro ao carregar fornecedor:", error);
          alert("Erro ao carregar fornecedor");
          router.push("/suppliers");
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await suppliersApi.update(params.id as string, data);
      alert("Fornecedor atualizado com sucesso!");
      router.push("/suppliers");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar fornecedor");
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

  if (!supplier) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <PageHeader title={`Editar ${supplier.name}`} subtitle="Atualize os dados do fornecedor" />

      <SupplierForm
        initialData={supplier}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

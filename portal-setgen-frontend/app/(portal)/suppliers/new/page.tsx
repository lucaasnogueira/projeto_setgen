"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { suppliersApi } from "@/lib/api/suppliers";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupplierForm } from "../components/SupplierForm";

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await suppliersApi.create(data);
      alert("Fornecedor cadastrado com sucesso!");
      router.push("/suppliers");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao cadastrar fornecedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <PageHeader title="Novo Fornecedor" subtitle="Cadastre um fornecedor para pedidos de compra" />

      <SupplierForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Salvar Fornecedor"
      />
    </div>
  );
}

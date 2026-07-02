"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { ClientForm } from "../components/ClientForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await clientsApi.create(payload);
      alert("Cliente cadastrado com sucesso!");
      router.push("/clients");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao cadastrar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Novo Cliente" subtitle="Cadastre e gerencie um novo parceiro de negócios" />

      <ClientForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Salvar Cliente"
      />
    </div>
  );
}

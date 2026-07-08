"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { equipmentApi } from "@/lib/api/equipment";
import { EquipmentForm } from "../components/EquipmentForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewEquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || undefined;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await equipmentApi.create(payload);
      alert("Equipamento cadastrado com sucesso!");
      router.push(clientId ? `/clients/${clientId}` : "/equipment");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao cadastrar equipamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <PageHeader title="Novo Equipamento" subtitle="Cadastre um gerador, subestação ou outro equipamento do cliente" />

      <EquipmentForm
        fixedClientId={clientId}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Salvar Equipamento"
      />
    </div>
  );
}

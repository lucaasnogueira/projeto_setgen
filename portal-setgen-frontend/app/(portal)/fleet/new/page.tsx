"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { vehiclesApi } from "@/lib/api/vehicles";
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleForm } from "../components/VehicleForm";

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await vehiclesApi.create(data);
      alert("Veículo cadastrado com sucesso!");
      router.push("/fleet");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao cadastrar veículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <PageHeader title="Novo Veículo" subtitle="Cadastre um veículo da frota" />

      <VehicleForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Salvar Veículo"
      />
    </div>
  );
}

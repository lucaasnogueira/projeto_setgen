"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { Building2 } from "lucide-react";
import { ClientForm } from "../components/ClientForm";

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Premium */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
              <p className="text-orange-100 mt-1 opacity-90">Cadastre e gerencie um novo parceiro de negócios</p>
            </div>
          </div>
        </div>
      </div>

      <ClientForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        submitLabel="Salvar Cliente"
      />
    </div>
  );
}

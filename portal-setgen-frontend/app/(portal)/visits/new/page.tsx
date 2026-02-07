"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { ClipboardList } from 'lucide-react';
import { VisitForm } from '../components/VisitForm';

export default function NewVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await visitsApi.create(payload);
      alert('Visita agendada com sucesso!');
      router.push('/visits');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao agendar visita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com Gradiente Roxo */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
              <ClipboardList className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nova Visita Técnica</h1>
              <p className="text-purple-100 mt-1 opacity-90">Agendamento de atendimento técnico presencial</p>
            </div>
          </div>
        </div>
      </div>

      <VisitForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
        title="Nova Visita Técnica"
        submitLabel="Agendar Visita"
      />
    </div>
  );
}

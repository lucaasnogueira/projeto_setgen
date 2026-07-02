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
    <div className="w-full max-w-4xl mx-auto pt-4 pb-12 flex flex-col">
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

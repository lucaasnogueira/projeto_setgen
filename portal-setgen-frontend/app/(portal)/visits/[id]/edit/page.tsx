"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VisitMultiCrudEditor } from '@/components/visits/VisitMultiCrudEditor';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';

export default function EditVisitPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.id as string;
  const [visit, setVisit] = useState<TechnicalVisit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visitId) {
      visitsApi.getOne(visitId)
        .then(setVisit)
        .catch(() => {
          alert('Erro ao carregar visita técnica');
          router.push('/visits');
        })
        .finally(() => setLoading(false));
    }
  }, [visitId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-white">
      <VisitMultiCrudEditor
        visitId={visitId}
        initialData={visit || undefined}
        onClose={() => router.push('/visits')}
        onSuccess={() => router.push('/visits')}
      />
    </div>
  );
}

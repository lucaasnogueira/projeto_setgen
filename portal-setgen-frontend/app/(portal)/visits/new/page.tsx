"use client"

import { useRouter } from 'next/navigation';
import { VisitMultiCrudEditor } from '@/components/visits/VisitMultiCrudEditor';

export default function NewVisitPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <VisitMultiCrudEditor
        onClose={() => router.push('/visits')}
        onSuccess={() => router.push('/visits')}
      />
    </div>
  );
}

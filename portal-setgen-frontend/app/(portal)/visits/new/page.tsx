"use client"

import { useRouter } from 'next/navigation';
import { VisitMultiCrudEditor } from '@/components/visits/VisitMultiCrudEditor';

export default function NewVisitPage() {
  const router = useRouter();

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-white">
      <VisitMultiCrudEditor
        onClose={() => router.push('/visits')}
        onSuccess={() => router.push('/visits')}
      />
    </div>
  );
}

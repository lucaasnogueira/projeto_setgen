"use client"

import { useRouter } from 'next/navigation';
import { ClientMultiCrudEditor } from '@/components/clients/ClientMultiCrudEditor';

export default function NewClientPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden -mx-8 -mt-7 -mb-12">
      <ClientMultiCrudEditor
        onClose={() => router.push('/clients')}
        onSuccess={() => router.push('/clients')}
      />
    </div>
  );
}

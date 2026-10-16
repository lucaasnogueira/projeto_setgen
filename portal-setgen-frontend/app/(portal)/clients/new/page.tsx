"use client"

import { useRouter } from 'next/navigation';
import { ClientMultiCrudEditor } from '@/components/clients/ClientMultiCrudEditor';

export default function NewClientPage() {
  const router = useRouter();

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-white">
      <ClientMultiCrudEditor
        onClose={() => router.push('/clients')}
        onSuccess={() => router.push('/clients')}
      />
    </div>
  );
}

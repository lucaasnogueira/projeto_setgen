"use client"

import { useRouter } from 'next/navigation';
import { ClientMultiCrudEditor } from '@/components/clients/ClientMultiCrudEditor';

export default function NewClientPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <ClientMultiCrudEditor
        onClose={() => router.push('/clients')}
        onSuccess={() => router.push('/clients')}
      />
    </div>
  );
}

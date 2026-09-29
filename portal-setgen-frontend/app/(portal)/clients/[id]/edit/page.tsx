"use client"

import { useParams, useRouter } from 'next/navigation';
import { ClientMultiCrudEditor } from '@/components/clients/ClientMultiCrudEditor';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <ClientMultiCrudEditor
        clientId={clientId}
        onClose={() => router.push('/clients')}
        onSuccess={() => router.push('/clients')}
      />
    </div>
  );
}

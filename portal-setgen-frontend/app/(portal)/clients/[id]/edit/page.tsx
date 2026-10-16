"use client"

import { useParams, useRouter } from 'next/navigation';
import { ClientMultiCrudEditor } from '@/components/clients/ClientMultiCrudEditor';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-white">
      <ClientMultiCrudEditor
        clientId={clientId}
        onClose={() => router.push('/clients')}
        onSuccess={() => router.push('/clients')}
      />
    </div>
  );
}

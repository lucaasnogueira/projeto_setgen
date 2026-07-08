"use client"

import { useRouter } from 'next/navigation';
import { NotaMercadoriaForm } from '../components/NotaMercadoriaForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSuccess = () => {
    alert('Nota fiscal emitida com sucesso!');
    router.push('/invoices');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      <PageHeader title="Emitir Nota Fiscal" subtitle="Mercadoria — cliente e produtos do estoque" />

      <NotaMercadoriaForm onSuccess={handleSuccess} onCancel={() => router.back()} />
    </div>
  );
}

"use client"

import { useRouter, useSearchParams } from 'next/navigation';
import { OrderMultiCrudEditor } from '@/components/orders/OrderMultiCrudEditor';

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId') || undefined;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <OrderMultiCrudEditor
        quoteId={quoteId}
        onClose={() => router.push('/orders')}
        onSuccess={() => router.push('/orders')}
      />
    </div>
  );
}

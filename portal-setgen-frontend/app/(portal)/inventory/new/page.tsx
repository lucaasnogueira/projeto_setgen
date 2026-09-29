"use client"

import { useRouter } from 'next/navigation';
import { ProductMultiCrudEditor } from '@/components/inventory/ProductMultiCrudEditor';

export default function NewInventoryItemPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <ProductMultiCrudEditor
        onClose={() => router.push('/inventory')}
        onSuccess={() => router.push('/inventory')}
      />
    </div>
  );
}

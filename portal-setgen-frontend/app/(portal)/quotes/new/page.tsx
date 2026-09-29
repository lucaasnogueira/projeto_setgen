"use client"

import { useRouter } from 'next/navigation';
import { QuoteMultiCrudEditor } from '@/components/quotes/QuoteMultiCrudEditor';

export default function NewQuotePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      <QuoteMultiCrudEditor
        onClose={() => router.push('/quotes')}
        onSuccess={() => router.push('/quotes')}
      />
    </div>
  );
}

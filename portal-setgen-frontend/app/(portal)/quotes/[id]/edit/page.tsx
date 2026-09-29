"use client"

import { useParams, useRouter } from 'next/navigation';
import { QuoteMultiCrudEditor } from '@/components/quotes/QuoteMultiCrudEditor';

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      <QuoteMultiCrudEditor
        quoteId={quoteId}
        onClose={() => router.push('/quotes')}
        onSuccess={() => router.push('/quotes')}
      />
    </div>
  );
}

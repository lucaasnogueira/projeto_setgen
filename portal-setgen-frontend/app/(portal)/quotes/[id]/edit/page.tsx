"use client"

import { useParams, useRouter } from 'next/navigation';
import { QuoteMultiCrudEditor } from '@/components/quotes/QuoteMultiCrudEditor';

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-white">
      <QuoteMultiCrudEditor
        quoteId={quoteId}
        onClose={() => router.push('/quotes')}
        onSuccess={() => router.push('/quotes')}
      />
    </div>
  );
}

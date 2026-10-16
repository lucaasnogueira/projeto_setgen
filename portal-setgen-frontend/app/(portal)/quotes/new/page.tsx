"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { QuoteMultiCrudEditor } from "@/components/quotes/QuoteMultiCrudEditor";

function NewQuoteContent() {
  const router = useRouter();

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-white">
      <QuoteMultiCrudEditor
        onClose={() => router.push("/quotes")}
        onSuccess={() => router.push("/quotes")}
      />
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2661D]" />
        </div>
      }
    >
      <NewQuoteContent />
    </Suspense>
  );
}

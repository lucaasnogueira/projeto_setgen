"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PurchaseOrderMultiCrudEditor } from "@/components/purchase-orders/PurchaseOrderMultiCrudEditor";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId") || undefined;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <PurchaseOrderMultiCrudEditor
        defaultQuoteId={quoteId}
        onClose={() => router.push(quoteId ? `/quotes/${quoteId}` : "/purchase-orders")}
        onSuccess={() => router.push(quoteId ? `/quotes/${quoteId}` : "/purchase-orders")}
      />
    </div>
  );
}

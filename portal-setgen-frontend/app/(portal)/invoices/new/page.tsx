"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { InvoiceMultiCrudEditor } from "@/components/invoices/InvoiceMultiCrudEditor";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || undefined;
  const serviceOrderId = searchParams.get("serviceOrderId") || undefined;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <InvoiceMultiCrudEditor
        defaultClientId={clientId}
        defaultServiceOrderId={serviceOrderId}
        onClose={() => router.push("/invoices")}
        onSuccess={() => router.push("/invoices")}
      />
    </div>
  );
}

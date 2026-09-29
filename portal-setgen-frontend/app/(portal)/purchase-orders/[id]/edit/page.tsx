"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { PurchaseOrder } from "@/types";
import { PurchaseOrderMultiCrudEditor } from "@/components/purchase-orders/PurchaseOrderMultiCrudEditor";
import { Loader2 } from "lucide-react";

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      purchaseOrdersApi.getById(orderId)
        .then(setOrder)
        .catch(() => {
          alert("Erro ao carregar Ordem de Compra");
          router.push("/purchase-orders");
        })
        .finally(() => setLoading(false));
    }
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-[#E2661D]" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <PurchaseOrderMultiCrudEditor
        orderId={orderId}
        initialData={order}
        onClose={() => router.push("/purchase-orders")}
        onSuccess={() => router.push("/purchase-orders")}
      />
    </div>
  );
}

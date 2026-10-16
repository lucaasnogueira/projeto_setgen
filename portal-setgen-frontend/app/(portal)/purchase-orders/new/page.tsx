"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { PurchaseOrderForm } from "../components/PurchaseOrderForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PurchaseOrderPrintModal } from "@/components/purchase-orders/PurchaseOrderPrintModal";
import { PurchaseOrder } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<PurchaseOrder | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleSubmit = async (data: Partial<PurchaseOrder>, openPrintAfter?: boolean) => {
    setLoading(true);
    try {
      const created = await purchaseOrdersApi.create(data);
      toast.success(`Ordem de Compra ${created.orderNumber} emitida com sucesso!`);

      if (openPrintAfter) {
        router.push(`/purchase-orders/${created.id}`);
      } else {
        router.push("/purchase-orders");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erro ao salvar Ordem de Compra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        title="Nova Ordem de Compra / Autorização de Retirada"
        subtitle="Emissão de autorização para retirada de materiais e peças em loja ou fornecedor"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/purchase-orders")}
            className="rounded-xl font-semibold border-gray-200 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Lista
          </Button>
        }
      />

      <PurchaseOrderForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/purchase-orders")}
        loading={loading}
        submitLabel="Salvar Ordem de Compra"
      />

      <PurchaseOrderPrintModal
        order={createdOrder}
        open={showPrintModal}
        onOpenChange={(open) => {
          setShowPrintModal(open);
          if (!open) {
            router.push("/purchase-orders");
          }
        }}
      />
    </div>
  );
}

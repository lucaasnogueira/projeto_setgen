"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { PurchaseOrder } from "@/types";
import { PurchaseOrderForm } from "../../components/PurchaseOrderForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { PurchaseOrderPrintModal } from "@/components/purchase-orders/PurchaseOrderPrintModal";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      purchaseOrdersApi
        .getById(orderId)
        .then(setOrder)
        .catch((err) => {
          console.error(err);
          toast.error("Erro ao carregar Ordem de Compra");
          router.push("/purchase-orders");
        })
        .finally(() => setLoading(false));
    }
  }, [orderId, router]);

  const handleSubmit = async (data: Partial<PurchaseOrder>, openPrintAfter?: boolean) => {
    setSaving(true);
    try {
      const updated = await purchaseOrdersApi.update(orderId, data);
      toast.success("Ordem de Compra atualizada com sucesso!");

      if (openPrintAfter) {
        router.push(`/purchase-orders/${orderId}`);
      } else {
        router.push("/purchase-orders");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erro ao atualizar Ordem de Compra.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-[#E2661D]" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        title={`Editar Ordem de Compra ${order.orderNumber}`}
        subtitle="Atualize os dados da retirada de materiais ou loja autorizada"
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
        initialData={order}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/purchase-orders")}
        loading={saving}
        submitLabel="Salvar Alterações"
      />

      <PurchaseOrderPrintModal
        order={order}
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

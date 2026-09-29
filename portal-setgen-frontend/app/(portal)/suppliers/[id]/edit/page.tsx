"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { suppliersApi } from "@/lib/api/suppliers";
import { Supplier } from "@/types";
import { SupplierMultiCrudEditor } from "@/components/suppliers/SupplierMultiCrudEditor";
import { Loader2 } from "lucide-react";

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supplierId) {
      suppliersApi.getOne(supplierId)
        .then(setSupplier)
        .catch(() => {
          alert("Erro ao carregar dados do fornecedor");
          router.push("/suppliers");
        })
        .finally(() => setLoading(false));
    }
  }, [supplierId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-[#E2661D]" />
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <SupplierMultiCrudEditor
        supplierId={supplierId}
        initialData={supplier}
        onClose={() => router.push("/suppliers")}
        onSuccess={() => router.push("/suppliers")}
      />
    </div>
  );
}

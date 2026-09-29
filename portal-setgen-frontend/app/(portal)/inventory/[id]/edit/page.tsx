"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { inventoryApi } from "@/lib/api/inventory";
import { Product } from "@/types";
import { ProductMultiCrudEditor } from "@/components/inventory/ProductMultiCrudEditor";
import { Loader2 } from "lucide-react";

export default function EditInventoryItemPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const data = await inventoryApi.getById(params.id as string);
      setProduct(data);
    } catch (error) {
      console.error("Error loading product:", error);
      alert("Erro ao carregar produto para edição");
      router.push("/inventory");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-[#E2661D]" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <ProductMultiCrudEditor
        productId={params.id as string}
        initialData={product}
        onClose={() => router.push("/inventory")}
        onSuccess={() => router.push("/inventory")}
      />
    </div>
  );
}

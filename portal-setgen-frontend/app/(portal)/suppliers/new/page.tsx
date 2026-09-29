"use client";

import { useRouter } from "next/navigation";
import { SupplierMultiCrudEditor } from "@/components/suppliers/SupplierMultiCrudEditor";

export default function NewSupplierPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <SupplierMultiCrudEditor
        onClose={() => router.push("/suppliers")}
        onSuccess={() => router.push("/suppliers")}
      />
    </div>
  );
}

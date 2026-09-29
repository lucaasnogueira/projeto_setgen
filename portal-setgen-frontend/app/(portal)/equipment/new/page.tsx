"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EquipmentMultiCrudEditor } from "@/components/equipment/EquipmentMultiCrudEditor";

export default function NewEquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || undefined;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <EquipmentMultiCrudEditor
        fixedClientId={clientId}
        onClose={() => router.push(clientId ? `/clients/${clientId}` : "/equipment")}
        onSuccess={() => router.push(clientId ? `/clients/${clientId}` : "/equipment")}
      />
    </div>
  );
}

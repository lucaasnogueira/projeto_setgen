"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { equipmentApi } from "@/lib/api/equipment";
import { Equipment } from "@/types";
import { EquipmentMultiCrudEditor } from "@/components/equipment/EquipmentMultiCrudEditor";
import { Loader2 } from "lucide-react";

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params.id as string;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (equipmentId) {
      equipmentApi.getOne(equipmentId)
        .then(setEquipment)
        .catch(() => {
          alert("Erro ao carregar dados do equipamento");
          router.push("/equipment");
        })
        .finally(() => setLoading(false));
    }
  }, [equipmentId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-[#E2661D]" />
      </div>
    );
  }

  if (!equipment) return null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <EquipmentMultiCrudEditor
        equipmentId={equipmentId}
        initialData={equipment}
        onClose={() => router.push("/equipment")}
        onSuccess={() => router.push("/equipment")}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { vehiclesApi } from "@/lib/api/vehicles";
import { Vehicle } from "@/types";
import { VehicleMultiCrudEditor } from "@/components/fleet/VehicleMultiCrudEditor";
import { Loader2 } from "lucide-react";

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vehicleId) {
      vehiclesApi.getOne(vehicleId)
        .then(setVehicle)
        .catch(() => {
          alert("Erro ao carregar dados do veículo");
          router.push("/fleet");
        })
        .finally(() => setLoading(false));
    }
  }, [vehicleId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-[#E2661D]" />
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <VehicleMultiCrudEditor
        vehicleId={vehicleId}
        initialData={vehicle}
        onClose={() => router.push("/fleet")}
        onSuccess={() => router.push("/fleet")}
      />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { VehicleMultiCrudEditor } from "@/components/fleet/VehicleMultiCrudEditor";

export default function NewVehiclePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <VehicleMultiCrudEditor
        onClose={() => router.push("/fleet")}
        onSuccess={() => router.push("/fleet")}
      />
    </div>
  );
}

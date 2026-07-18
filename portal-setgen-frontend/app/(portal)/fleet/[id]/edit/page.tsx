"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { vehiclesApi } from "@/lib/api/vehicles";
import { Vehicle } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthImage } from "@/components/ui/auth-image";
import { Camera, Loader2 } from "lucide-react";
import { VehicleForm } from "../../components/VehicleForm";

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (params.id) {
      vehiclesApi
        .getOne(params.id as string)
        .then(setVehicle)
        .catch((error) => {
          console.error("Erro ao carregar veículo:", error);
          alert("Erro ao carregar veículo");
          router.push("/fleet");
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await vehiclesApi.update(params.id as string, data);
      alert("Veículo atualizado com sucesso!");
      router.push("/fleet");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar veículo");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const updated = await vehiclesApi.uploadPhoto(params.id as string, file);
      setVehicle(updated);
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao enviar foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <PageHeader title={`Editar ${vehicle.name}`} subtitle="Atualize os dados do veículo" />

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Camera className="h-5 w-5 text-blue-600" />
            Foto do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-3">
          {vehicle.photoUrl && (
            <AuthImage
              src={vehicle.photoUrl}
              alt={vehicle.name}
              className="h-32 rounded-xl border object-cover"
            />
          )}
          <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border bg-card cursor-pointer text-sm font-semibold hover:bg-muted">
            {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {vehicle.photoUrl ? "Trocar foto" : "Enviar foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoChange(file);
              }}
            />
          </label>
        </CardContent>
      </Card>

      <VehicleForm
        initialData={vehicle}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

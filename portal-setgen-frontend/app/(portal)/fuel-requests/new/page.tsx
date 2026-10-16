"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fuelRequestsApi } from "@/lib/api/fuel-requests";
import { vehiclesApi } from "@/lib/api/vehicles";
import { Vehicle } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Fuel } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepFooter, type WizardStep } from "@/components/ui/step-wizard";

const stepDefs: WizardStep[] = [{ key: "dados", label: "Requisição de Abastecimento" }];

export default function NewFuelRequestPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "",
    liters: "",
    unitPrice: "",
    fuelStation: "",
    currentKm: "",
  });

  useEffect(() => {
    vehiclesApi.getAll().then(setVehicles).catch((error) => console.error("Erro ao carregar veículos:", error));
  }, []);

  const total = (Number(form.liters) || 0) * (Number(form.unitPrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.liters || !form.unitPrice) {
      alert("Preencha veículo, litros e preço por litro");
      return;
    }
    setLoading(true);
    try {
      await fuelRequestsApi.create({
        vehicleId: form.vehicleId,
        liters: Number(form.liters),
        unitPrice: Number(form.unitPrice),
        fuelStation: form.fuelStation || undefined,
        currentKm: form.currentKm ? Number(form.currentKm) : undefined,
      });
      alert("Requisição enviada — aguardando aprovação");
      router.push("/fleet");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao criar requisição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      <PageHeader title="Nova Requisição de Abastecimento" subtitle="Fica pendente até aprovação" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
              <Fuel className="h-3.5 w-3.5 text-[#E2661D]" />
              Dados do Abastecimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs text-gray-700">Veículo *</Label>
              <Select value={form.vehicleId} onValueChange={(val) => setForm({ ...form, vehicleId: val })}>
                <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200">
                  <SelectValue placeholder="Selecione o veículo..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} — {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-gray-700">Litros *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.liters}
                  onChange={(e) => setForm({ ...form, liters: e.target.value })}
                  placeholder="40"
                  className="h-9 rounded-lg text-xs border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-gray-700">Preço por Litro *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  placeholder="6,19"
                  className="h-9 rounded-lg text-xs border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-gray-700">Posto</Label>
                <Input
                  value={form.fuelStation}
                  onChange={(e) => setForm({ ...form, fuelStation: e.target.value })}
                  placeholder="Posto Ipiranga - BR 101"
                  className="h-9 rounded-lg text-xs border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-gray-700">KM Atual</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.currentKm}
                  onChange={(e) => setForm({ ...form, currentKm: e.target.value })}
                  className="h-9 rounded-lg text-xs border-gray-200"
                />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Valor total</span>
              <span className="text-base font-extrabold text-gray-900">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <StepFooter
          steps={stepDefs}
          activeKey="dados"
          onNext={() => {}}
          onCancel={() => router.back()}
          loading={loading}
          submitLabel="Enviar Requisição"
        />
      </form>
    </div>
  );
}

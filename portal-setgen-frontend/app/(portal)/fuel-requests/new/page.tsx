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
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <PageHeader title="Nova Requisição de Abastecimento" subtitle="Fica pendente até aprovação" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Fuel className="h-5 w-5 text-blue-600" />
              Dados do Abastecimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Veículo *</Label>
              <Select value={form.vehicleId} onValueChange={(val) => setForm({ ...form, vehicleId: val })}>
                <SelectTrigger className="h-12 rounded-2xl">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-sm">Litros *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.liters}
                  onChange={(e) => setForm({ ...form, liters: e.target.value })}
                  placeholder="40"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Preço por Litro *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  placeholder="6,19"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Posto</Label>
                <Input
                  value={form.fuelStation}
                  onChange={(e) => setForm({ ...form, fuelStation: e.target.value })}
                  placeholder="Posto Ipiranga - BR 101"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">KM Atual</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.currentKm}
                  onChange={(e) => setForm({ ...form, currentKm: e.target.value })}
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-text-secondary">Valor total</span>
              <span className="text-xl font-extrabold text-foreground">{formatCurrency(total)}</span>
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

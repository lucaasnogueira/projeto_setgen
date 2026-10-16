"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck } from "lucide-react";
import { Vehicle } from "@/types";
import { StepFooter, type WizardStep } from "@/components/ui/step-wizard";

const stepDefs: WizardStep[] = [{ key: "dados", label: "Dados do Veículo" }];

interface VehicleFormProps {
  initialData?: Partial<Vehicle>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function VehicleForm({ initialData, onSubmit, onCancel, loading, submitLabel }: VehicleFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    plate: initialData?.plate || "",
    currentKm: initialData?.currentKm ?? 0,
    lastOilChangeKm: initialData?.lastOilChangeKm ?? 0,
    oilChangeIntervalKm: initialData?.oilChangeIntervalKm ?? 10000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <Truck className="h-3.5 w-3.5 text-[#E2661D]" />
            Dados do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Veículo / Modelo *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: FIORINO"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Placa *</Label>
              <Input
                required
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                placeholder="RFD2F55"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">KM Atual</Label>
              <Input
                type="number"
                min={0}
                value={form.currentKm}
                onChange={(e) => setForm({ ...form, currentKm: Number(e.target.value) })}
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">KM Última Troca de Óleo</Label>
              <Input
                type="number"
                min={0}
                value={form.lastOilChangeKm}
                onChange={(e) => setForm({ ...form, lastOilChangeKm: Number(e.target.value) })}
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Intervalo de Troca (KM)</Label>
              <Input
                type="number"
                min={1}
                value={form.oilChangeIntervalKm}
                onChange={(e) => setForm({ ...form, oilChangeIntervalKm: Number(e.target.value) })}
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <StepFooter
        steps={stepDefs}
        activeKey="dados"
        onNext={() => {}}
        onCancel={onCancel}
        loading={loading}
        submitLabel={submitLabel}
      />
    </form>
  );
}

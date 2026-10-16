"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";
import { Supplier } from "@/types";
import { StepFooter, type WizardStep } from "@/components/ui/step-wizard";

const stepDefs: WizardStep[] = [{ key: "dados", label: "Dados do Fornecedor" }];

interface SupplierFormProps {
  initialData?: Partial<Supplier>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function SupplierForm({ initialData, onSubmit, onCancel, loading, submitLabel }: SupplierFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    cnpj: initialData?.cnpj || "",
    contact: initialData?.contact || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
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
            <Building className="h-3.5 w-3.5 text-[#E2661D]" />
            Dados do Fornecedor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <Label className="font-semibold text-xs text-gray-700">Nome *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Distribuidora Elétrica Ltda"
              className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">CNPJ</Label>
              <Input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                placeholder="12.345.678/0001-90"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Contato</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Nome do vendedor"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vendas@fornecedor.com"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 3456-7890"
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

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
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building className="h-5 w-5 text-blue-600" />
            Dados do Fornecedor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-sm">Nome *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Distribuidora Elétrica Ltda"
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">CNPJ</Label>
              <Input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                placeholder="12.345.678/0001-90"
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Contato</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Nome do vendedor"
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vendas@fornecedor.com"
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 3456-7890"
                className="h-12 rounded-2xl"
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

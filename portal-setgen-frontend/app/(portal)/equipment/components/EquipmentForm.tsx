"use client"

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Cog, Building2, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { clientsApi } from "@/lib/api/clients";
import { Equipment, EquipmentType, Client } from "@/types";
import { cn } from "@/lib/utils";
import { StepRail, StepFooter, type WizardStep } from "@/components/ui/step-wizard";

const equipmentSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  type: z.nativeEnum(EquipmentType),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  powerRating: z.string().optional(),
  installLocation: z.string().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: "Gerador",
  [EquipmentType.SUBSTATION]: "Subestação",
  [EquipmentType.OTHER]: "Outro",
};

interface EquipmentFormProps {
  initialData?: Partial<Equipment>;
  fixedClientId?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function EquipmentForm({
  initialData,
  fixedClientId,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: EquipmentFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [fixedClientName, setFixedClientName] = useState<string | undefined>(
    initialData?.client?.companyName,
  );

  const { register, handleSubmit, control, formState: { errors } } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      clientId: fixedClientId || initialData?.clientId || "",
      type: initialData?.type || EquipmentType.GENERATOR,
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      serialNumber: initialData?.serialNumber || "",
      powerRating: initialData?.powerRating || "",
      installLocation: initialData?.installLocation || "",
      purchaseDate: initialData?.purchaseDate ? initialData.purchaseDate.slice(0, 10) : "",
      notes: initialData?.notes || "",
    },
  });

  useEffect(() => {
    if (!fixedClientId) {
      clientsApi.getAll().then(setClients).catch((error) => console.error("Erro ao carregar clientes:", error));
    } else if (!fixedClientName) {
      clientsApi.getOne(fixedClientId).then((c) => setFixedClientName(c.companyName)).catch((error) => console.error("Erro ao carregar cliente:", error));
    }
  }, [fixedClientId, fixedClientName]);

  type StepKey = "cliente" | "especificacoes" | "observacoes";
  const [activeStep, setActiveStep] = useState<StepKey>("cliente");
  const stepDefs: WizardStep[] = [
    { key: "cliente", label: "Cliente e Tipo" },
    { key: "especificacoes", label: "Especificações" },
    { key: "observacoes", label: "Observações" },
  ];

  useEffect(() => {
    if (errors.clientId) setActiveStep("cliente");
  }, [errors]);

  const submit = (values: EquipmentFormValues) => {
    onSubmit({
      ...values,
      purchaseDate: values.purchaseDate ? new Date(values.purchaseDate).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      <Card className={cn(activeStep !== "cliente" && "hidden")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-text-muted" />
            Cliente e Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            {fixedClientId ? (
              <>
                <input type="hidden" {...register("clientId")} />
                <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted text-sm font-medium text-text-secondary">
                  {fixedClientName || "Carregando..."}
                </div>
              </>
            ) : (
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de Equipamento</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EquipmentType).map((t) => (
                      <SelectItem key={t} value={t}>{EQUIPMENT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={cn(activeStep !== "especificacoes" && "hidden")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cog className="h-4 w-4 text-text-muted" />
            Especificações
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Input {...register("brand")} placeholder="Ex: Stemac" />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Input {...register("model")} placeholder="Ex: GS200" />
          </div>
          <div className="space-y-1.5">
            <Label>Nº de série</Label>
            <Input {...register("serialNumber")} placeholder="Ex: SN-12345" />
          </div>
          <div className="space-y-1.5">
            <Label>Potência</Label>
            <Input {...register("powerRating")} placeholder="Ex: 200 kVA" />
          </div>
          <div className="space-y-1.5">
            <Label>Local de instalação</Label>
            <Input {...register("installLocation")} placeholder="Ex: Casa de máquinas - térreo" />
          </div>
          <div className="space-y-1.5">
            <Label>Data de compra</Label>
            <Input type="date" {...register("purchaseDate")} />
          </div>
        </CardContent>
      </Card>

      <Card className={cn(activeStep !== "observacoes" && "hidden")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-4 w-4 text-text-muted" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Observações internas sobre este equipamento..."
            className="w-full rounded-[8px] border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </CardContent>
      </Card>

      <StepFooter
        steps={stepDefs}
        activeKey={activeStep}
        onNext={(k) => setActiveStep(k as StepKey)}
        onCancel={onCancel}
        loading={loading}
        submitLabel={submitLabel}
      />
    </form>
  );
}

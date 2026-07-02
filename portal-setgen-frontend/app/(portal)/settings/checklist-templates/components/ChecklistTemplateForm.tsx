"use client"

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, X, Loader2, FileText } from "lucide-react";
import { ChecklistTemplate, ChecklistFieldDefinition, ServiceOrderType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChecklistFieldsEditor } from "./ChecklistFieldsEditor";

const ANY_TYPE = "__any__";

const templateSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  serviceOrderType: z.string().optional(),
  active: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface ChecklistTemplateFormProps {
  initialData?: Partial<ChecklistTemplate>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function ChecklistTemplateForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: ChecklistTemplateFormProps) {
  const [fields, setFields] = useState<ChecklistFieldDefinition[]>(initialData?.fields || []);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      serviceOrderType: initialData?.serviceOrderType || ANY_TYPE,
      active: initialData?.active ?? true,
    },
  });

  const { register, handleSubmit, control, formState: { errors } } = form;

  const onFormSubmit = (data: TemplateFormValues) => {
    if (fields.length === 0) {
      alert("Adicione ao menos um campo ao template");
      return;
    }
    onSubmit({
      ...data,
      serviceOrderType: data.serviceOrderType === ANY_TYPE ? undefined : data.serviceOrderType,
      fields,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-orange-600" />
            Dados do Template
          </CardTitle>
          <CardDescription>Nome, tipo de OS aplicável e status</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Nome *</Label>
              <Input
                placeholder="Ex: Checklist de Instalação de Rede"
                className="h-12 rounded-2xl"
                {...register("name")}
              />
              {errors.name && <p className="text-xs font-bold text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Aplica-se a</Label>
              <Controller
                name="serviceOrderType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY_TYPE}>Qualquer tipo de OS</SelectItem>
                      <SelectItem value={ServiceOrderType.VISIT_REPORT}>Relatório de Visita</SelectItem>
                      <SelectItem value={ServiceOrderType.EXECUTION}>Execução de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-sm">Descrição</Label>
            <Input
              placeholder="Descrição opcional do template"
              className="h-12 rounded-2xl"
              {...register("description")}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            Ativo (disponível para seleção em novas OS)
          </label>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-xl">Campos do Checklist</CardTitle>
          <CardDescription>Ordem, tipo e obrigatoriedade de cada campo</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <ChecklistFieldsEditor value={fields} onChange={setFields} />
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-2 pb-12">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold"
        >
          <X className="h-5 w-5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {loading ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

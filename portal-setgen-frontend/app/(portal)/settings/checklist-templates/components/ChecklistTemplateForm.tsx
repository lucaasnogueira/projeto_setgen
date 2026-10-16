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
import { toast } from "sonner";

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
      toast.error("Adicione ao menos um campo ao template.");
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
      {/* Protocol Header Card */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-[#E2661D] border border-orange-200">
                {initialData?.id ? `TMPL-${initialData.id.slice(0, 8).toUpperCase()}` : 'TMPL-NOVO'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                Template de Checklist
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {initialData ? 'Editar Template de Checklist' : 'Novo Template de Checklist Técnico'}
            </h3>
            <p className="text-xs text-gray-500">
              Defina as seções e perguntas padronizadas carregadas automaticamente nas Ordens de Serviço e Laudos de Campo
            </p>
          </div>
        </div>
      </div>

      <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-4 py-3">
          <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-[#E2661D]" />
            Dados Básicos do Template
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">Nome identificador, tipo de OS e disponibilidade</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-4.5 space-y-3.5">
          <div className="grid md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Nome do Template <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ex: Checklist Geral de Gerador Diesel"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/30"
                {...register("name")}
              />
              {errors.name && <p className="text-xs font-semibold text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Aplica-se a</Label>
              <Controller
                name="serviceOrderType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY_TYPE} className="text-xs">Qualquer tipo de OS</SelectItem>
                      <SelectItem value={ServiceOrderType.VISIT_REPORT} className="text-xs">Relatório de Visita</SelectItem>
                      <SelectItem value={ServiceOrderType.EXECUTION} className="text-xs">Execução de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">Descrição Técnica (Opcional)</Label>
            <Input
              placeholder="Instruções gerais para os técnicos durante o preenchimento em campo..."
              className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/30"
              {...register("description")}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none pt-0.5">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="rounded border-gray-300 text-[#E2661D] focus:ring-[#E2661D]/30 w-3.5 h-3.5"
                />
              )}
            />
            Ativo (disponível para seleção imediata em novas ordens de serviço)
          </label>
        </CardContent>
      </Card>

      <Card className="border border-gray-200/80 shadow-2xs rounded-xl bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-4 py-3 rounded-t-xl">
          <CardTitle className="text-xs sm:text-sm font-bold text-gray-900">Campos e Seções do Checklist</CardTitle>
          <CardDescription className="text-xs text-gray-500">Adicione, ordene e configure perguntas técnicas ou importe de planilha Excel</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-4.5">
          <ChecklistFieldsEditor
            value={fields}
            onChange={setFields}
            templateName={form.watch("name") || "Template_Checklist"}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2.5 pt-2 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="h-9 px-6 bg-gray-900 hover:bg-black text-white rounded-lg shadow-2xs font-semibold text-xs disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {loading ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

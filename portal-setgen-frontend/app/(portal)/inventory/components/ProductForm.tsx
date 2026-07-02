"use client"

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Package, Save, X, Hash, Tag, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const productSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  currentStock: z.number().min(0, "Estoque não pode ser negativo"),
  minStock: z.number().min(0, "Estoque mínimo não pode ser negativo"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<Product> | any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      unit: initialData?.unit || 'UN',
      currentStock: Number(initialData?.currentStock) || 0,
      minStock: Number(initialData?.minStock) || 0,
    }
  });

  const { register, handleSubmit, control, formState: { errors } } = form;

  const onFormSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Informações Gerais */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md">
        <CardHeader className="bg-amber-50/50 border-b border-amber-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Tag className="h-5 w-5 text-amber-600" />
            Identificação do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-bold text-sm">Código do Produto *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  {...register("code")}
                  placeholder="Ex: PROD-001"
                  className="h-12 pl-10 rounded-2xl focus:ring-amber-500/20 border-gray-200"
                />
              </div>
              {errors.code && <p className="text-xs font-bold text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-bold text-sm">Unidade de Medida *</Label>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 rounded-2xl border-gray-200 focus:ring-amber-500/20">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade (UN)</SelectItem>
                      <SelectItem value="PC">Peça (PC)</SelectItem>
                      <SelectItem value="CX">Caixa (CX)</SelectItem>
                      <SelectItem value="KG">Quilograma (KG)</SelectItem>
                      <SelectItem value="M">Metro (M)</SelectItem>
                      <SelectItem value="L">Litro (L)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-bold text-sm">Nome do Produto *</Label>
            <Input
              {...register("name")}
              placeholder="Ex: Cabo de rede CAT6"
              className="h-12 rounded-2xl focus:ring-amber-500/20 border-gray-200"
            />
            {errors.name && <p className="text-xs font-bold text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-bold text-sm">Descrição</Label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Descrição detalhada do produto..."
              className="w-full flex min-h-[100px] rounded-2xl border border-gray-200 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Controle de Estoque */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md">
        <CardHeader className="bg-amber-50/50 border-b border-amber-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Layers className="h-5 w-5 text-amber-600" />
            Níveis de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-bold text-sm">Estoque Atual *</Label>
              <Input
                type="number"
                {...register("currentStock", { valueAsNumber: true })}
                className="h-12 rounded-2xl focus:ring-amber-500/20 border-gray-200"
              />
              {errors.currentStock && <p className="text-xs font-bold text-red-500">{errors.currentStock.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-bold text-sm">Estoque Mínimo *</Label>
              <div className="space-y-1">
                <Input
                  type="number"
                  {...register("minStock", { valueAsNumber: true })}
                  className="h-12 rounded-2xl focus:ring-amber-500/20 border-gray-200"
                />
                <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <AlertCircle className="h-3 w-3" />
                  Alerta quando o estoque atingir este valor
                </div>
              </div>
              {errors.minStock && <p className="text-xs font-bold text-red-500">{errors.minStock.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-4 pt-4 pb-12">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-14 rounded-2xl border-2 hover:bg-gray-50 flex items-center justify-center gap-2 font-bold text-gray-600 transition-all active:scale-95"
        >
          <X className="h-5 w-5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-14 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-2xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

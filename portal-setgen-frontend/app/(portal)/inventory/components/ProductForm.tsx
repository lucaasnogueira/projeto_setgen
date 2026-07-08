"use client"

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Hash, Tag, Layers, AlertCircle, Plus, MapPin, Barcode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Product, StockLocation } from "@/types";
import { stockLocationsApi } from "@/lib/api/stock-locations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { StepRail, StepFooter, type WizardStep } from "@/components/ui/step-wizard";

const productSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  barcode: z.string().optional(),
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
      barcode: initialData?.barcode || '',
      currentStock: Number(initialData?.currentStock) || 0,
      minStock: Number(initialData?.minStock) || 0,
    }
  });

  const { register, handleSubmit, control, formState: { errors } } = form;

  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [locationId, setLocationId] = useState(initialData?.locationId || '');
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [newLocationCode, setNewLocationCode] = useState('');
  const [creatingLocation, setCreatingLocation] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = () => {
    stockLocationsApi.getAll().then(setLocations).catch((error) => console.error('Erro ao carregar localizações:', error));
  };

  const handleCreateLocation = async () => {
    if (!newLocationCode.trim()) return;
    setCreatingLocation(true);
    try {
      const created = await stockLocationsApi.create({ code: newLocationCode.trim() });
      setLocations((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
      setLocationId(created.id);
      setNewLocationCode('');
      setIsLocationDialogOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cadastrar localização');
    } finally {
      setCreatingLocation(false);
    }
  };

  type StepKey = "identificacao" | "estoque";
  const [activeStep, setActiveStep] = useState<StepKey>("identificacao");
  const stepDefs: WizardStep[] = [
    { key: "identificacao", label: "Identificação" },
    { key: "estoque", label: "Estoque" },
  ];

  const onFormSubmit = async (data: ProductFormValues) => {
    await onSubmit({
      ...data,
      barcode: data.barcode || undefined,
      locationId: locationId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      {/* Informações Gerais */}
      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md", activeStep !== "identificacao" && "hidden")}>
        <CardHeader className="bg-amber-50/50 border-b border-amber-100">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Tag className="h-5 w-5 text-amber-600" />
            Identificação do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground font-bold text-sm">Código do Produto *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  {...register("code")}
                  placeholder="Ex: PROD-001"
                  className="h-12 pl-10 rounded-2xl focus:ring-amber-500/20 border-border"
                />
              </div>
              {errors.code && <p className="text-xs font-bold text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-bold text-sm">Unidade de Medida *</Label>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 rounded-2xl border-border focus:ring-amber-500/20">
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
            <Label className="text-foreground font-bold text-sm">Nome do Produto *</Label>
            <Input
              {...register("name")}
              placeholder="Ex: Cabo de rede CAT6"
              className="h-12 rounded-2xl focus:ring-amber-500/20 border-border"
            />
            {errors.name && <p className="text-xs font-bold text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-bold text-sm">Descrição</Label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Descrição detalhada do produto..."
              className="w-full flex min-h-[100px] rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground font-bold text-sm">Código de Barras</Label>
              <div className="relative">
                <Barcode className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  {...register("barcode")}
                  placeholder="7891234567890"
                  className="h-12 pl-10 rounded-2xl focus:ring-amber-500/20 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-bold text-sm">Localização</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="h-12 w-full pl-10 pr-3 rounded-2xl border border-border bg-background text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.code}</option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 rounded-2xl shrink-0"
                  onClick={() => setIsLocationDialogOpen(true)}
                  title="Cadastrar nova localização"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Localização</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Código do Local</Label>
            <Input
              value={newLocationCode}
              onChange={(e) => setNewLocationCode(e.target.value.toUpperCase())}
              placeholder="Ex: A-3"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCreateLocation} disabled={creatingLocation || !newLocationCode.trim()}>
              {creatingLocation ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Controle de Estoque */}
      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md", activeStep !== "estoque" && "hidden")}>
        <CardHeader className="bg-amber-50/50 border-b border-amber-100">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Layers className="h-5 w-5 text-amber-600" />
            Níveis de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground font-bold text-sm">Estoque Atual *</Label>
              <Input
                type="number"
                {...register("currentStock", { valueAsNumber: true })}
                className="h-12 rounded-2xl focus:ring-amber-500/20 border-border"
              />
              {errors.currentStock && <p className="text-xs font-bold text-red-500">{errors.currentStock.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-bold text-sm">Estoque Mínimo *</Label>
              <div className="space-y-1">
                <Input
                  type="number"
                  {...register("minStock", { valueAsNumber: true })}
                  className="h-12 rounded-2xl focus:ring-amber-500/20 border-border"
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

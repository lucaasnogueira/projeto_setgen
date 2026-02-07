"use client"

import { useState } from 'react';
import { Package, Save, X, Hash, Tag, Info, Layers, AlertCircle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/types";

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
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    unit: initialData?.unit || 'UN',
    currentStock: initialData?.currentStock?.toString() || '',
    minStock: initialData?.minStock?.toString() || '',
    unitPrice: initialData?.unitPrice?.toString() || '',
    unitsPerPackage: initialData?.unitsPerPackage?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      currentStock: parseInt(formData.currentStock),
      minStock: parseInt(formData.minStock),
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
      unitsPerPackage: formData.unitsPerPackage ? parseInt(formData.unitsPerPackage) : undefined,
    };
    onSubmit(payload);
  };

  const packagePrice = formData.unitPrice && formData.unitsPerPackage 
    ? parseFloat(formData.unitPrice) * parseInt(formData.unitsPerPackage)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Gerais */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Tag className="h-5 w-5 text-amber-600" />
            Identificação do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Código do Produto <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: PROD-001"
                  className="h-11 pl-10 rounded-xl focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Unidade de Medida <span className="text-red-500">*</span></Label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                <option value="UN">Unidade (UN)</option>
                <option value="PC">Peça (PC)</option>
                <option value="CX">Caixa (CX)</option>
                <option value="KG">Quilograma (KG)</option>
                <option value="M">Metro (M)</option>
                <option value="L">Litro (L)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Nome do Produto <span className="text-red-500">*</span></Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cabo de rede CAT6"
              className="h-11 rounded-xl focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Descrição</Label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Descrição detalhada do produto..."
              className="w-full flex min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Controle de Estoque */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Layers className="h-5 w-5 text-amber-600" />
            Níveis de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Estoque Atual <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                min="0"
                placeholder="0"
                className="h-11 rounded-xl focus:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Estoque Mínimo <span className="text-red-500">*</span></Label>
              <div className="space-y-1">
                <Input
                  type="number"
                  required
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  min="0"
                  placeholder="0"
                  className="h-11 rounded-xl focus:ring-amber-500"
                />
                <div className="flex items-center gap-1 text-xs text-gray-500 italic">
                  <AlertCircle className="h-3 w-3" />
                  Alerta quando o estoque atingir este valor
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Precificação */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <DollarSign className="h-5 w-5 text-amber-600" />
            Precificação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Preço Unitário</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-medium">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0,00"
                  className="h-11 pl-10 rounded-xl focus:ring-amber-500"
                />
              </div>
              <p className="text-xs text-gray-500 italic">Preço de venda por unidade</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Unidades por Caixa/Embalagem</Label>
              <Input
                type="number"
                min="1"
                value={formData.unitsPerPackage}
                onChange={(e) => setFormData({ ...formData, unitsPerPackage: e.target.value })}
                placeholder="Ex: 12"
                className="h-11 rounded-xl focus:ring-amber-500"
              />
              <p className="text-xs text-gray-500 italic">Quantidade de unidades em uma caixa</p>
            </div>
          </div>

          {packagePrice && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Preço por Caixa</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.unitsPerPackage} unidades × {parseFloat(formData.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {packagePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl border-2 hover:bg-gray-50 flex items-center justify-center gap-2 font-bold text-gray-600 transition-all active:scale-95"
        >
          <X className="h-5 w-5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-2xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

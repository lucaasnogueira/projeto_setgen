"use client"

import { useState, useEffect } from 'react';
import { clientsApi } from '@/lib/api/clients';
import { FileText, Save, X, User, Briefcase, Calendar, Info, Layers, Tag, Trash2, Plus, DollarSign } from 'lucide-react';
import { ServiceOrderType, ServiceOrder } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryApi } from '@/lib/api/inventory';

interface ServiceOrderFormProps {
  initialData?: Partial<ServiceOrder>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function ServiceOrderForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: ServiceOrderFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || '',
    type: initialData?.type || ServiceOrderType.VISIT_REPORT,
    scope: initialData?.scope || '',
    reportedDefects: initialData?.reportedDefects || '',
    requestedServices: initialData?.requestedServices || '',
    notes: initialData?.notes || '',
    deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
  });

  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>(initialData?.items?.map(i => ({
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    name: i.product?.name,
    code: i.product?.code
  })) || []);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');

  useEffect(() => {
    loadClients();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await inventoryApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    };
    onSubmit(payload);
  };

  const addItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (items.some(i => i.productId === selectedProductId)) {
      alert('Este produto já foi adicionado');
      return;
    }

    setItems([...items, {
      productId: product.id,
      name: product.name,
      code: product.code,
      quantity: parseInt(itemQuantity),
      unitPrice: product.unitCost || 0
    }]);

    setSelectedProductId('');
    setItemQuantity('1');
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card de Informações Básicas */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Info className="h-5 w-5 text-blue-600" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Tipo de OS <span className="text-red-500">*</span></Label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ServiceOrderType })}
                className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <option value={ServiceOrderType.VISIT_REPORT}>Relatório de Visita</option>
                <option value={ServiceOrderType.EXECUTION}>Execução de Serviço</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Cliente <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full flex h-11 rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card do Escopo */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Detalhes do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Defeitos Relatados</Label>
            <textarea
              value={formData.reportedDefects}
              onChange={(e) => setFormData({ ...formData, reportedDefects: e.target.value })}
              rows={3}
              placeholder="Descreva os problemas relatados pelo cliente..."
              className="w-full flex min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Serviços Solicitados</Label>
            <textarea
              value={formData.requestedServices}
              onChange={(e) => setFormData({ ...formData, requestedServices: e.target.value })}
              rows={3}
              placeholder="Liste as ações e serviços a serem realizados..."
              className="w-full flex min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Escopo do Serviço <span className="text-red-500">*</span></Label>
            <textarea
              required
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              rows={4}
              placeholder="Descrição geral do que será feito..."
              className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Observações Importantes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Urgência, restrições, histórico ou outros detalhes..."
              className="w-full flex min-h-[60px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Prazo de Execução</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="h-11 pl-10 rounded-xl focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Materiais e Produtos */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Layers className="h-5 w-5 text-blue-600" />
            Materiais e Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-gray-700 font-semibold">Adicionar Produto do Estoque</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full flex h-11 rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <option value="">Selecione um produto</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.code} - {prod.name} (Disponível: {prod.currentStock})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-full md:w-32 space-y-2">
              <Label className="text-gray-700 font-semibold">Qtd</Label>
              <Input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button 
              type="button" 
              onClick={addItem}
              className="h-11 bg-blue-100 text-blue-600 hover:bg-blue-200 border-none rounded-xl font-bold flex items-center gap-2 px-6"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="border rounded-2xl overflow-hidden bg-gray-50/30">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100/50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cód</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Qtd</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">V. Unit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 italic text-sm">
                      Nenhum material adicionado ainda.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-600">{item.code}</td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-800">{item.name}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700 font-semibold">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">
                        {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-blue-600 font-bold">
                        {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          type="button" 
                          onClick={() => removeItem(item.productId)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-blue-50/50">
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-right font-bold text-gray-700">Custo Total de Materiais:</td>
                    <td className="py-4 px-4 text-right text-lg font-black text-blue-700">
                      {items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
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
          className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

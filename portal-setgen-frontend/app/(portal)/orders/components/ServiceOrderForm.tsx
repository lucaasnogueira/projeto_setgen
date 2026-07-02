"use client"

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clientsApi } from '@/lib/api/clients';
import { FileText, Save, X, User, Briefcase, Calendar, Info, Layers, Tag, Trash2, Plus, DollarSign, Loader2, ClipboardCheck, Camera } from 'lucide-react';
import { ServiceOrderType, ServiceOrder, ChecklistTemplate, ChecklistAnswerItem, ChecklistFieldType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { inventoryApi } from '@/lib/api/inventory';
import { checklistTemplatesApi } from '@/lib/api/checklist-templates';
import { ordersApi } from '@/lib/api/orders';

const SignaturePad = dynamic(
  () => import('./SignaturePad').then((m) => m.SignaturePad),
  { ssr: false },
);

const NONE = '__none__';

const fieldTypeLabels: Record<ChecklistFieldType, string> = {
  [ChecklistFieldType.TEXT]: 'Texto',
  [ChecklistFieldType.NUMBER]: 'Número',
  [ChecklistFieldType.PHOTO]: 'Foto',
  [ChecklistFieldType.SIGNATURE]: 'Assinatura',
  [ChecklistFieldType.BOOLEAN]: 'Sim/Não',
  [ChecklistFieldType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
};

const serviceOrderSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  type: z.nativeEnum(ServiceOrderType),
  scope: z.string().min(10, "Descreva o escopo com no mínimo 10 caracteres"),
  reportedDefects: z.string().optional(),
  requestedServices: z.string().optional(),
  notes: z.string().optional(),
  deadline: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Data inválida"),
  checklistTemplateId: z.string().optional(),
});

type ServiceOrderFormValues = z.infer<typeof serviceOrderSchema>;

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

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [checklistAnswers, setChecklistAnswers] = useState<ChecklistAnswerItem[]>(
    initialData?.checklist || []
  );
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [knownAttachments, setKnownAttachments] = useState<string[]>(initialData?.attachments || []);

  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      clientId: initialData?.clientId || '',
      type: initialData?.type || ServiceOrderType.VISIT_REPORT,
      scope: initialData?.scope || '',
      reportedDefects: initialData?.reportedDefects || '',
      requestedServices: initialData?.requestedServices || '',
      notes: initialData?.notes || '',
      deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
      checklistTemplateId: initialData?.checklistTemplateId || NONE,
    }
  });

  const { register, handleSubmit, control, watch, formState: { errors } } = form;
  const watchedType = watch('type');

  useEffect(() => {
    loadClients();
    loadProducts();
  }, []);

  useEffect(() => {
    if (initialData) return; // seleção de template só faz sentido na criação
    checklistTemplatesApi.getAll(watchedType, true).then(setTemplates).catch(() => setTemplates([]));
  }, [watchedType, initialData]);

  const updateAnswer = (index: number, patch: Partial<ChecklistAnswerItem>) => {
    setChecklistAnswers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const uploadChecklistFile = async (index: number, file: File) => {
    if (!initialData?.id) return;
    setUploadingFieldId(checklistAnswers[index].id);
    try {
      const before = new Set(knownAttachments);
      const updated = await ordersApi.uploadAttachments(initialData.id, [file]);
      const newAttachments = updated.attachments || [];
      const newPath = newAttachments.find((p) => !before.has(p));
      setKnownAttachments(newAttachments);
      updateAnswer(index, { answer: newPath || null, completed: true });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao enviar arquivo');
    } finally {
      setUploadingFieldId(null);
    }
  };

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

  const onFormSubmit = (data: ServiceOrderFormValues) => {
    const payload: any = {
      ...data,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      })),
    };

    if (!initialData) {
      payload.checklistTemplateId = data.checklistTemplateId && data.checklistTemplateId !== NONE
        ? data.checklistTemplateId
        : undefined;
    } else {
      delete payload.checklistTemplateId;
      payload.checklist = checklistAnswers;
    }

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-blue-600" />
            Informações da Ordem
          </CardTitle>
          <CardDescription>Defina o tipo de serviço e o cliente responsável</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Tipo de OS *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 rounded-2xl bg-background border-gray-200">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ServiceOrderType.VISIT_REPORT}>Relatório de Visita</SelectItem>
                      <SelectItem value={ServiceOrderType.EXECUTION}>Execução de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-xs font-bold text-red-500">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Cliente *</Label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-12 rounded-2xl bg-background border-gray-200">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientId && <p className="text-xs font-bold text-red-500">{errors.clientId.message}</p>}
            </div>
          </div>

          {!initialData && (
            <div className="space-y-2">
              <Label className="font-bold text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                Template de Checklist
              </Label>
              <Controller
                name="checklistTemplateId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 rounded-2xl bg-background border-gray-200">
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhum</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Escopo e Detalhamento
          </CardTitle>
          <CardDescription>Descreva tecnicamente o que será realizado</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Defeitos Relatados</Label>
              <textarea
                className="w-full flex min-h-[100px] rounded-2xl border border-gray-200 bg-background px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="Problemas informados pelo cliente..."
                {...register('reportedDefects')}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Serviços Solicitados</Label>
              <textarea
                className="w-full flex min-h-[100px] rounded-2xl border border-gray-200 bg-background px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="Ações específicas solicitadas..."
                {...register('requestedServices')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-sm">Escopo do Serviço *</Label>
            <textarea
              className="w-full flex min-h-[120px] rounded-2xl border border-gray-200 bg-background px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="Descrição técnica detalhada do trabalho..."
              {...register('scope')}
            />
            {errors.scope && <p className="text-xs font-bold text-red-500">{errors.scope.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Prazo de Execução</Label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600" />
                <Input
                  type="date"
                  className="h-12 pl-10 rounded-2xl border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                  {...register('deadline')}
                />
              </div>
              {errors.deadline && <p className="text-xs font-bold text-red-500">{errors.deadline.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-sm">Observações Internas</Label>
              <Input
                placeholder="Notas para a equipe técnica..."
                className="h-12 rounded-2xl border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                {...register('notes')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Layers className="h-5 w-5 text-blue-600" />
            Materiais e Estoque
          </CardTitle>
          <CardDescription>Produtos que serão utilizados na OS</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50/50 p-6 rounded-2xl border border-dashed">
            <div className="flex-1 space-y-2">
              <Label className="font-bold text-sm">Produto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-12 rounded-2xl bg-white">
                  <SelectValue placeholder="Selecione um produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(prod => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.code} - {prod.name} (Qtd: {prod.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-32 space-y-2">
              <Label className="font-bold text-sm">Qtd</Label>
              <Input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="h-12 rounded-2xl bg-white"
              />
            </div>
            <Button 
              type="button" 
              onClick={addItem}
              className="h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold flex items-center gap-2 px-8 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">Cód</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase">Produto</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-muted-foreground uppercase">Qtd</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-muted-foreground uppercase">V. Unit</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-muted-foreground uppercase">Total</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground italic text-sm">
                      Nenhum material adicionado ainda.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-muted-foreground">{item.code}</td>
                      <td className="py-4 px-6 text-sm font-bold">{item.name}</td>
                      <td className="py-4 px-6 text-sm text-right font-semibold">{item.quantity}</td>
                      <td className="py-4 px-6 text-sm text-right">
                        {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-4 px-6 text-sm text-right text-blue-600 font-bold">
                        {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          type="button" 
                          onClick={() => removeItem(item.productId)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-muted/30">
                  <tr>
                    <td colSpan={4} className="py-5 px-6 text-right font-bold text-muted-foreground">Total de Materiais:</td>
                    <td className="py-5 px-6 text-right text-lg font-black text-blue-600">
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

      {checklistAnswers.length > 0 && (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              Checklist
            </CardTitle>
            <CardDescription>
              {initialData?.checklistTemplate
                ? `Template: ${initialData.checklistTemplate.name}`
                : 'Preencha as respostas do checklist'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {checklistAnswers.map((item, index) => {
              // Shape legado (pré-templates): { item, completed }, sem type
              if (!item.type) {
                return (
                  <label key={item.id ?? index} className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50/50">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => updateAnswer(index, { completed: e.target.checked })}
                    />
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                      {item.item}
                    </span>
                  </label>
                );
              }

              return (
                <div key={item.id} className="p-5 rounded-2xl border bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="font-bold text-sm">
                      {item.label}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                      <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                        {fieldTypeLabels[item.type]}
                      </span>
                    </Label>
                    <label className="flex items-center gap-2 text-xs font-semibold shrink-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => updateAnswer(index, { completed: e.target.checked })}
                      />
                      Concluído
                    </label>
                  </div>

                  {item.type === ChecklistFieldType.TEXT && (
                    <Input
                      value={(item.answer as string) || ''}
                      onChange={(e) => updateAnswer(index, { answer: e.target.value })}
                      className="h-11 rounded-xl bg-white"
                    />
                  )}

                  {item.type === ChecklistFieldType.NUMBER && (
                    <Input
                      type="number"
                      value={item.answer === null ? '' : String(item.answer)}
                      onChange={(e) => updateAnswer(index, { answer: e.target.value === '' ? null : Number(e.target.value) })}
                      className="h-11 rounded-xl bg-white"
                    />
                  )}

                  {item.type === ChecklistFieldType.BOOLEAN && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={item.answer === true ? 'default' : 'outline'}
                        className="rounded-xl"
                        onClick={() => updateAnswer(index, { answer: true })}
                      >
                        Sim
                      </Button>
                      <Button
                        type="button"
                        variant={item.answer === false ? 'default' : 'outline'}
                        className="rounded-xl"
                        onClick={() => updateAnswer(index, { answer: false })}
                      >
                        Não
                      </Button>
                    </div>
                  )}

                  {item.type === ChecklistFieldType.MULTIPLE_CHOICE && (
                    <Select
                      value={(item.answer as string) || undefined}
                      onValueChange={(v) => updateAnswer(index, { answer: v })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(item.options || []).map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.type === ChecklistFieldType.PHOTO && (
                    <div className="space-y-2">
                      {item.answer && (
                        <img src={String(item.answer)} alt="Foto enviada" className="h-24 rounded-xl border object-cover" />
                      )}
                      <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border bg-white cursor-pointer text-sm font-semibold hover:bg-gray-50">
                        {uploadingFieldId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        {item.answer ? 'Trocar foto' : 'Enviar foto'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={!initialData?.id || uploadingFieldId !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadChecklistFile(index, file);
                          }}
                        />
                      </label>
                      {!initialData?.id && (
                        <p className="text-xs text-muted-foreground">Salve a OS antes de anexar fotos.</p>
                      )}
                    </div>
                  )}

                  {item.type === ChecklistFieldType.SIGNATURE && (
                    <div className="space-y-2">
                      {item.answer ? (
                        <img src={String(item.answer)} alt="Assinatura" className="h-24 rounded-xl border bg-white" />
                      ) : initialData?.id ? (
                        <SignaturePad
                          onSave={(blob) => uploadChecklistFile(index, new File([blob], 'assinatura.png', { type: 'image/png' }))}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">Salve a OS antes de coletar a assinatura.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 pt-6 pb-12">
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
          className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

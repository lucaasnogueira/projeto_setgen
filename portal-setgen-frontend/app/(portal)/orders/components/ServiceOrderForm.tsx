"use client"

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, Layers, Trash2, Plus, Loader2, ClipboardCheck, Camera, Users as UsersIcon } from 'lucide-react';
import { ServiceOrder, ChecklistTemplate, ChecklistAnswerItem, ChecklistFieldType } from '@/types';
import { usersApi, User as ApiUser } from '@/lib/api/users';
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
import { cn } from '@/lib/utils';
import { toDateInputValue, endOfBusinessDayISO } from '@/lib/date';
import { StepRail, StepFooter, type WizardStep } from '@/components/ui/step-wizard';

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

interface ServiceOrderFormProps {
  /** Obrigatório ao gerar uma OS nova — o orçamento (ACCEPTED) de origem. */
  quoteId?: string;
  initialData?: Partial<ServiceOrder>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function ServiceOrderForm({
  quoteId,
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: ServiceOrderFormProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  // Campos Decimal do Prisma chegam como string no JSON — sem o Number() a
  // formatação de moeda vira no-op (String.toLocaleString ignora as opções) e
  // o preço aparece cru, tipo "12.5" em vez de "R$ 12,50".
  const [items, setItems] = useState<any[]>(initialData?.items?.map(i => ({
    productId: i.productId,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    name: i.product?.name,
    code: i.product?.code
  })) || []);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');

  const [deadline, setDeadline] = useState(toDateInputValue(initialData?.deadline));
  const [responsibleIds, setResponsibleIds] = useState<string[]>(initialData?.responsibleIds || []);
  const [team, setTeam] = useState<string>((initialData?.requiredResources?.team || []).join(', '));

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [checklistTemplateId, setChecklistTemplateId] = useState(initialData?.checklistTemplateId || NONE);
  const [checklistAnswers, setChecklistAnswers] = useState<ChecklistAnswerItem[]>(initialData?.checklist || []);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);
  const [knownAttachments, setKnownAttachments] = useState<string[]>(initialData?.attachments || []);

  type StepKey = 'geral' | 'materiais' | 'checklist';
  const [activeStep, setActiveStep] = useState<StepKey>('geral');
  const stepDefs: WizardStep[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'materiais', label: 'Materiais' },
    ...(checklistAnswers.length > 0 || (!initialData && templates.length > 0) ? [{ key: 'checklist', label: 'Checklist' }] : []),
  ];

  useEffect(() => {
    loadProducts();
    usersApi.getSelectable().then(setUsers).catch(() => setUsers([]));
    if (!initialData) {
      checklistTemplatesApi.getAll(undefined, true).then(setTemplates).catch(() => setTemplates([]));
    }
  }, []);

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

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      // Prazo vale até o fim do dia escolhido, no fuso da operação.
      deadline: endOfBusinessDayISO(deadline),
      responsibleIds,
      requiredResources: {
        team: team.split(',').map((t) => t.trim()).filter(Boolean),
      },
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      })),
    };

    if (!initialData) {
      payload.quoteId = quoteId;
      payload.checklistTemplateId = checklistTemplateId !== NONE ? checklistTemplateId : undefined;
    } else {
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

    // Campo vazio vira NaN no parseInt e o backend recebe null — barra aqui.
    const quantity = parseInt(itemQuantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1) {
      alert('Informe uma quantidade inteira maior que zero');
      return;
    }

    setItems([...items, {
      productId: product.id,
      name: product.name,
      code: product.code,
      quantity,
      unitPrice: Number(product.unitCost) || 0
    }]);

    setSelectedProductId('');
    setItemQuantity('1');
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const toggleResponsible = (userId: string) => {
    setResponsibleIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      <Card className={cn('border-none shadow-xl rounded-3xl overflow-hidden', activeStep !== 'geral' && 'hidden')}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-blue-600" />
            Planejamento da Execução
          </CardTitle>
          <CardDescription>Prazo, equipe e ferramentas necessárias</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Prazo de Execução</Label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600" />
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-12 pl-10 rounded-2xl border-border focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Ferramentas Necessárias</Label>
              <Input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Ex: escada, multímetro, chave de torque"
                className="h-12 rounded-2xl border-border focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-sm flex items-center gap-2"><UsersIcon className="h-4 w-4" />Equipe Responsável</Label>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleResponsible(u.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl border text-sm font-semibold transition-all',
                    responsibleIds.includes(u.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-background border-border text-muted-foreground hover:border-blue-300'
                  )}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {!initialData && (
            <div className="space-y-2">
              <Label className="font-bold text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                Template de Checklist
              </Label>
              <Select value={checklistTemplateId} onValueChange={setChecklistTemplateId}>
                <SelectTrigger className="h-12 rounded-2xl bg-background border-border">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn('border-none shadow-xl rounded-3xl overflow-hidden', activeStep !== 'materiais' && 'hidden')}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Layers className="h-5 w-5 text-blue-600" />
            Materiais e Estoque
          </CardTitle>
          <CardDescription>Produtos previstos para a execução — alimenta a solicitação ao almoxarifado</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/50 p-6 rounded-2xl border border-dashed">
            <div className="flex-1 space-y-2">
              <Label className="font-bold text-sm">Produto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-12 rounded-2xl bg-card">
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
                className="h-12 rounded-2xl bg-card"
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
            <table className="w-full border-collapse bg-card">
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
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
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
        <Card className={cn('border-none shadow-xl rounded-3xl overflow-hidden', activeStep !== 'checklist' && 'hidden')}>
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
              if (!item.type) {
                return (
                  <label key={item.id ?? index} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/50">
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
                <div key={item.id} className="p-5 rounded-2xl border bg-muted/50 space-y-3">
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
                      className="h-11 rounded-xl bg-card"
                    />
                  )}

                  {item.type === ChecklistFieldType.NUMBER && (
                    <Input
                      type="number"
                      value={item.answer === null ? '' : String(item.answer)}
                      onChange={(e) => updateAnswer(index, { answer: e.target.value === '' ? null : Number(e.target.value) })}
                      className="h-11 rounded-xl bg-card"
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
                      <SelectTrigger className="h-11 rounded-xl bg-card">
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
                      <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border bg-card cursor-pointer text-sm font-semibold hover:bg-muted">
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
                        <img src={String(item.answer)} alt="Assinatura" className="h-24 rounded-xl border bg-card" />
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

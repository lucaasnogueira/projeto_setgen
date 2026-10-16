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
import { SERVICE_ORDER_STATUS_CONFIG } from '@/lib/status-config';
import { useCanViewValues } from '@/lib/permissions';

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
  [ChecklistFieldType.CHECKLIST_TRI_STATE]: 'Checklist (OK/NÃO/N/A)',
  [ChecklistFieldType.SINGLE_CHOICE]: 'Seleção Única',
  [ChecklistFieldType.DATE]: 'Data',
  [ChecklistFieldType.CALCULATED]: 'Calculado',
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
  const canViewValues = useCanViewValues();
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
    <form onSubmit={onFormSubmit} className="space-y-5">
      {/* Topo do Formulário com Protocolo e Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
              {initialData?.orderNumber ? initialData.orderNumber : 'OS-2026-NOVA'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              {initialData?.status ? (SERVICE_ORDER_STATUS_CONFIG[initialData.status]?.label ?? initialData.status) : 'Minuta / Rascunho'}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {initialData ? `Edição da Ordem de Serviço ${initialData.orderNumber}` : 'Abertura de O.S. Preventiva / Campo'}
          </h3>
          <p className="text-xs text-gray-400">
            {quoteId ? `Vinculada ao Orçamento Comercial #${quoteId}` : 'Programação técnica, equipe e requisição de materiais'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-8 px-3 text-xs rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-8 px-4 text-xs rounded-lg bg-gray-900 hover:bg-black text-white font-medium shadow-2xs"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            {submitLabel}
          </Button>
        </div>
      </div>

      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      {/* ABA 1: GERAL */}
      <Card className={cn('border border-gray-200 shadow-2xs rounded-xl overflow-hidden bg-white', activeStep !== 'geral' && 'hidden')}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <Calendar className="h-3.5 w-3.5 text-[#E2661D]" />
            1. Planejamento da Execução & Prazo
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">
            Defina o prazo de atendimento, ferramentas necessárias e técnicos de campo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs text-gray-700">Prazo de Execução *</Label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-9 pl-9 text-xs rounded-lg border-gray-200 bg-white focus:border-gray-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-xs text-gray-700">Ferramentas & Recursos de Campo</Label>
              <Input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Ex: multímetro calib., torquímetro, bomba de vácuo, EPIs NR-10"
                className="h-9 text-xs rounded-lg border-gray-200 bg-white focus:border-gray-900"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-xs text-gray-700 flex items-center gap-1.5">
                <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
                Equipe Técnica Responsável
              </Label>
              <span className="text-[11px] text-gray-400">{responsibleIds.length} selecionado(s)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleResponsible(u.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5',
                    responsibleIds.includes(u.id)
                      ? 'bg-[#E2661D] border-[#E2661D] text-white shadow-2xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                  )}
                >
                  <span>{u.name}</span>
                  {responsibleIds.includes(u.id) && <span className="text-[10px] opacity-80">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {!initialData && (
            <div className="space-y-1.5 pt-1">
              <Label className="font-semibold text-xs text-gray-700 flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-[#E2661D]" />
                Template de Checklist de Atendimento
              </Label>
              <Select value={checklistTemplateId} onValueChange={setChecklistTemplateId}>
                <SelectTrigger className="h-9 text-xs rounded-lg bg-white border-gray-200">
                  <SelectValue placeholder="Nenhum (Checklist Padrão)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum (Checklist Padrão)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ABA 2: MATERIAIS */}
      <Card className={cn('border border-gray-200 shadow-2xs rounded-xl overflow-hidden bg-white', activeStep !== 'materiais' && 'hidden')}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <Layers className="h-3.5 w-3.5 text-[#E2661D]" />
            2. Materiais & Requisição de Peças do Almoxarifado
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">
            Insumos previstos para a execução — alimenta a solicitação automática ao almoxarifado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-end bg-gray-50/80 p-4 rounded-xl border border-gray-200">
            <div className="flex-1 space-y-1.5">
              <Label className="font-semibold text-xs text-gray-700">Peça / Insumo em Estoque</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-9 text-xs rounded-lg bg-white border-gray-200">
                  <SelectValue placeholder="Selecione um item do estoque Setgen..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(prod => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.code} • {prod.name} (Disponível: {prod.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-28 space-y-1.5">
              <Label className="font-semibold text-xs text-gray-700">Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="h-9 text-xs rounded-lg bg-white border-gray-200 text-center"
              />
            </div>
            <Button
              type="button"
              onClick={addItem}
              className="h-9 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 px-4 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full border-collapse bg-white text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500 uppercase text-[10px]">Cód SKU</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-500 uppercase text-[10px]">Produto / Insumo</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-gray-500 uppercase text-[10px]">Qtd</th>
                  {canViewValues && <th className="text-right py-2.5 px-4 font-semibold text-gray-500 uppercase text-[10px]">V. Unit</th>}
                  {canViewValues && <th className="text-right py-2.5 px-4 font-semibold text-gray-500 uppercase text-[10px]">Total</th>}
                  <th className="w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={canViewValues ? 6 : 4} className="py-8 text-center text-gray-400 italic text-xs">
                      Nenhum material adicionado ainda para esta ordem de serviço.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{item.code}</td>
                      <td className="py-2.5 px-4 font-medium text-gray-800">{item.name}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{item.quantity}</td>
                      {canViewValues && (
                        <td className="py-2.5 px-4 text-right text-gray-600 font-mono">
                          {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      )}
                      {canViewValues && (
                        <td className="py-2.5 px-4 text-right font-bold text-gray-900 font-mono">
                          {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      )}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Remover material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {items.length > 0 && canViewValues && (
                <tfoot className="bg-gray-50/80 border-t border-gray-100">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-right font-bold text-gray-600">Total de Materiais:</td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-gray-900 font-mono">
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

      {/* ABA 3: CHECKLIST */}
      {checklistAnswers.length > 0 && (
        <Card className={cn('border border-gray-200 shadow-2xs rounded-xl overflow-hidden bg-white', activeStep !== 'checklist' && 'hidden')}>
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
              <ClipboardCheck className="h-3.5 w-3.5 text-[#E2661D]" />
              3. Checklist Técnico de Campo
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              {initialData?.checklistTemplate
                ? `Template: ${initialData.checklistTemplate.name}`
                : 'Preencha as respostas do checklist'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
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
                <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="font-bold text-xs text-gray-900">
                      {item.label}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                      <span className="ml-2 text-[10px] font-bold text-[#E2661D] bg-orange-50 px-2 py-0.5 rounded-full uppercase border border-orange-100">
                        {fieldTypeLabels[item.type]}
                      </span>
                    </Label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => updateAnswer(index, { completed: e.target.checked })}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                      />
                      Concluído
                    </label>
                  </div>

                  {item.type === ChecklistFieldType.TEXT && (
                    <Input
                      value={(item.answer as string) || ''}
                      onChange={(e) => updateAnswer(index, { answer: e.target.value })}
                      className="h-9 text-xs rounded-lg bg-white border-gray-200"
                    />
                  )}

                  {item.type === ChecklistFieldType.NUMBER && (
                    <Input
                      type="number"
                      value={item.answer === null ? '' : String(item.answer)}
                      onChange={(e) => updateAnswer(index, { answer: e.target.value === '' ? null : Number(e.target.value) })}
                      className="h-9 text-xs rounded-lg bg-white border-gray-200"
                    />
                  )}

                  {item.type === ChecklistFieldType.BOOLEAN && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={item.answer === true ? 'default' : 'outline'}
                        className={cn(
                          "h-8 px-4 text-xs rounded-lg font-semibold",
                          item.answer === true ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-gray-200 text-gray-700"
                        )}
                        onClick={() => updateAnswer(index, { answer: true })}
                      >
                        Sim
                      </Button>
                      <Button
                        type="button"
                        variant={item.answer === false ? 'default' : 'outline'}
                        className={cn(
                          "h-8 px-4 text-xs rounded-lg font-semibold",
                          item.answer === false ? "bg-gray-900 hover:bg-black text-white" : "border-gray-200 text-gray-700"
                        )}
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

"use client"

import { useState } from 'react';
import { QuoteLine, QuoteLineType, ItemBillingType } from '@/types';
import { quotesApi } from '@/lib/api/quotes';
import { Plus, Trash2, Receipt, Pencil, Check, X, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const QUOTE_LINE_TYPE_LABELS: Record<QuoteLineType, string> = {
  SERVICE: 'Serviço',
  MATERIAL: 'Material',
  LABOR_HOUR: 'Hora Técnica',
  TRAVEL: 'Deslocamento',
  ADDITIONAL_COST: 'Custo Adicional',
};

interface QuoteLineEditorProps {
  quoteId: string;
  lines: QuoteLine[];
  editable: boolean;
  onChange: (lines: QuoteLine[]) => void;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const emptyForm = {
  type: QuoteLineType.SERVICE,
  description: '',
  quantity: '1',
  unitValue: '0',
  discount: '0',
  billingType: ItemBillingType.BILLED_SEPARATELY,
};

export function QuoteLineEditor({ quoteId, lines, editable, onChange }: QuoteLineEditorProps) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const total = lines.reduce((acc, l) => acc + Number(l.totalValue), 0);

  /** Desconto é absoluto e o backend recusa acima do subtotal — avisa antes de ir. */
  const validate = () => {
    if (!form.description.trim()) return 'Descrição é obrigatória';

    const quantity = Number(form.quantity);
    const unitValue = Number(form.unitValue);
    const discount = Number(form.discount || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) return 'Quantidade deve ser maior que zero';
    if (!Number.isFinite(unitValue) || unitValue < 0) return 'Valor unitário não pode ser negativo';
    if (!Number.isFinite(discount) || discount < 0) return 'Desconto não pode ser negativo';
    if (discount > quantity * unitValue) return 'Desconto não pode ser maior que o subtotal da linha';

    return null;
  };

  const startEdit = (line: QuoteLine) => {
    setAdding(false);
    setEditingId(line.id);
    setForm({
      type: line.type,
      description: line.description,
      quantity: String(Number(line.quantity)),
      unitValue: String(Number(line.unitValue)),
      discount: String(Number(line.discount)),
      billingType: line.billingType || ItemBillingType.BILLED_SEPARATELY,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSaveEdit = async () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setSaving(true);
    try {
      const isIncluded = form.billingType === ItemBillingType.INCLUDED_IN_SERVICE;
      const updated = await quotesApi.updateQuoteLine(quoteId, editingId!, {
        type: form.type,
        description: form.description,
        quantity: Number(form.quantity),
        unitValue: isIncluded ? 0 : Number(form.unitValue),
        discount: isIncluded ? 0 : Number(form.discount),
        billingType: form.billingType,
      });
      onChange(lines.map((l) => (l.id === updated.id ? updated : l)));
      cancelEdit();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar linha');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }
    setSaving(true);
    try {
      const isIncluded = form.billingType === ItemBillingType.INCLUDED_IN_SERVICE;
      const created = await quotesApi.addQuoteLine(quoteId, {
        type: form.type,
        description: form.description,
        quantity: Number(form.quantity),
        unitValue: isIncluded ? 0 : Number(form.unitValue),
        discount: isIncluded ? 0 : Number(form.discount),
        billingType: form.billingType,
      });
      onChange([...lines, created]);
      setForm(emptyForm);
      setAdding(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao adicionar linha');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (lineId: string) => {
    if (!window.confirm('Remover esta linha do orçamento?')) return;
    try {
      await quotesApi.removeQuoteLine(quoteId, lineId);
      onChange(lines.filter((l) => l.id !== lineId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao remover linha');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5 text-primary" />
          Linhas do Orçamento
        </CardTitle>
        {editable && !adding && !editingId && (
          <Button size="sm" variant="outline" className="rounded-[9px] font-bold gap-2" onClick={() => { cancelEdit(); setAdding(true); }}>
            <Plus className="h-4 w-4" />
            Adicionar linha
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="text-left py-3 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição</th>
                <th className="text-right py-3 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Qtd</th>
                <th className="text-right py-3 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">V. Unit</th>
                <th className="text-right py-3 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Desconto</th>
                <th className="text-right py-3 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                {editable && <th className="w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.length === 0 && !adding ? (
                <tr>
                  <td colSpan={editable ? 7 : 6} className="py-10 text-center text-muted-foreground italic">
                    Nenhuma linha de orçamento cadastrada.
                  </td>
                </tr>
              ) : (
                lines.map((line) => (
                  editingId === line.id ? (
                    <tr key={line.id} className="bg-blue-50/30">
                      <td className="py-3 px-6">
                        <select
                          value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value as QuoteLineType })}
                          className="w-full h-9 px-2 rounded-md border border-slate-200 text-xs font-semibold bg-card"
                        >
                          {Object.values(QuoteLineType).map((t) => (
                            <option key={t} value={t}>{QUOTE_LINE_TYPE_LABELS[t]}</option>
                          ))}
                        </select>
                        {form.type === QuoteLineType.MATERIAL && (
                          <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-md cursor-pointer mt-1.5 select-none hover:bg-emerald-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE}
                              onChange={(e) => {
                                const isInc = e.target.checked;
                                setForm({
                                  ...form,
                                  billingType: isInc ? ItemBillingType.INCLUDED_IN_SERVICE : ItemBillingType.BILLED_SEPARATELY,
                                  unitValue: isInc ? '0' : form.unitValue,
                                  discount: isInc ? '0' : form.discount,
                                });
                              }}
                              className="h-3.5 w-3.5 text-emerald-600 rounded"
                            />
                            <span>Incluso no Serviço</span>
                          </label>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <Input
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Descrição"
                          className="h-9 text-xs"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <Input
                          type="number"
                          step="0.01"
                          value={form.quantity}
                          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                          className="h-9 text-xs text-right"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <Input
                          type="number"
                          step="0.01"
                          disabled={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE}
                          value={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? '0' : form.unitValue}
                          onChange={(e) => setForm({ ...form, unitValue: e.target.value })}
                          className={`h-9 text-xs text-right ${form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? 'bg-muted text-muted-foreground' : ''}`}
                        />
                      </td>
                      <td className="py-3 px-6">
                        <Input
                          type="number"
                          step="0.01"
                          disabled={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE}
                          value={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? '0' : form.discount}
                          onChange={(e) => setForm({ ...form, discount: e.target.value })}
                          className={`h-9 text-xs text-right ${form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? 'bg-muted text-muted-foreground' : ''}`}
                        />
                      </td>
                      <td className="py-3 px-6 text-right text-xs font-bold">
                        {form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            R$ 0,00 (Incluso)
                          </span>
                        ) : (
                          <span className="text-blue-700">
                            {currency(Number(form.quantity || 0) * Number(form.unitValue || 0) - Number(form.discount || 0))}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" disabled={saving} onClick={handleSaveEdit} className="h-8 rounded-md gap-1">
                            <Check className="h-3.5 w-3.5" />
                            {saving ? '...' : 'Salvar'}
                          </Button>
                          <button
                            onClick={cancelEdit}
                            title="Cancelar edição"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={line.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-6 text-sm text-muted-foreground">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-medium text-foreground">{QUOTE_LINE_TYPE_LABELS[line.type]}</span>
                          {line.billingType === ItemBillingType.INCLUDED_IN_SERVICE && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              Incluso no Serviço
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm font-medium text-foreground">{line.description}</td>
                      <td className="py-3 px-6 text-right text-sm text-muted-foreground">{Number(line.quantity)}</td>
                      <td className="py-3 px-6 text-right text-sm text-muted-foreground">
                        {line.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? (
                          <span className="text-emerald-700 font-semibold">Incluso</span>
                        ) : (
                          currency(Number(line.unitValue))
                        )}
                      </td>
                      <td className="py-3 px-6 text-right text-sm text-muted-foreground">
                        {line.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? '—' : currency(Number(line.discount))}
                      </td>
                      <td className="py-3 px-6 text-right text-sm font-bold">
                        {line.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                            R$ 0,00 (Incluso)
                          </span>
                        ) : (
                          <span className="text-blue-700">{currency(Number(line.totalValue))}</span>
                        )}
                      </td>
                      {editable && (
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => startEdit(line)}
                              title="Editar linha"
                              className="text-muted-foreground hover:text-blue-600 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(line.id)}
                              title="Remover linha"
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                ))
              )}
              {adding && (
                <tr className="bg-blue-50/30">
                  <td className="py-3 px-6">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as QuoteLineType })}
                      className="w-full h-9 px-2 rounded-md border border-slate-200 text-xs font-semibold bg-card"
                    >
                      {Object.values(QuoteLineType).map((t) => (
                        <option key={t} value={t}>{QUOTE_LINE_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    {form.type === QuoteLineType.MATERIAL && (
                      <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-md cursor-pointer mt-1.5 select-none hover:bg-emerald-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE}
                          onChange={(e) => {
                            const isInc = e.target.checked;
                            setForm({
                              ...form,
                              billingType: isInc ? ItemBillingType.INCLUDED_IN_SERVICE : ItemBillingType.BILLED_SEPARATELY,
                              unitValue: isInc ? '0' : form.unitValue,
                              discount: isInc ? '0' : form.discount,
                            });
                          }}
                          className="h-3.5 w-3.5 text-emerald-600 rounded"
                        />
                        <span>Incluso no Serviço</span>
                      </label>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    <Input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descrição"
                      className="h-9 text-xs"
                    />
                  </td>
                  <td className="py-3 px-6">
                    <Input
                      type="number"
                      step="0.01"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="h-9 text-xs text-right"
                    />
                  </td>
                  <td className="py-3 px-6">
                    <Input
                      type="number"
                      step="0.01"
                      disabled={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE}
                      value={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? '0' : form.unitValue}
                      onChange={(e) => setForm({ ...form, unitValue: e.target.value })}
                      className={`h-9 text-xs text-right ${form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? 'bg-muted text-muted-foreground' : ''}`}
                    />
                  </td>
                  <td className="py-3 px-6">
                    <Input
                      type="number"
                      step="0.01"
                      disabled={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE}
                      value={form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? '0' : form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      className={`h-9 text-xs text-right ${form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? 'bg-muted text-muted-foreground' : ''}`}
                    />
                  </td>
                  <td className="py-3 px-6 text-right text-xs font-bold">
                    {form.billingType === ItemBillingType.INCLUDED_IN_SERVICE ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        R$ 0,00 (Incluso)
                      </span>
                    ) : (
                      <span className="text-blue-700">
                        {currency(Number(form.quantity || 0) * Number(form.unitValue || 0) - Number(form.discount || 0))}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" disabled={saving} onClick={handleAdd} className="h-8 rounded-md">
                        {saving ? '...' : 'Salvar'}
                      </Button>
                      <button onClick={() => { setAdding(false); setForm(emptyForm); }} className="text-muted-foreground hover:text-foreground text-xs">
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {lines.length > 0 && (
              <tfoot className="bg-blue-50/30">
                <tr>
                  <td colSpan={5} className="py-4 px-6 text-right font-bold text-foreground">Total do Orçamento:</td>
                  <td className="py-4 px-6 text-right text-lg font-black text-blue-700">{currency(total)}</td>
                  {editable && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

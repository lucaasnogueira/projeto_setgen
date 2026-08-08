"use client"

import { useState, useEffect } from 'react';
import { quotesApi } from '@/lib/api/quotes';
import { QuoteStatus } from '@/types';
import { FileText, DollarSign, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurchaseOrder } from '@/types';
import { cn } from '@/lib/utils';
import { StepRail, StepFooter, type WizardStep } from '@/components/ui/step-wizard';

// Espelha OC_ELIGIBLE_QUOTE_STATUSES do backend (purchase-orders.service.ts).
const OC_ELIGIBLE_STATUSES: QuoteStatus[] = [QuoteStatus.APPROVED, QuoteStatus.SENT_TO_CLIENT, QuoteStatus.AWAITING_RESPONSE];

interface PurchaseOrderFormProps {
  initialData?: Partial<PurchaseOrder>;
  defaultQuoteId?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function PurchaseOrderForm({
  initialData,
  defaultQuoteId,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: PurchaseOrderFormProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    quoteId: initialData?.quoteId || defaultQuoteId || '',
    clientId: initialData?.clientId || '',
    orderNumber: initialData?.orderNumber || '',
    value: initialData?.value?.toString() || '',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : '',
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const data = await quotesApi.getAll();
      const eligible = data.filter((q) => OC_ELIGIBLE_STATUSES.includes(q.status) || q.id === (initialData?.quoteId || defaultQuoteId));
      setQuotes(eligible);
      if (defaultQuoteId && !initialData) {
        const q = eligible.find((x) => x.id === defaultQuoteId);
        if (q) setFormData((prev) => ({ ...prev, clientId: q.clientId }));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const handleQuoteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quoteId = e.target.value;
    const quote = quotes.find(q => q.id === quoteId);

    setFormData(prev => ({
      ...prev,
      quoteId,
      clientId: quote ? quote.clientId : ''
    }));
  };

  type StepKey = "vinculo" | "dados";
  const [activeStep, setActiveStep] = useState<StepKey>("vinculo");
  const stepDefs: WizardStep[] = [
    { key: "vinculo", label: "Vínculo com Orçamento" },
    { key: "dados", label: "Dados da OC" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.quoteId) {
      setActiveStep("vinculo");
      alert("Selecione um orçamento aprovado");
      return;
    }
    if (!formData.orderNumber || !formData.value || !formData.issueDate || !formData.expiryDate) {
      setActiveStep("dados");
      alert("Preencha número, valor, emissão e validade da OC");
      return;
    }

    const payload = {
      quoteId: formData.quoteId,
      clientId: formData.clientId,
      orderNumber: formData.orderNumber,
      value: parseFloat(formData.value),
      issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : '',
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : '',
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden", activeStep !== "vinculo" && "hidden")}>
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-green-600" />
            Vínculo com Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Orçamento Aprovado <span className="text-red-500">*</span></Label>
            <select
              required
              value={formData.quoteId}
              onChange={handleQuoteSelect}
              disabled={!!initialData || !!defaultQuoteId}
              className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              <option value="">Selecione um orçamento aprovado</option>
              {quotes.map(quote => (
                <option key={quote.id} value={quote.id}>
                  {quote.quoteNumber} - {quote.client?.companyName || quote.client?.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden", activeStep !== "dados" && "hidden")}>
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Info className="h-5 w-5 text-green-600" />
            Dados da Ordem de Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Número da OC/OP <span className="text-red-500">*</span></Label>
              <Input
                required
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="Ex: OC-2024-001"
                className="h-11 rounded-xl focus:ring-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Valor (R$) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="h-11 pl-10 rounded-xl focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Data de Emissão <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="h-11 pl-10 rounded-xl focus:ring-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Validade <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="h-11 pl-10 rounded-xl focus:ring-green-500"
                />
              </div>
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

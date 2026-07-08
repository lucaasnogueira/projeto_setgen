"use client"

import { useState, useEffect } from 'react';
import { ordersApi } from '@/lib/api/orders';
import { FileText, DollarSign, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurchaseOrder } from '@/types';
import { cn } from '@/lib/utils';
import { StepRail, StepFooter, type WizardStep } from '@/components/ui/step-wizard';

interface PurchaseOrderFormProps {
  initialData?: Partial<PurchaseOrder>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function PurchaseOrderForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: PurchaseOrderFormProps) {
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    serviceOrderId: initialData?.serviceOrderId || '',
    clientId: initialData?.clientId || '',
    orderNumber: initialData?.orderNumber || '',
    value: initialData?.value?.toString() || '',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : '',
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    loadServiceOrders();
  }, []);

  const loadServiceOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      // Allow current SO if editing, otherwise APPROVED
      setServiceOrders(data.filter(o => o.status === 'APPROVED' || o.id === initialData?.serviceOrderId));
    } catch (error) {
      console.error('Error loading service orders:', error);
    }
  };

  const handleSOSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const soId = e.target.value;
    const so = serviceOrders.find(o => o.id === soId);
    
    setFormData(prev => ({ 
      ...prev, 
      serviceOrderId: soId,
      clientId: so ? so.clientId : ''
    }));
  };

  type StepKey = "vinculo" | "dados";
  const [activeStep, setActiveStep] = useState<StepKey>("vinculo");
  const stepDefs: WizardStep[] = [
    { key: "vinculo", label: "Vínculo com OS" },
    { key: "dados", label: "Dados da OC" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Etapas ocultas por CSS quebram o `required` nativo do browser fora da etapa ativa.
    if (!formData.serviceOrderId) {
      setActiveStep("vinculo");
      alert("Selecione uma OS aprovada");
      return;
    }
    if (!formData.orderNumber || !formData.value || !formData.issueDate || !formData.expiryDate) {
      setActiveStep("dados");
      alert("Preencha número, valor, emissão e validade da OC");
      return;
    }

    const payload = {
      serviceOrderId: formData.serviceOrderId,
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

      {/* Vínculo com OS */}
      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden", activeStep !== "vinculo" && "hidden")}>
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-green-600" />
            Vínculo com Ordem de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">OS Aprovada <span className="text-red-500">*</span></Label>
            <select
              required
              value={formData.serviceOrderId}
              onChange={handleSOSelect}
              className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              <option value="">Selecione uma OS aprovada</option>
              {serviceOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.client?.companyName || order.client?.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da OC */}
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
              <Label className="text-foreground font-semibold">Número da OC <span className="text-red-500">*</span></Label>
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

"use client"

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clientsApi } from '@/lib/api/clients';
import { Briefcase, Calendar, Info, DollarSign, AlertTriangle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceOrderType, Quote, PaymentMethod } from '@/types';
import { usersApi, User as ApiUser } from '@/lib/api/users';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { StepRail, StepFooter, type WizardStep } from '@/components/ui/step-wizard';

const NONE = '__none__';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.BANK_SLIP]: 'Boleto',
  [PaymentMethod.CHECK]: 'Cheque',
};

const quoteSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  type: z.nativeEnum(ServiceOrderType),
  scope: z.string().min(10, "Descreva o escopo com no mínimo 10 caracteres"),
  reportedDefects: z.string().optional(),
  requestedServices: z.string().optional(),
  notes: z.string().optional(),
  validUntil: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Data inválida"),
  paymentMethod: z.string().optional(),
  paymentTerms: z.string().optional(),
  paymentTermDays: z.string().optional(),
  warrantyMonths: z.string().optional(),
  salesRepId: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  initialData?: Partial<Quote>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function QuoteForm({ initialData, onSubmit, onCancel, loading, submitLabel }: QuoteFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);

  type StepKey = 'geral' | 'pagamento';
  const [activeStep, setActiveStep] = useState<StepKey>('geral');
  const stepDefs: WizardStep[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'pagamento', label: 'Pagamento' },
  ];

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientId: initialData?.clientId || '',
      type: initialData?.type || ServiceOrderType.VISIT_REPORT,
      scope: initialData?.scope || '',
      reportedDefects: initialData?.reportedDefects || '',
      requestedServices: initialData?.requestedServices || '',
      notes: initialData?.notes || '',
      validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
      paymentMethod: initialData?.paymentMethod || NONE,
      paymentTerms: initialData?.paymentTerms || '',
      paymentTermDays: initialData?.paymentTermDays ? String(initialData.paymentTermDays) : '',
      warrantyMonths: initialData?.warrantyMonths ? String(initialData.warrantyMonths) : '',
      salesRepId: initialData?.salesRepId || NONE,
    }
  });

  const { register, handleSubmit, control, formState: { errors } } = form;

  useEffect(() => {
    clientsApi.getAll().then(setClients).catch(() => setClients([]));
    usersApi.getAll().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length > 0) setActiveStep('geral');
  }, [errors]);

  const onFormSubmit = (data: QuoteFormValues) => {
    const payload: any = {
      ...data,
      validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
      paymentMethod: data.paymentMethod && data.paymentMethod !== NONE ? data.paymentMethod : undefined,
      paymentTerms: data.paymentTerms || undefined,
      paymentTermDays: data.paymentTermDays ? Number(data.paymentTermDays) : undefined,
      warrantyMonths: data.warrantyMonths ? Number(data.warrantyMonths) : undefined,
      salesRepId: data.salesRepId && data.salesRepId !== NONE ? data.salesRepId : undefined,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      <Card className={cn('border-none shadow-xl rounded-3xl overflow-hidden', activeStep !== 'geral' && 'hidden')}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-blue-600" />
            Informações do Orçamento
          </CardTitle>
          <CardDescription>Defina o tipo de serviço e o cliente responsável</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Tipo *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                    <SelectTrigger className="h-12 rounded-2xl bg-background border-border">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                    <SelectTrigger className="h-12 rounded-2xl bg-background border-border">
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
        </CardContent>
      </Card>

      <Card className={cn('border-none shadow-xl rounded-3xl overflow-hidden', activeStep !== 'geral' && 'hidden')}>
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
              <Label className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Defeitos Relatados</Label>
              <textarea
                className="w-full flex min-h-[100px] rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="Problemas informados pelo cliente..."
                {...register('reportedDefects')}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm flex items-center gap-2"><Wrench className="h-4 w-4" />Serviços Solicitados</Label>
              <textarea
                className="w-full flex min-h-[100px] rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="Ações específicas solicitadas..."
                {...register('requestedServices')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-sm">Escopo Proposto *</Label>
            <textarea
              className="w-full flex min-h-[120px] rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="Descrição técnica detalhada do trabalho..."
              {...register('scope')}
            />
            {errors.scope && <p className="text-xs font-bold text-red-500">{errors.scope.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Validade do Orçamento</Label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600" />
                <Input
                  type="date"
                  className="h-12 pl-10 rounded-2xl border-border focus:ring-blue-500/20 focus:border-blue-500"
                  {...register('validUntil')}
                />
              </div>
              {errors.validUntil && <p className="text-xs font-bold text-red-500">{errors.validUntil.message}</p>}
              <p className="text-xs text-muted-foreground">Necessária antes de enviar ao cliente — usada pra expirar automaticamente sem resposta.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Observações Internas</Label>
              <Input
                placeholder="Notas para a equipe comercial..."
                className="h-12 rounded-2xl border-border focus:ring-blue-500/20 focus:border-blue-500"
                {...register('notes')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn('border-none shadow-xl rounded-3xl overflow-hidden', activeStep !== 'pagamento' && 'hidden')}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Pagamento e Garantia
          </CardTitle>
          <CardDescription>Condições comerciais do orçamento</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Forma de Pagamento</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 rounded-2xl bg-background border-border">
                      <SelectValue placeholder="Não definida" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Não definida</SelectItem>
                      {Object.values(PaymentMethod).map((pm) => (
                        <SelectItem key={pm} value={pm}>{PAYMENT_METHOD_LABELS[pm]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Garantia (meses)</Label>
              <Input
                type="number"
                min="0"
                placeholder="12"
                className="h-12 rounded-2xl border-border focus:ring-blue-500/20 focus:border-blue-500"
                {...register('warrantyMonths')}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Responsável Comercial</Label>
              <Controller
                name="salesRepId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 rounded-2xl bg-background border-border">
                      <SelectValue placeholder="Não definido" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Não definido</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Prazo de Pagamento (dias)</Label>
              <Input
                type="number"
                min="0"
                placeholder="30"
                className="h-12 rounded-2xl border-border focus:ring-blue-500/20 focus:border-blue-500"
                {...register('paymentTermDays')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-sm">Condição de Pagamento</Label>
              <Input
                placeholder="Ex: 50% entrada e 50% na conclusão"
                className="h-12 rounded-2xl border-border focus:ring-blue-500/20 focus:border-blue-500"
                {...register('paymentTerms')}
              />
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

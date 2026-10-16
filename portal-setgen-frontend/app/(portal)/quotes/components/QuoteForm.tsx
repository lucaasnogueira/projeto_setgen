"use client"

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clientsApi } from '@/lib/api/clients';
import { Briefcase, Calendar, Info, DollarSign, AlertTriangle, Wrench, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceOrderType, Quote, PaymentMethod } from '@/types';
import { usersApi, User as ApiUser } from '@/lib/api/users';
import { toDateInputValue, endOfBusinessDayISO } from '@/lib/date';
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
      validUntil: toDateInputValue(initialData?.validUntil),
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
    usersApi.getSelectable().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length > 0) setActiveStep('geral');
  }, [errors]);

  const onFormSubmit = (data: QuoteFormValues) => {
    const payload: any = {
      ...data,
      // Validade vale até o FIM do dia escolhido, no fuso da operação — senão o
      // orçamento expira antes do que o comercial combinou com o cliente, e
      // muda de data conforme o fuso de quem abriu o portal.
      validUntil: endOfBusinessDayISO(data.validUntil),
      paymentMethod: data.paymentMethod && data.paymentMethod !== NONE ? data.paymentMethod : undefined,
      paymentTerms: data.paymentTerms || undefined,
      paymentTermDays: data.paymentTermDays ? Number(data.paymentTermDays) : undefined,
      warrantyMonths: data.warrantyMonths ? Number(data.warrantyMonths) : undefined,
      salesRepId: data.salesRepId && data.salesRepId !== NONE ? data.salesRepId : undefined,
    };

    // Cliente e tipo são a identidade do orçamento e não mudam depois de
    // criado — a API recusa recebê-los na edição.
    if (initialData) {
      delete payload.clientId;
      delete payload.type;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {/* Topo do Formulário com Protocolo e Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
              {initialData?.quoteNumber ? initialData.quoteNumber : 'PROP-2026-NOVA'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              {initialData ? (initialData.status ? initialData.status : 'Proposta Ativa') : 'Minuta / Rascunho'}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {initialData ? `Edição da Proposta ${initialData.quoteNumber}` : 'Nova Proposta Comercial de Locação / Serviços'}
          </h3>
          <p className="text-xs text-gray-400">
            Defina o cliente, escopo técnico, horas franquia, faturamento dual e condições comerciais
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

      {/* Identificação Principal */}
      {/* Identificação Principal */}
      <Card className={cn('border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white', activeStep !== 'geral' && 'hidden')}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <Info className="h-3.5 w-3.5 text-[#E2661D]" />
            1. Informações Básicas do Orçamento
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">Defina o tipo de serviço e o cliente tomador</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Tipo de Atendimento *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                    <SelectTrigger className="h-9 text-xs rounded-lg bg-white border-gray-200">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ServiceOrderType.VISIT_REPORT}>Relatório de Visita Técnica</SelectItem>
                      <SelectItem value={ServiceOrderType.EXECUTION}>Execução de Serviço / Locação</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-xs font-bold text-red-500">{errors.type.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Cliente / Usina *</Label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                    <SelectTrigger className="h-9 text-xs rounded-lg bg-white border-gray-200">
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

      {/* Escopo Técnico */}
      <Card className={cn('border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white', activeStep !== 'geral' && 'hidden')}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <Briefcase className="h-3.5 w-3.5 text-[#E2661D]" />
            2. Escopo Técnico & Dimensionamento
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">Descreva tecnicamente os geradores e serviços a serem fornecidos</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />Defeitos Relatados</Label>
              <textarea
                className="w-full flex min-h-[85px] rounded-lg border border-gray-200 bg-white p-2.5 text-xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
                placeholder="Problemas informados pelo cliente..."
                {...register('reportedDefects')}
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700 flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-[#E2661D]" />Serviços Solicitados</Label>
              <textarea
                className="w-full flex min-h-[85px] rounded-lg border border-gray-200 bg-white p-2.5 text-xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
                placeholder="Ações específicas solicitadas..."
                {...register('requestedServices')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-semibold text-xs text-gray-700">Escopo Proposto *</Label>
            <textarea
              className="w-full flex min-h-[95px] rounded-lg border border-gray-200 bg-white p-2.5 text-xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
              placeholder="Descrição técnica detalhada do trabalho..."
              {...register('scope')}
            />
            {errors.scope && <p className="text-xs font-bold text-red-500">{errors.scope.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Validade do Orçamento</Label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#E2661D]" />
                <Input
                  type="date"
                  className="h-9 pl-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                  {...register('validUntil')}
                />
              </div>
              {errors.validUntil && <p className="text-xs font-bold text-red-500">{errors.validUntil.message}</p>}
              <p className="text-[11px] text-gray-400">Necessária antes de enviar ao cliente — usada pra expirar automaticamente sem resposta.</p>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Observações Internas</Label>
              <Input
                placeholder="Notas para a equipe comercial..."
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                {...register('notes')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn('border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white', activeStep !== 'pagamento' && 'hidden')}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <DollarSign className="h-3.5 w-3.5 text-[#E2661D]" />
            3. Condições Comerciais, Pagamento & Garantia
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">Condições comerciais, prazos e faturamento da locação</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Forma de Pagamento</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
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

            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Garantia (meses)</Label>
              <Input
                type="number"
                min="0"
                placeholder="12"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                {...register('warrantyMonths')}
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Responsável Comercial</Label>
              <Controller
                name="salesRepId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
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

            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Prazo de Pagamento (dias)</Label>
              <Input
                type="number"
                min="0"
                placeholder="30"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                {...register('paymentTermDays')}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="font-semibold text-xs text-gray-700">Condição de Pagamento</Label>
              <Input
                placeholder="Ex: 50% entrada e 50% na conclusão"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
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

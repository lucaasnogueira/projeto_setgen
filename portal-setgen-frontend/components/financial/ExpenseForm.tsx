'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpenseType, PaymentMethod, ExpenseCategory } from '@/types/financial';
import { Loader2, DollarSign, Calendar, Tag, FileText, User, Receipt, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toDateInputValue } from '@/lib/date';

const expenseSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  type: z.nativeEnum(ExpenseType),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  competenceDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  costCenterId: z.string().optional(),
  visitId: z.string().optional(),
  serviceOrderId: z.string().optional(),
  clientId: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  documentNumber: z.string().optional(),
  notes: z.string().optional(),
  supplier: z.string().optional(),
  isFixed: z.boolean(),
  totalInstallments: z.number().min(1).optional(),
  installmentDaysOffsetsText: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  categories: ExpenseCategory[];
  clients?: any[];
  visits?: any[];
  serviceOrders?: any[];
  onSubmit: (data: any) => Promise<void>;
  initialData?: Partial<ExpenseFormValues>;
  isLoading?: boolean;
}

export function ExpenseForm({
  categories,
  clients,
  visits,
  serviceOrders,
  onSubmit,
  initialData,
  isLoading
}: ExpenseFormProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: initialData?.type || ExpenseType.SERVICE,
      date: initialData?.date || toDateInputValue(new Date()),
      dueDate: initialData?.dueDate || toDateInputValue(new Date()),
      competenceDate: initialData?.competenceDate || toDateInputValue(new Date()),
      isFixed: initialData?.isFixed === undefined ? false : initialData.isFixed,
      amount: initialData?.amount || 0,
      description: initialData?.description || '',
      categoryId: initialData?.categoryId || '',
      ...initialData,
    },
  });

  const { register, handleSubmit, watch, control, formState: { errors } } = form;
  const expenseType = watch('type');
  const isFixed = watch('isFixed');

  const onFormSubmit = async (data: ExpenseFormValues) => {
    const { installmentDaysOffsetsText, ...rest } = data;
    const installmentDaysOffsets = installmentDaysOffsetsText
      ?.split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number);

    await onSubmit({
      ...rest,
      ...(installmentDaysOffsets?.length ? { installmentDaysOffsets } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-[#E2661D]" />
            Classificação e Valores
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">Defina o tipo, categoria e o valor da despesa</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Tipo de Despesa */}
            <div className="space-y-1.5">
              <Label htmlFor="type" className="font-semibold text-xs text-gray-700">Tipo de Despesa *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ExpenseType.SERVICE}>Serviço</SelectItem>
                      <SelectItem value={ExpenseType.ADMINISTRATIVE}>Administrativa</SelectItem>
                      <SelectItem value={ExpenseType.FINANCIAL}>Financeira</SelectItem>
                      <SelectItem value={ExpenseType.TAX}>Tributária</SelectItem>
                      <SelectItem value={ExpenseType.PAYROLL}>Folha de Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-[11px] font-semibold text-red-500">{errors.type.message}</p>}
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label htmlFor="categoryId" className="font-semibold text-xs text-gray-700">Categoria *</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && <p className="text-[11px] font-semibold text-red-500">{errors.categoryId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Valor */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="font-semibold text-xs text-gray-700">Valor (R$) *</Label>
              <div className="relative group">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-[#E2661D] transition-colors" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="pl-8 h-9 rounded-lg text-xs border-gray-200"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && <p className="text-[11px] font-semibold text-red-500">{errors.amount.message}</p>}
            </div>

            {/* Documento */}
            <div className="space-y-1.5">
              <Label htmlFor="documentNumber" className="font-semibold text-xs text-gray-700">Nº Documento / Nota</Label>
              <div className="relative group">
                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-[#E2661D] transition-colors" />
                <Input
                  id="documentNumber"
                  placeholder="Ex: 12345"
                  className="pl-8 h-9 rounded-lg text-xs border-gray-200"
                  {...register('documentNumber')}
                />
              </div>
            </div>

             {/* Forma de Pagamento */}
             <div className="space-y-1.5">
              <Label htmlFor="paymentMethod" className="font-semibold text-xs text-gray-700">Forma de Pagamento</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentMethod.CASH}>Dinheiro</SelectItem>
                      <SelectItem value={PaymentMethod.DEBIT_CARD}>Cartão de Débito</SelectItem>
                      <SelectItem value={PaymentMethod.CREDIT_CARD}>Cartão de Crédito</SelectItem>
                      <SelectItem value={PaymentMethod.PIX}>PIX</SelectItem>
                      <SelectItem value={PaymentMethod.BANK_TRANSFER}>Transferência</SelectItem>
                      <SelectItem value={PaymentMethod.BANK_SLIP}>Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#E2661D]" />
            Datas e Prazos
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">Gerencie o vencimento e competência da despesa</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="font-semibold text-xs text-gray-700">Data da Despesa</Label>
              <Input type="date" className="h-9 rounded-lg text-xs border-gray-200" {...register('date')} />
              {errors.date && <p className="text-[11px] font-semibold text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="font-semibold text-xs text-gray-700">Data de Vencimento</Label>
              <Input type="date" className="h-9 rounded-lg text-xs border-gray-200" {...register('dueDate')} />
              {errors.dueDate && <p className="text-[11px] font-semibold text-red-500">{errors.dueDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="competenceDate" className="font-semibold text-xs text-gray-700">Mês de Referência</Label>
              <Input type="month" className="h-9 rounded-lg text-xs border-gray-200" {...register('competenceDate')} />
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Mês/Ano de competência</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-[#E2661D]" />
            Detalhes e Vínculos
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">Informações adicionais e vínculos com o operacional</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="description" className="font-semibold text-xs text-gray-700">Descrição Curta *</Label>
              <Input id="description" placeholder="Ex: Gasolina para visita técnica" className="h-9 rounded-lg text-xs border-gray-200" {...register('description')} />
              {errors.description && <p className="text-[11px] font-semibold text-red-500">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier" className="font-semibold text-xs text-gray-700">Fornecedor</Label>
              <Input id="supplier" placeholder="Ex: Posto Ipiranga" className="h-9 rounded-lg text-xs border-gray-200" {...register('supplier')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
             {/* Despesa Fixa / Parcelada */}
             <div className="flex items-center space-x-2.5 p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 h-9">
                <input
                  type="checkbox"
                  id="isFixed"
                  className="w-4 h-4 rounded border-gray-300 text-[#E2661D] focus:ring-[#E2661D] transition-all cursor-pointer"
                  {...register('isFixed')}
                />
                <Label htmlFor="isFixed" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">Despesa Fixa?</Label>
            </div>

            {isFixed && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2">
                <Label htmlFor="totalInstallments" className="font-semibold text-xs text-gray-700">Total de Parcelas</Label>
                <Input
                  id="totalInstallments"
                  type="number"
                  min="1"
                  placeholder="1"
                  className="h-9 rounded-lg text-xs border-gray-200"
                  {...register('totalInstallments', { valueAsNumber: true })}
                />
              </div>
            )}

            {isFixed && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 lg:col-span-2">
                <Label htmlFor="installmentDaysOffsetsText" className="font-semibold text-xs text-gray-700">
                  Vencimento das parcelas (dias corridos)
                </Label>
                <Input
                  id="installmentDaysOffsetsText"
                  placeholder="Ex: 15,30,45,60 (deixe vazio p/ vencimento mensal padrão)"
                  className="h-9 rounded-lg text-xs border-gray-200"
                  {...register('installmentDaysOffsetsText')}
                />
                <p className="text-[10px] text-muted-foreground uppercase font-bold">
                  1 valor por parcela a partir da 2ª. Ex.: boleto em 15 e 30 dias = &quot;15,30&quot;
                </p>
              </div>
            )}
          </div>

          {expenseType === ExpenseType.SERVICE && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 border border-dashed border-[#E2661D]/40 rounded-xl bg-orange-50/20">
              <div className="col-span-full flex items-center gap-2 mb-1">
                <Tag className="h-3.5 w-3.5 text-[#E2661D]" />
                <h4 className="font-bold text-xs text-[#E2661D] uppercase">Vínculos Operacionais</h4>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="clientId" className="font-semibold text-xs text-gray-700">Cliente</Label>
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200 bg-white">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="visitId" className="font-semibold text-xs text-gray-700">Visita Técnica</Label>
                <Controller
                  name="visitId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200 bg-white">
                        <SelectValue placeholder="Selecione a visita" />
                      </SelectTrigger>
                      <SelectContent>
                        {visits?.map((visit) => (
                          <SelectItem key={visit.id} value={visit.id}>
                            {visit.location} - {new Date(visit.visitDate).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="font-semibold text-xs text-gray-700">Observações</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none transition-all placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Informações adicionais para o financeiro..."
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => form.reset()}
          className="h-9 px-5 rounded-lg text-xs font-semibold border-gray-200 hover:bg-gray-50"
        >
          Limpar Formulário
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-9 px-6 rounded-lg text-xs font-semibold shadow-2xs bg-[#E2661D] hover:bg-[#d05a18] text-white transition-all active:scale-95"
        >
          {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {isLoading ? 'Processando...' : 'Confirmar e Salvar'}
        </Button>
      </div>
    </form>
  );
}

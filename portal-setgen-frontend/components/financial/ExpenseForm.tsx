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
      date: initialData?.date || new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate || new Date().toISOString().split('T')[0],
      competenceDate: initialData?.competenceDate || new Date().toISOString().split('T')[0],
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
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Classificação e Valores
          </CardTitle>
          <CardDescription>Defina o tipo, categoria e o valor da despesa</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Despesa */}
            <div className="space-y-2">
              <Label htmlFor="type" className="font-semibold text-sm">Tipo de Despesa *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 rounded-xl">
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
              {errors.type && <p className="text-xs font-medium text-destructive">{errors.type.message}</p>}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="font-semibold text-sm">Categoria *</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 rounded-xl">
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
              {errors.categoryId && <p className="text-xs font-medium text-destructive">{errors.categoryId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-semibold text-sm">Valor (R$) *</Label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="pl-9 h-11 rounded-xl"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && <p className="text-xs font-medium text-destructive">{errors.amount.message}</p>}
            </div>

            {/* Documento */}
            <div className="space-y-2">
              <Label htmlFor="documentNumber" className="font-semibold text-sm">Nº Documento / Nota</Label>
              <div className="relative group">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="documentNumber"
                  placeholder="Ex: 12345"
                  className="pl-9 h-11 rounded-xl"
                  {...register('documentNumber')}
                />
              </div>
            </div>

             {/* Forma de Pagamento */}
             <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="font-semibold text-sm">Forma de Pagamento</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="h-11 rounded-xl">
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

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Datas e Prazos
          </CardTitle>
          <CardDescription>Gerencie o vencimento e competência da despesa</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="font-semibold text-sm">Data da Despesa</Label>
              <Input type="date" className="h-11 rounded-xl" {...register('date')} />
              {errors.date && <p className="text-xs font-medium text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="font-semibold text-sm">Data de Vencimento</Label>
              <Input type="date" className="h-11 rounded-xl" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs font-medium text-destructive">{errors.dueDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="competenceDate" className="font-semibold text-sm">Mês de Referência</Label>
              <Input type="month" className="h-11 rounded-xl" {...register('competenceDate')} />
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Mês/Ano de competência</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Detalhes e Vínculos
          </CardTitle>
          <CardDescription>Informações adicionais e vínculos com o operacional</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold text-sm">Descrição Curta *</Label>
              <Input id="description" placeholder="Ex: Gasolina para visita técnica" className="h-11 rounded-xl" {...register('description')} />
              {errors.description && <p className="text-xs font-medium text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier" className="font-semibold text-sm">Fornecedor</Label>
              <Input id="supplier" placeholder="Ex: Posto Ipiranga" className="h-11 rounded-xl" {...register('supplier')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
             {/* Despesa Fixa / Parcelada */}
             <div className="flex items-center space-x-3 p-3 border rounded-xl bg-muted/20 h-11">
                <input
                  type="checkbox"
                  id="isFixed"
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary transition-all cursor-pointer"
                  {...register('isFixed')}
                />
                <Label htmlFor="isFixed" className="text-sm font-semibold cursor-pointer select-none">Despesa Fixa?</Label>
            </div>

            {isFixed && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                <Label htmlFor="totalInstallments" className="font-semibold text-sm">Total de Parcelas</Label>
                <Input
                  id="totalInstallments"
                  type="number"
                  min="1"
                  placeholder="1"
                  className="h-11 rounded-xl"
                  {...register('totalInstallments', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {expenseType === ExpenseType.SERVICE && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border-2 border-dashed rounded-2xl bg-primary/5">
              <div className="col-span-full flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-sm text-primary uppercase">Vínculos Operacionais</h4>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientId" className="font-semibold text-sm">Cliente</Label>
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-11 rounded-xl bg-card">
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

              <div className="space-y-2">
                <Label htmlFor="visitId" className="font-semibold text-sm">Visita Técnica</Label>
                <Controller
                  name="visitId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-11 rounded-xl bg-card">
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

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-semibold text-sm">Observações</Label>
            <textarea
              id="notes"
              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Informações adicionais para o financeiro..."
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pb-10">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => form.reset()}
          className="h-12 px-8 rounded-xl font-bold border-2 hover:bg-muted"
        >
          Limpar Formulário
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-12 px-10 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Processando...' : 'Confirmar e Salvar'}
        </Button>
      </div>
    </form>
  );
}

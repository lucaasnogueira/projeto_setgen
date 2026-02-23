'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExpenseType, PaymentMethod, ExpenseCategory } from '@/types/financial';
import { Loader2 } from 'lucide-react';
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
  isFixed: z.boolean().default(false),
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

  const { register, handleSubmit, watch, formState: { errors } } = form;
  const expenseType = watch('type');

  const onFormSubmit = async (data: ExpenseFormValues) => {
    await onSubmit(data);
  };

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de Despesa */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Despesa</Label>
          <select
            id="type"
            className={inputClass}
            {...register('type')}
          >
            <option value={ExpenseType.SERVICE}>Serviço</option>
            <option value={ExpenseType.ADMINISTRATIVE}>Administrativa</option>
            <option value={ExpenseType.FINANCIAL}>Financeira</option>
            <option value={ExpenseType.TAX}>Tributária</option>
            <option value={ExpenseType.PAYROLL}>Folha de Pagamento</option>
          </select>
          {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <select
            id="categoryId"
            className={inputClass}
            {...register('categoryId')}
          >
            <option value="">Selecione a categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" placeholder="Ex: Gasolina para visita técnica" {...register('description')} />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

          {/* Fornecedor */}
          <div className="space-y-2">
          <Label htmlFor="supplier">Fornecedor (Opcional)</Label>
          <Input id="supplier" placeholder="Ex: Posto Ipiranga" {...register('supplier')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0,00"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="date">Data da Despesa</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
          />
          {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
        </div>

        {/* Vencimento */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Data de Vencimento</Label>
          <Input
            id="dueDate"
            type="date"
            {...register('dueDate')}
          />
          {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate.message}</p>}
        </div>
      </div>

      {/* Competência */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="competenceDate">Data de Competência</Label>
          <Input
            id="competenceDate"
            type="date"
            {...register('competenceDate')}
          />
           <p className="text-xs text-muted-foreground">Mês/Ano de referência</p>
          {errors.competenceDate && <p className="text-sm text-red-500">{errors.competenceDate.message}</p>}
        </div>
       </div>


      {/* Campos condicionais para despesas de serviço */}
      {expenseType === ExpenseType.SERVICE && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/20">
          <h4 className="col-span-2 font-medium text-sm text-muted-foreground mb-2">Vínculos Operacionais</h4>
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente</Label>
            <select
              id="clientId"
              className={inputClass}
              {...register('clientId')}
            >
              <option value="">Selecione o cliente</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Visita Técnica */}
          <div className="space-y-2">
            <Label htmlFor="visitId">Visita Técnica (opcional)</Label>
            <select
              id="visitId"
              className={inputClass}
              {...register('visitId')}
            >
              <option value="">Selecione a visita</option>
              {visits?.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.location} - {new Date(visit.visitDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Forma de Pagamento */}
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
        <select
          id="paymentMethod"
          className={inputClass}
          {...register('paymentMethod')}
        >
          <option value="">Selecione</option>
          <option value={PaymentMethod.CASH}>Dinheiro</option>
          <option value={PaymentMethod.DEBIT_CARD}>Cartão de Débito</option>
          <option value={PaymentMethod.CREDIT_CARD}>Cartão de Crédito</option>
          <option value={PaymentMethod.PIX}>PIX</option>
          <option value={PaymentMethod.BANK_TRANSFER}>Transferência</option>
          <option value={PaymentMethod.BANK_SLIP}>Boleto</option>
        </select>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          className={cn(inputClass, "min-h-[100px]")}
          placeholder="Informações adicionais..."
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Limpar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Salvando...' : 'Salvar Despesa'}
        </Button>
      </div>
    </form>
  );
}

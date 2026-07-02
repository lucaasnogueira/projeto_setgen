'use client';

import { Card } from '@/components/ui/card';
import { DashboardData } from '@/types/financial';
import { DollarSign, CreditCard, Clock, Wallet } from 'lucide-react';

interface DashboardCardsProps {
  data: DashboardData['summary'];
}

const currency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function DashboardCards({ data }: DashboardCardsProps) {
  const cards = [
    {
      label: 'Total de Despesas',
      value: currency(data.totalExpenses),
      sub: `${data.totalCount} lançamentos`,
      icon: DollarSign,
      tone: 'bg-status-blue-bg text-status-blue-fg',
    },
    {
      label: 'Pago',
      value: currency(data.paidExpenses),
      sub: `${data.paidCount} lançamentos pagos`,
      icon: CreditCard,
      tone: 'bg-status-green-bg text-status-green-fg',
    },
    {
      label: 'Pendente',
      value: currency(data.pendingExpenses),
      sub: `${data.pendingCount} a pagar`,
      icon: Clock,
      tone: 'bg-status-amber-bg text-status-amber-fg',
    },
    {
      label: 'Saldo em Contas',
      value: currency(data.totalBalance),
      sub: 'Todas as contas cadastradas',
      icon: Wallet,
      tone: 'bg-status-purple-bg text-status-purple-fg',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-5">
          <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-3.5 ${c.tone}`}>
            <c.icon className="h-[19px] w-[19px]" />
          </div>
          <div className="text-[22px] font-extrabold text-foreground leading-none">{c.value}</div>
          <div className="text-[12.5px] font-semibold text-text-muted mt-1.5">{c.label}</div>
          <div className="text-[11px] text-text-muted/80 mt-0.5">{c.sub}</div>
        </Card>
      ))}
    </div>
  );
}

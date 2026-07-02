'use client';

import { Card } from '@/components/ui/card';
import { DashboardData } from '@/types/financial';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashFlowChartProps {
  data: DashboardData['cashFlow'];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  // Sort by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sortedData.map(item => ({
    date: format(parseISO(item.date), 'dd/MM', { locale: ptBR }),
    income: Number(item.income),
    expense: Number(item.expense),
    balance: Number(item.balance)
  }));

  return (
    <Card className="col-span-1 md:col-span-2 p-5">
      <h3 className="text-[14.5px] font-bold text-foreground mb-4">Fluxo de Caixa (Últimos 30 dias)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
          <XAxis dataKey="date" fontSize={11.5} tickLine={false} axisLine={false} tick={{ fill: '#94a0ab' }} />
          <YAxis
            fontSize={11.5}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#94a0ab' }}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e7e9ec' }}
            formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
          />
          <Legend wrapperStyle={{ fontSize: '11.5px', fontWeight: 600 }} />
          <Line type="monotone" dataKey="income" name="Entradas" stroke="#15803d" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expense" name="Saídas" stroke="#dc2626" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="balance" name="Saldo" stroke="#e2661d" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

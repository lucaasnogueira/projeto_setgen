'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Fluxo de Caixa (Últimos 30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip 
                formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            />
            <Legend />
            <Line type="monotone" dataKey="income" name="Entradas" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="expense" name="Saídas" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="balance" name="Saldo" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

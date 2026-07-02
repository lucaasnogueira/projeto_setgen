'use client';

import { Card } from '@/components/ui/card';
import { DashboardData } from '@/types/financial';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ExpensesByCategoryProps {
  data: DashboardData['byCategory'];
}

export function ExpensesByCategory({ data }: ExpensesByCategoryProps) {
  // Take top 5 categories
  const chartData = data.slice(0, 5).map(item => ({
    name: item.category.name,
    value: Number(item.total),
    color: item.category.color || '#e2661d'
  }));

  return (
    <Card className="col-span-1 p-5">
      <h3 className="text-[14.5px] font-bold text-foreground mb-4">Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
          <XAxis dataKey="name" fontSize={11.5} tickLine={false} axisLine={false} tick={{ fill: '#94a0ab' }} />
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
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

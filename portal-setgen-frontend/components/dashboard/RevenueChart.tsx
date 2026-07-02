'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  data: { month: string; value: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
        <div className="space-y-1">
          <CardTitle className="text-[14.5px] font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Faturamento Mensal
          </CardTitle>
          <CardDescription className="text-xs">Desempenho financeiro nos últimos meses</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef1" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a0ab', fontSize: 11.5 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a0ab', fontSize: 11.5 }}
                tickFormatter={(value) => `R$ ${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: '#f6f7f8' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e7e9ec',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                formatter={(value: any) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                  'Faturamento'
                ]}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                barSize={36}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#e2661d"
                    fillOpacity={index === data.length - 1 ? 1 : 0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

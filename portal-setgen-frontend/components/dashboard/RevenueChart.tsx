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
  const totalRevenue = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <Card className="col-span-1 lg:col-span-2 overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Faturamento Mensal
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Notas fiscais autorizadas no período
          </CardDescription>
        </div>
        {totalRevenue > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalRevenue)}
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-4 px-5 pb-5">
        <div className="h-[250px] w-full">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Nenhum faturamento registrado no período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `R$ ${(value / 1000).toFixed(0)}k`
                      : `R$ ${value}`
                  }
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.08)',
                    padding: '10px 14px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                    'Faturado'
                  ]}
                />
                <Bar
                  dataKey="value"
                  radius={[5, 5, 0, 0]}
                  barSize={32}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === data.length - 1 ? 'url(#barGradientActive)' : 'url(#barGradient)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

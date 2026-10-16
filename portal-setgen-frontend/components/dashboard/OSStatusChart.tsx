'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface OSStatusChartProps {
  data: { label: string; value: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  'Concluída': '#10b981',
  'Aceita': '#10b981',
  'Em Andamento': '#3b82f6',
  'Aguardando Materiais': '#f59e0b',
  'Aguardando Aprovação': '#fbbf24',
  'Aprovada': '#06b6d4',
  'Enviado ao Cliente': '#8b5cf6',
  'Aguardando Resposta': '#ec4899',
  'Rascunho': '#94a3b8',
  'Rejeitada': '#ef4444',
  'Cancelada': '#64748b',
  'Expirado': '#9ca3af',
};

const FALLBACK_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b', '#06b6d4'];

export function OSStatusChart({ data }: OSStatusChartProps) {
  const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <Card className="col-span-1 overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Distribuição por Status
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Ordens e orçamentos ativos
          </CardDescription>
        </div>
        {total > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {total} total
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-4 px-5 pb-5">
        <div className="h-[250px] w-full">
          {total === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Nenhuma ordem registrada
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="label"
                >
                  {data.map((entry, index) => {
                    const color = STATUS_COLORS[entry.label] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                    return <Cell key={`cell-${index}`} fill={color} stroke="none" />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.08)',
                    padding: '10px 14px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [
                    `${value} ordens (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                    'Volume'
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

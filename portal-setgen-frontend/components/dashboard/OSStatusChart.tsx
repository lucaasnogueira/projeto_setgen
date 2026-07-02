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
import { FileText } from 'lucide-react';

interface OSStatusChartProps {
  data: { label: string; value: number }[];
}

const COLORS = ['#2563eb', '#d97706', '#15803d', '#dc2626', '#6d28d9'];

export function OSStatusChart({ data }: OSStatusChartProps) {
  return (
    <Card className="col-span-1 overflow-hidden">
      <CardHeader className="pb-2 p-5">
        <CardTitle className="text-[14.5px] font-bold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Status das OS
        </CardTitle>
        <CardDescription className="text-xs">Distribuição das ordens de serviço por status</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                nameKey="label"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e7e9ec',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11.5px', fontWeight: 600, color: '#5b6672' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

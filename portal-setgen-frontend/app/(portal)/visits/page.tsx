"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusCard } from '@/components/ui/status-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VisitsListView } from './components/VisitsListView';
import { VisitsAgendaView } from './components/VisitsAgendaView';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';

type ViewTab = 'list' | 'agenda';

export default function VisitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ViewTab>(searchParams.get('tab') === 'agenda' ? 'agenda' : 'list');
  const [visits, setVisits] = useState<TechnicalVisit[]>([]);

  useEffect(() => {
    visitsApi.getAll().then(setVisits).catch(() => []);
  }, []);

  const totalScheduled = visits.filter(v => v.status === 'SCHEDULED' || v.status === 'IN_PROGRESS' as any).length;
  const totalCompleted = visits.filter(v => v.status === 'COMPLETED' as any).length;
  const totalCancelled = visits.filter(v => v.status === 'CANCELLED' as any).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestão de Visitas"
        subtitle={
          tab === 'list'
            ? `${visits.length} visitas técnicas registradas`
            : 'Agenda técnica por data e equipes'
        }
        actions={
          <Button onClick={() => router.push('/visits/new')} className="rounded-[9px] font-bold gap-2 bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Button>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Visitas" value={visits.length} icon={Calendar} variant="orange" />
        <StatusCard label="Agendadas / Em Curso" value={totalScheduled} icon={Clock} variant="amber" />
        <StatusCard label="Realizadas" value={totalCompleted} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Canceladas" value={totalCancelled} icon={XCircle} variant="red" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="list" className="rounded-lg text-xs font-semibold">Lista de Visitas</TabsTrigger>
          <TabsTrigger value="agenda" className="rounded-lg text-xs font-semibold">Visão de Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <VisitsListView />
        </TabsContent>
        <TabsContent value="agenda" className="mt-4">
          <VisitsAgendaView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

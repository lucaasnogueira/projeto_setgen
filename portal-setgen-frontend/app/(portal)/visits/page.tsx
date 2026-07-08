"use client"

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VisitsListView } from './components/VisitsListView';
import { VisitsAgendaView } from './components/VisitsAgendaView';

type ViewTab = 'list' | 'agenda';

export default function VisitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ViewTab>(searchParams.get('tab') === 'agenda' ? 'agenda' : 'list');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestão de Visitas"
        subtitle={
          tab === 'list'
            ? 'Gerencie as visitas aos clientes'
            : 'Agenda por técnico ou equipe, com roteirização simples'
        }
        actions={
          <Button onClick={() => router.push('/visits/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-5">
          <VisitsListView />
        </TabsContent>
        <TabsContent value="agenda" className="mt-5">
          <VisitsAgendaView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

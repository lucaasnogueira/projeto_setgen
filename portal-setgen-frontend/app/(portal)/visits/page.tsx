"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';
import {
  Plus,
  Search,
  ClipboardList,
  Calendar,
  User,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { visitTypeColors, visitTypeLabels } from './lib/visit-type-labels';

export default function VisitsPage() {
  const [visits, setVisits] = useState<TechnicalVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      const data = await visitsApi.getAll();
      setVisits(data);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(visit =>
    visit.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Visitas Técnicas"
        subtitle="Gerencie as visitas aos clientes"
        actions={
          <Button onClick={() => router.push('/visits/new')} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVisits.length === 0 ? (
          <Card className="col-span-2 p-16 text-center">
            <ClipboardList className="h-12 w-12 text-border mx-auto mb-3" />
            <p className="text-text-secondary font-medium text-sm">Nenhuma visita encontrada</p>
            <p className="text-text-muted text-xs mt-1">
              {searchTerm ? 'Tente outro termo de busca' : 'Comece agendando uma nova visita'}
            </p>
          </Card>
        ) : (
          filteredVisits.map((visit) => (
            <Card
              key={visit.id}
              className="p-5 hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => router.push(`/visits/${visit.id}`)}
            >
              <div className="flex items-start justify-between mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[10px] bg-status-purple-bg flex items-center justify-center shrink-0">
                    <ClipboardList className="h-5 w-5 text-status-purple-fg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[13.5px] text-foreground">{visit.client?.companyName}</h3>
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-full mt-1 ${visitTypeColors[visit.visitType]}`}>
                      {visitTypeLabels[visit.visitType]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  {new Date(visit.visitDate).toLocaleDateString('pt-BR')}
                </div>
                {visit.technician && (
                  <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                    <User className="h-3.5 w-3.5 text-text-muted" />
                    {visit.technician.name}
                  </div>
                )}
                {visit.location && (
                  <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                    <MapPin className="h-3.5 w-3.5 text-text-muted" />
                    {visit.location}
                  </div>
                )}
              </div>

              {visit.description && (
                <p className="mt-3.5 text-[12.5px] text-text-secondary line-clamp-2">
                  {visit.description}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

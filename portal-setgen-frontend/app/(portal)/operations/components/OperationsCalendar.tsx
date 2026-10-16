"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Phone,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { CalendarVisit, INITIAL_CALENDAR_VISITS } from "../data/mock-operations";
import { operationsApi } from "@/lib/api/operations";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OperationsCalendarProps {
  onSelectClientProcess?: (processId: string) => void;
}

export function OperationsCalendar({ onSelectClientProcess }: OperationsCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 14)); // Outubro 2026
  const [visits, setVisits] = useState<CalendarVisit[]>(INITIAL_CALENDAR_VISITS);
  const [selectedTech, setSelectedTech] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedVisit, setSelectedVisit] = useState<CalendarVisit | null>(null);

  const loadVisits = React.useCallback(() => {
    operationsApi.getCalendar().then((live) => {
      if (live && live.length > 0) {
        setVisits(live as any);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadVisits();

    // Polling em tempo real a cada 10 segundos
    const interval = setInterval(loadVisits, 10000);

    // Atualiza imediatamente quando foca na tela
    window.addEventListener("focus", loadVisits);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", loadVisits);
    };
  }, [loadVisits]);

  // Month navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date(2026, 9, 14));

  // Calendar dates generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchTech = selectedTech === "ALL" || v.technician.name.includes(selectedTech);
      const matchType = selectedType === "ALL" || v.visitType === selectedType;
      return matchTech && matchType;
    });
  }, [visits, selectedTech, selectedType]);

  const getVisitsForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return filteredVisits.filter((v) => v.date === dateStr);
  };

  const getVisitTypeBadge = (type: CalendarVisit['visitType']) => {
    switch (type) {
      case 'LEVANTAMENTO':
        return { label: 'Levantamento', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' };
      case 'PREVENTIVA':
        return { label: 'Preventiva', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
      case 'CORRETIVA':
        return { label: 'Corretiva', bg: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' };
      case 'VISTORIA_FINAL':
        return { label: 'Vistoria Final', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
      case 'COMISSIONAMENTO':
        return { label: 'Comissionamento', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
      default:
        return { label: type, bg: 'bg-muted text-foreground' };
    }
  };

  const getStatusBadge = (status: CalendarVisit['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'Em Execução', class: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'COMPLETED':
        return { label: 'Concluída', class: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Cancelada', class: 'text-red-600 bg-red-50 border-red-200' };
      default:
        return { label: 'Agendada', class: 'text-blue-600 bg-blue-50 border-blue-200' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/80 shadow-2xs">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            className="h-8 w-8 p-0 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="h-8 text-xs font-semibold px-2.5 rounded-lg"
          >
            Hoje
          </Button>

          <h2 className="text-base sm:text-lg font-bold text-foreground capitalize ml-2">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="w-44">
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-muted/40 border-border">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Técnicos</SelectItem>
                <SelectItem value="Carlos">Carlos Eduardo</SelectItem>
                <SelectItem value="Marcos">Marcos Vinicius</SelectItem>
                <SelectItem value="Lucas">Lucas Ferreira</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-muted/40 border-border">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                <SelectItem value="LEVANTAMENTO">Levantamento</SelectItem>
                <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                <SelectItem value="CORRETIVA">Corretiva</SelectItem>
                <SelectItem value="VISTORIA_FINAL">Vistoria Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={() => router.push('/visits/new')}
            className="h-8 text-xs rounded-xl font-bold bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Visita
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-border/70 text-center bg-muted/30">
          {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayName, i) => (
            <div key={dayName} className="py-2.5 text-xs font-bold text-text-muted">
              <span className="hidden sm:inline">{dayName}</span>
              <span className="sm:hidden">{dayName.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
          {calendarDays.map((day, idx) => {
            const dayVisits = getVisitsForDay(day);
            const inCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 transition-colors flex flex-col justify-between ${
                  !inCurrentMonth
                    ? 'bg-muted/15 text-muted-foreground/50'
                    : 'bg-card text-foreground hover:bg-muted/20'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isDayToday
                        ? 'bg-primary text-white ring-2 ring-orange-200 dark:ring-orange-950 font-extrabold'
                        : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {dayVisits.length > 0 && (
                    <span className="text-[10px] font-semibold text-text-muted px-1.5 py-0.5 rounded-full bg-muted/60">
                      {dayVisits.length} {dayVisits.length === 1 ? 'visita' : 'visitas'}
                    </span>
                  )}
                </div>

                {/* Day Visits List */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-none">
                  {dayVisits.map((visit) => {
                    const typeBadge = getVisitTypeBadge(visit.visitType);
                    const isCompleted = visit.status === 'COMPLETED';
                    const isInProgress = visit.status === 'IN_PROGRESS';

                    return (
                      <div
                        key={visit.id}
                        onClick={() => setSelectedVisit(visit)}
                        className={`text-left p-1.5 rounded-lg border text-[11px] leading-tight cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
                          isCompleted
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200'
                            : isInProgress
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                            : 'bg-muted/40 border-border/80 text-foreground hover:border-primary/40'
                        }`}
                        title={`${visit.time} - ${visit.clientName} (${visit.technician.name})`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold flex items-center gap-1 truncate">
                            <Clock className="h-2.5 w-2.5 text-text-muted shrink-0" />
                            {visit.time}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-semibold shrink-0 ${typeBadge.bg}`}>
                            {typeBadge.label}
                          </span>
                        </div>
                        <div className="font-semibold truncate mt-0.5 text-foreground">
                          {visit.clientName}
                        </div>
                        <div className="text-[9.5px] text-text-muted truncate">
                          {visit.technician.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visit Detail Dialog */}
      {selectedVisit && (
        <Dialog open={!!selectedVisit} onOpenChange={(open) => !open && setSelectedVisit(null)}>
          <DialogContent className="max-w-lg bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-xl">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-primary uppercase">
                <span>{format(new Date(selectedVisit.date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                <span>•</span>
                <span>{selectedVisit.time} ({selectedVisit.duration})</span>
              </div>
              <DialogTitle className="text-sm sm:text-base font-bold flex items-center justify-between">
                <span>{selectedVisit.clientName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(selectedVisit.status).class}`}>
                  {getStatusBadge(selectedVisit.status).label}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                Visita Técnica • {getVisitTypeBadge(selectedVisit.visitType).label}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 my-2 text-xs sm:text-sm">
              <div className="p-3 bg-muted/40 rounded-xl space-y-2 border border-border/60">
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    <strong>Técnico:</strong> {selectedVisit.technician.name} ({selectedVisit.technician.team})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">
                    <strong>Local:</strong> {selectedVisit.location}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    <strong>Telefone:</strong> {selectedVisit.phone}
                  </span>
                </div>
              </div>

              {selectedVisit.notes && (
                <div className="p-3 rounded-xl border border-border bg-card">
                  <span className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                    Instruções & Escopo Técnico
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">{selectedVisit.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedVisit(null);
                  router.push(`/visits`);
                }}
                className="w-full sm:w-auto text-xs gap-1 font-semibold"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Módulo de Visitas
              </Button>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVisit(null)}
                  className="text-xs flex-1 sm:flex-none"
                >
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(`Iniciando checklist de vistoria para ${selectedVisit.clientName}...`);
                    setSelectedVisit(null);
                    router.push(`/visits/new`);
                  }}
                  className="text-xs font-bold bg-primary hover:bg-primary/90 text-white flex-1 sm:flex-none"
                >
                  Iniciar Checklist
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


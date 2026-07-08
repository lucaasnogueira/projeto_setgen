"use client"

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  addDays, startOfDay, endOfDay, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, CalendarDays, Loader2, Route, User, MapPin, Clock,
} from "lucide-react";
import { visitsApi, OptimizedRoute } from "@/lib/api/visits";
import { usersApi } from "@/lib/api/users";
import { teamsApi } from "@/lib/api/teams";
import { TechnicalVisit, Team } from "@/types";
import { visitTypeColors, visitTypeLabels } from "../lib/visit-type-labels";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const RouteMap = dynamic(
  () => import("./RouteMap").then((m) => m.RouteMap),
  { ssr: false, loading: () => <div className="h-96 rounded-2xl bg-muted animate-pulse" /> },
);

type ViewMode = "day" | "week";
type FilterMode = "technician" | "team";

function VisitCard({ visit, router, order }: { visit: TechnicalVisit; router: ReturnType<typeof useRouter>; order?: number }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border hover:border-primary/40 cursor-pointer transition-colors"
      onClick={() => router.push(`/visits/${visit.id}`)}
    >
      {order && (
        <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {order}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[13px] truncate">{visit.client?.companyName}</span>
          <span className={`shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-full ${visitTypeColors[visit.visitType]}`}>
            {visitTypeLabels[visit.visitType]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-text-secondary mt-1">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          {format(new Date(visit.visitDate), "HH:mm")}
          {visit.technician && (
            <>
              <User className="h-3.5 w-3.5 text-text-muted ml-2" />
              {visit.technician.name}
            </>
          )}
        </div>
        {visit.location && (
          <div className="flex items-center gap-2 text-[12px] text-text-secondary mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-text-muted" />
            <span className="truncate">{visit.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function VisitsAgendaView() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<FilterMode>("technician");
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [visits, setVisits] = useState<TechnicalVisit[]>([]);
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    usersApi.getAll().then((all) => setTechnicians(all.filter((u) => u.role === "TECHNICIAN")));
    teamsApi.getAll(true).then(setTeams).catch(() => setTeams([]));
  }, []);

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === "day") {
      return { rangeStart: startOfDay(referenceDate), rangeEnd: endOfDay(referenceDate) };
    }
    const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
    return { rangeStart: start, rangeEnd: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
  }, [referenceDate, viewMode]);

  useEffect(() => {
    setRoute(null);
    setLoading(true);
    visitsApi
      .getAll({
        startDate: rangeStart.toISOString(),
        endDate: rangeEnd.toISOString(),
        technicianId: filterMode === "technician" ? selectedTechnicianId || undefined : undefined,
        teamId: filterMode === "team" ? selectedTeamId || undefined : undefined,
      })
      .then(setVisits)
      .catch(() => setVisits([]))
      .finally(() => setLoading(false));
  }, [rangeStart, rangeEnd, filterMode, selectedTechnicianId, selectedTeamId]);

  const navigate = (direction: 1 | -1) => {
    setReferenceDate((d) => addDays(d, direction * (viewMode === "day" ? 1 : 7)));
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const result = await visitsApi.getRoute({
        date: format(referenceDate, "yyyy-MM-dd"),
        technicianId: filterMode === "technician" ? selectedTechnicianId || undefined : undefined,
        teamId: filterMode === "team" ? selectedTeamId || undefined : undefined,
      });
      setRoute(result);
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao otimizar rota");
    } finally {
      setOptimizing(false);
    }
  };

  const canOptimize =
    viewMode === "day" &&
    visits.length > 0 &&
    ((filterMode === "technician" && !!selectedTechnicianId) ||
      (filterMode === "team" && !!selectedTeamId));

  const sortedDayVisits = [...visits].sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime(),
  );
  const displayVisits = route ? route.visits : sortedDayVisits;
  const mapVisits = route ? route.visits : sortedDayVisits;

  const weekDays = viewMode === "week" ? eachDayOfInterval({ start: rangeStart, end: rangeEnd }) : [];

  return (
    <div className="space-y-5">
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setReferenceDate(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="ml-2 font-bold text-[14px] flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-600" />
              {viewMode === "day"
                ? format(referenceDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                : `${format(rangeStart, "dd/MM")} - ${format(rangeEnd, "dd/MM")}`}
            </span>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <TabsList>
              <TabsTrigger value="technician">Por Técnico</TabsTrigger>
              <TabsTrigger value="team">Por Equipe</TabsTrigger>
            </TabsList>
          </Tabs>

          {filterMode === "technician" ? (
            <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
              <SelectTrigger className="w-56 h-10 rounded-xl">
                <SelectValue placeholder="Selecione um técnico" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-56 h-10 rounded-xl">
                <SelectValue placeholder="Selecione uma equipe" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={handleOptimize}
            disabled={!canOptimize || optimizing}
          >
            {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
            Otimizar rota do dia
          </Button>
        </div>

        {route && (
          <p className="text-xs text-muted-foreground">
            ~{route.totalDistanceKm.toFixed(2)} km em linha reta — estimativa, não é distância de rota real.
            {route.unroutedCount > 0 && ` ${route.unroutedCount} visita(s) sem coordenadas foram adicionadas ao fim.`}
          </p>
        )}
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : viewMode === "day" ? (
        <>
          <Card className="p-4 space-y-2">
            {displayVisits.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Nenhuma visita neste dia.</p>
            ) : (
              displayVisits.map((v) => (
                <VisitCard key={v.id} visit={v} router={router} order={route ? (v as any).routeOrder : undefined} />
              ))
            )}
          </Card>
          <RouteMap visits={mapVisits} />
        </>
      ) : (
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dayVisits = sortedDayVisits.filter((v) => isSameDay(new Date(v.visitDate), day));
            return (
              <Card key={day.toISOString()} className="p-4">
                <h3 className="font-bold text-[13px] mb-3 capitalize">
                  {format(day, "EEEE, dd/MM", { locale: ptBR })}
                </h3>
                {dayVisits.length === 0 ? (
                  <p className="text-xs text-text-muted">Sem visitas.</p>
                ) : (
                  <div className="space-y-2">
                    {dayVisits.map((v) => (
                      <VisitCard key={v.id} visit={v} router={router} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

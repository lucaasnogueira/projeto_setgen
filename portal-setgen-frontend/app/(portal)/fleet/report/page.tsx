"use client";

import { useEffect, useState } from "react";
import { vehiclesApi } from "@/lib/api/vehicles";
import { VehicleTrip, VehicleTripStatus } from "@/types";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

export default function FleetReportPage() {
  const [trips, setTrips] = useState<VehicleTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await vehiclesApi.getTrips({
        from: from || undefined,
        to: to ? new Date(new Date(to).getTime() + 86400000).toISOString() : undefined,
      });
      setTrips(data);
    } catch (error) {
      console.error("Erro ao carregar histórico da frota:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = trips.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.driver?.name?.toLowerCase().includes(term) ||
      t.vehicle?.name?.toLowerCase().includes(term) ||
      t.vehicle?.plate?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5 print:space-y-2">
      <div className="print:hidden">
        <PageHeader
          title="Histórico de Frota"
          subtitle={`${filtered.length} saídas registradas`}
          actions={
            <Button variant="outline" onClick={() => window.print()} className="rounded-[9px] font-bold gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          }
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border print:hidden">
          <input
            type="text"
            placeholder="Buscar motorista, carro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60 px-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 h-9" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 h-9" />
          <Button size="sm" onClick={loadTrips} disabled={loading}>
            Filtrar
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Veículo</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Volta</TableHead>
              <TableHead>KM Saída</TableHead>
              <TableHead>KM Volta</TableHead>
              <TableHead>Total Rodado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty colSpan={8} message={loading ? "Carregando..." : "Nenhuma saída encontrada"} />
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="text-[13px] font-bold text-foreground">{t.vehicle?.name}</div>
                    <div className="text-[11.5px] text-text-muted">{t.vehicle?.plate}</div>
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{t.driver?.name}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{t.destination}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{new Date(t.startedAt).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {t.endedAt ? new Date(t.endedAt).toLocaleString("pt-BR") : "-"}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">{t.startKm.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-[12.5px] text-text-secondary">
                    {t.endKm != null ? t.endKm.toLocaleString("pt-BR") : "-"}
                  </TableCell>
                  <TableCell className="text-[12.5px] font-bold text-foreground">
                    {t.status === VehicleTripStatus.RETURNED && t.endKm != null
                      ? `${(t.endKm - t.startKm).toLocaleString("pt-BR")} km`
                      : "Em trânsito"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

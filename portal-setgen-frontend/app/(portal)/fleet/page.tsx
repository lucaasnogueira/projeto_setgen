"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { vehiclesApi } from "@/lib/api/vehicles";
import { employeeApi } from "@/lib/api/employees";
import { fuelRequestsApi } from "@/lib/api/fuel-requests";
import { Vehicle, VehicleTrip, Employee, EmployeeStatus, FuelRequest, FuelRequestStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Truck, ArrowRight, Fuel, CheckCircle, XCircle, User, Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthImage } from "@/components/ui/auth-image";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

export default function FleetPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [openTrips, setOpenTrips] = useState<VehicleTrip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fuelRequests, setFuelRequests] = useState<FuelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [oilEdits, setOilEdits] = useState<Record<string, { lastOilChangeKm: number; oilChangeIntervalKm: number }>>({});
  const [savingOilId, setSavingOilId] = useState<string | null>(null);

  const [tripForm, setTripForm] = useState({ vehicleId: "", driverId: "", destination: "", startKm: "" });
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [finishKm, setFinishKm] = useState<Record<string, string>>({});
  const [finishingId, setFinishingId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [vehiclesData, openTripsData, employeesData, fuelRequestsData] = await Promise.all([
        vehiclesApi.getAll(),
        vehiclesApi.getOpenTrips(),
        // status como query param quebra a validação do /employees (bug pré-existente
        // no backend) — filtra ativos no client em vez de passar o filtro pra API.
        employeeApi.getAll(undefined, 1, 200),
        fuelRequestsApi.getAll(),
      ]);
      setVehicles(vehiclesData);
      setOpenTrips(openTripsData);
      setEmployees(employeesData.data.filter((e) => e.status === EmployeeStatus.ACTIVE));
      setFuelRequests(fuelRequestsData);
      setOilEdits(
        Object.fromEntries(
          vehiclesData.map((v) => [v.id, { lastOilChangeKm: v.lastOilChangeKm, oilChangeIntervalKm: v.oilChangeIntervalKm }]),
        ),
      );
    } catch (error) {
      console.error("Erro ao carregar frota:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOil = async (vehicleId: string) => {
    const edit = oilEdits[vehicleId];
    if (!edit) return;
    setSavingOilId(vehicleId);
    try {
      const updated = await vehiclesApi.updateOil(vehicleId, edit);
      setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? updated : v)));
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao salvar troca de óleo");
    } finally {
      setSavingOilId(null);
    }
  };

  const handleCreateTrip = async () => {
    if (!tripForm.vehicleId || !tripForm.driverId || !tripForm.destination || !tripForm.startKm) {
      alert("Preencha veículo, motorista, destino e KM de saída");
      return;
    }
    setCreatingTrip(true);
    try {
      await vehiclesApi.createTrip(tripForm.vehicleId, {
        driverId: tripForm.driverId,
        destination: tripForm.destination,
        startKm: Number(tripForm.startKm),
      });
      setTripForm({ vehicleId: "", driverId: "", destination: "", startKm: "" });
      const openTripsData = await vehiclesApi.getOpenTrips();
      setOpenTrips(openTripsData);
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao registrar saída");
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleFinishTrip = async (tripId: string) => {
    const km = finishKm[tripId];
    if (!km) {
      alert("Informe o KM de chegada");
      return;
    }
    setFinishingId(tripId);
    try {
      await vehiclesApi.finishTrip(tripId, Number(km));
      setOpenTrips((prev) => prev.filter((t) => t.id !== tripId));
      const vehiclesData = await vehiclesApi.getAll();
      setVehicles(vehiclesData);
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao finalizar saída");
    } finally {
      setFinishingId(null);
    }
  };

  const handleApproveFuelRequest = async (id: string) => {
    try {
      await fuelRequestsApi.approve(id);
      const data = await fuelRequestsApi.getAll();
      setFuelRequests(data);
      alert("Requisição aprovada — despesa lançada no financeiro");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao aprovar requisição");
    }
  };

  const handleRejectFuelRequest = async (id: string) => {
    const reason = prompt("Motivo da rejeição (mín. 10 caracteres):");
    if (!reason) return;
    try {
      await fuelRequestsApi.reject(id, reason);
      const data = await fuelRequestsApi.getAll();
      setFuelRequests(data);
      alert("Requisição rejeitada");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao rejeitar requisição");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fuelStatusLabels: Record<FuelRequestStatus, string> = {
    [FuelRequestStatus.PENDING]: "Pendente",
    [FuelRequestStatus.APPROVED]: "Aprovado",
    [FuelRequestStatus.REJECTED]: "Rejeitado",
  };
  const fuelStatusClasses: Record<FuelRequestStatus, string> = {
    [FuelRequestStatus.PENDING]: "bg-status-amber-bg text-status-amber-fg",
    [FuelRequestStatus.APPROVED]: "bg-status-green-bg text-status-green-fg",
    [FuelRequestStatus.REJECTED]: "bg-status-red-bg text-status-red-fg",
  };
  const pendingFuelRequests = fuelRequests.filter((r) => r.status === FuelRequestStatus.PENDING);
  const otherFuelRequests = fuelRequests.filter((r) => r.status !== FuelRequestStatus.PENDING);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Frota"
        subtitle={`${vehicles.length} veículos cadastrados`}
        actions={
          <Button onClick={() => router.push("/fleet/new")} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Button>
        }
      />

      <Tabs defaultValue="veiculos">
        <TabsList>
          <TabsTrigger value="veiculos">Veículos Cadastrados</TabsTrigger>
          <TabsTrigger value="oleo">Controle de Óleo</TabsTrigger>
          <TabsTrigger value="saidas">Controle de Saídas</TabsTrigger>
          <TabsTrigger value="abastecimento">
            Abastecimento{pendingFuelRequests.length > 0 ? ` (${pendingFuelRequests.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="veiculos" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-t-0 hover:bg-transparent">
                  <TableHead>Veículo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>KM Atual</TableHead>
                  <TableHead>Status do Óleo</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableEmpty colSpan={5} message="Nenhum veículo cadastrado" />
                ) : (
                  vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {v.photoUrl ? (
                            <AuthImage
                              src={v.photoUrl}
                              alt={v.name}
                              className="w-[34px] h-[34px] rounded-[9px] object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 bg-blue-50 text-blue-700">
                              <Truck className="h-4 w-4" />
                            </div>
                          )}
                          <span className="text-[13px] font-bold text-foreground">{v.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-text-secondary">{v.plate}</TableCell>
                      <TableCell className="text-[12.5px] text-text-secondary">{v.currentKm.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell>
                        <Badge className={v.oilStatus === "TROCAR" ? "bg-status-red-bg text-status-red-fg" : "bg-status-green-bg text-status-green-fg"}>
                          {v.oilStatus === "TROCAR" ? "Trocar óleo" : "OK"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/fleet/${v.id}/edit`)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="oleo" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-t-0 hover:bg-transparent">
                  <TableHead>Veículo / Placa</TableHead>
                  <TableHead>KM Atual</TableHead>
                  <TableHead>KM Última Troca</TableHead>
                  <TableHead>Intervalo (KM)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableEmpty colSpan={6} message="Nenhum veículo cadastrado" />
                ) : (
                  vehicles.map((v) => {
                    const edit = oilEdits[v.id] || { lastOilChangeKm: v.lastOilChangeKm, oilChangeIntervalKm: v.oilChangeIntervalKm };
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="text-[13px] font-bold text-foreground">{v.name}</div>
                          <div className="text-[11.5px] text-text-muted">{v.plate}</div>
                        </TableCell>
                        <TableCell className="text-[12.5px] text-text-secondary">{v.currentKm.toLocaleString("pt-BR")} km</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={edit.lastOilChangeKm}
                            onChange={(e) =>
                              setOilEdits((prev) => ({ ...prev, [v.id]: { ...edit, lastOilChangeKm: Number(e.target.value) } }))
                            }
                            className="h-9 w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={edit.oilChangeIntervalKm}
                            onChange={(e) =>
                              setOilEdits((prev) => ({ ...prev, [v.id]: { ...edit, oilChangeIntervalKm: Number(e.target.value) } }))
                            }
                            className="h-9 w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge className={v.oilStatus === "TROCAR" ? "bg-status-red-bg text-status-red-fg" : "bg-status-green-bg text-status-green-fg"}>
                            {v.oilStatus === "TROCAR" ? `Trocar (faltam ${v.kmUntilOilChange} km)` : `OK (faltam ${v.kmUntilOilChange} km)`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" disabled={savingOilId === v.id} onClick={() => handleSaveOil(v.id)}>
                            {savingOilId === v.id ? "Salvando..." : "Salvar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="saidas" className="mt-4 space-y-5">
          <Card className="p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-foreground">Registrar Saída</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={tripForm.vehicleId} onValueChange={(val) => setTripForm({ ...tripForm, vehicleId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} — {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tripForm.driverId} onValueChange={(val) => setTripForm({ ...tripForm, driverId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Motorista..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Destino (cliente ou finalidade)"
                value={tripForm.destination}
                onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                placeholder="KM de saída"
                value={tripForm.startKm}
                onChange={(e) => setTripForm({ ...tripForm, startKm: e.target.value })}
              />
            </div>
            <Button onClick={handleCreateTrip} disabled={creatingTrip} className="rounded-[9px] font-bold">
              {creatingTrip ? "Registrando..." : "Registrar Saída"}
            </Button>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-[13px] font-bold text-foreground">Veículos em Trânsito (Na Rua)</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-t-0 hover:bg-transparent">
                  <TableHead>Carro / Placa</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>KM Inicial</TableHead>
                  <TableHead className="w-[220px]">Retorno (KM Final)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openTrips.length === 0 ? (
                  <TableEmpty colSpan={6} message="Nenhum veículo em trânsito" />
                ) : (
                  openTrips.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="text-[13px] font-bold text-foreground">{t.vehicle?.name}</div>
                        <div className="text-[11.5px] text-text-muted">{t.vehicle?.plate}</div>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-text-secondary">{t.driver?.name}</TableCell>
                      <TableCell className="text-[12.5px] text-text-secondary">{t.destination}</TableCell>
                      <TableCell className="text-[12.5px] text-text-secondary">
                        {new Date(t.startedAt).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-text-secondary">{t.startKm.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={t.startKm}
                            placeholder="KM chegada"
                            value={finishKm[t.id] || ""}
                            onChange={(e) => setFinishKm((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            className="h-9 w-28"
                          />
                          <Button size="sm" disabled={finishingId === t.id} onClick={() => handleFinishTrip(t.id)}>
                            {finishingId === t.id ? "..." : "Finalizar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Link href="/fleet/report" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline">
            Ver histórico completo
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </TabsContent>

        <TabsContent value="abastecimento" className="mt-4 space-y-3.5">
          <div className="flex justify-end">
            <Button onClick={() => router.push("/fuel-requests/new")} className="rounded-[9px] font-bold gap-2">
              <Plus className="h-4 w-4" />
              Nova Requisição
            </Button>
          </div>

          {fuelRequests.length === 0 ? (
            <Card className="p-16 text-center">
              <Fuel className="h-12 w-12 text-status-green-fg mx-auto mb-3" />
              <p className="text-text-secondary font-bold text-[15px]">Nenhuma requisição ainda</p>
            </Card>
          ) : (
            [...pendingFuelRequests, ...otherFuelRequests].map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[10px] bg-status-amber-bg flex items-center justify-center shrink-0">
                      <Fuel className="h-5 w-5 text-status-amber-fg" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px] text-foreground">
                        {r.vehicle?.name} — {r.vehicle?.plate}
                      </h3>
                      <p className="text-[12.5px] text-text-muted">
                        {r.liters}L × {formatCurrency(r.unitPrice)} = {formatCurrency(r.totalValue)}
                      </p>
                    </div>
                  </div>
                  <Badge className={fuelStatusClasses[r.status]}>{fuelStatusLabels[r.status]}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5">
                  <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                    <User className="h-3.5 w-3.5 text-text-muted" />
                    Solicitado por {r.requestedBy?.name || "-"}
                  </div>
                  <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    {new Date(r.requestedAt).toLocaleString("pt-BR")}
                  </div>
                </div>

                {r.status === FuelRequestStatus.REJECTED && r.rejectionReason && (
                  <div className="bg-status-red-bg/30 rounded-[10px] p-3.5 mb-3.5">
                    <p className="text-[12.5px] font-bold text-foreground mb-1">Motivo da rejeição:</p>
                    <p className="text-[12.5px] text-text-secondary">{r.rejectionReason}</p>
                  </div>
                )}

                {r.status === FuelRequestStatus.APPROVED && r.approver && (
                  <p className="text-[12.5px] text-text-muted mb-3.5">Aprovado por {r.approver.name}</p>
                )}

                {r.status === FuelRequestStatus.PENDING && (
                  <div className="flex gap-2.5">
                    <Button
                      onClick={() => handleApproveFuelRequest(r.id)}
                      className="flex-1 rounded-[9px] font-bold gap-2 bg-status-green-fg hover:bg-status-green-fg/90"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button onClick={() => handleRejectFuelRequest(r.id)} variant="destructive" className="flex-1 rounded-[9px] font-bold gap-2">
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

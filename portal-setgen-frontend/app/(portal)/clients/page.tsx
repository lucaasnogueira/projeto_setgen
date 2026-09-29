"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { Client, ClientStatus, UserRole } from "@/types";
import { useAuthStore } from "@/store/auth";
import { getInitials, getAvatarColor, formatDate } from "@/lib/utils";
import { Plus, Search, Users, UserCheck, UserX, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { InlineDeleteAction } from "@/components/ui/inline-delete-action";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.ADMINISTRATIVE;
  const canDelete = user?.role === UserRole.ADMIN;

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      client.companyName?.toLowerCase().includes(term) ||
      client.tradeName?.toLowerCase().includes(term) ||
      client.cnpjCpf?.toLowerCase().includes(term)
    );
  });

  const totalAtivos = clients.filter(c => c.status === ClientStatus.ACTIVE).length;
  const totalInativos = clients.filter(c => c.status === ClientStatus.INACTIVE).length;
  const totalInadimplentes = clients.filter(c => c.status === ClientStatus.DEFAULTER).length;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await clientsApi.delete(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

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
        title="Clientes"
        subtitle={`${filteredClients.length} clientes cadastrados`}
        actions={
          <Button
            onClick={() => router.push("/clients/new")}
            className="rounded-[9px] font-bold gap-2 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Clientes" value={clients.length} icon={Building2} variant="orange" />
        <StatusCard label="Ativos" value={totalAtivos} icon={UserCheck} variant="emerald" />
        <StatusCard label="Inativos" value={totalInativos} icon={Users} variant="slate" />
        <StatusCard label="Inadimplentes" value={totalInadimplentes} icon={UserX} variant="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, fantasia ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Cliente</TableHead>
              <TableHead>CNPJ / CPF</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cidade / UF</TableHead>
              <TableHead>Grupo / Segmento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableEmpty colSpan={8} message="Nenhum cliente encontrado" />
            ) : (
              filteredClients.map((client) => {
                const color = getAvatarColor(client.companyName);
                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 font-bold text-xs ${color.bg} ${color.fg}`}>
                          {getInitials(client.companyName)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-foreground truncate">{client.companyName}</div>
                          {client.tradeName && (
                            <div className="text-[11.5px] text-muted-foreground truncate">{client.tradeName}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground font-mono">{client.cnpjCpf}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">
                      <div>{client.email}</div>
                      <div className="text-muted-foreground/70">{client.phone}</div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">
                      {client.address?.city}{client.address?.state ? `/${client.address.state}` : ""}
                    </TableCell>
                    <TableCell className="text-[12px]">
                      <div className="flex flex-wrap gap-1">
                        {client.group && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700">
                            {client.group.name}
                          </span>
                        )}
                        {client.segment && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                            {client.segment.name}
                          </span>
                        )}
                        {!client.group && !client.segment && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        client.status === ClientStatus.ACTIVE ? "bg-emerald-50 text-emerald-700" :
                        client.status === ClientStatus.DEFAULTER ? "bg-red-50 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {client.status === ClientStatus.ACTIVE ? "Ativo"
                          : client.status === ClientStatus.DEFAULTER ? "Inadimplente"
                          : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">{formatDate(client.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <InlineDeleteAction
                        confirming={confirmingId === client.id}
                        deleting={deletingId === client.id}
                        onView={() => router.push(`/clients/${client.id}`)}
                        onEdit={canEdit ? () => router.push(`/clients/${client.id}/edit`) : undefined}
                        onRequestDelete={canDelete ? () => setConfirmingId(client.id) : undefined}
                        onConfirmDelete={() => handleDelete(client.id)}
                        onCancelDelete={() => setConfirmingId(null)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

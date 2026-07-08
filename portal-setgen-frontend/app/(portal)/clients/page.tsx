"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { Client, UserRole } from "@/types";
import { useAuthStore } from "@/store/auth";
import { getInitials, getAvatarColor, formatDate } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineDeleteAction } from "@/components/ui/inline-delete-action";
import { useInlineDelete } from "@/lib/hooks/use-inline-delete";
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
  const router = useRouter();
  const { user } = useAuthStore();
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.ADMINISTRATIVE;
  const canDelete = user?.role === UserRole.ADMIN;
  const { confirmId, deleting, requestDelete, cancelDelete, confirmDelete } = useInlineDelete(
    (id) => clientsApi.delete(id),
    (id) => setClients((prev) => prev.filter((c) => c.id !== id))
  );

  useEffect(() => {
    loadClients();
  }, []);

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
          <Button onClick={() => router.push("/clients/new")} className="rounded-[9px] font-bold gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-border rounded-[8px] text-[12.5px] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent">
              <TableHead>Cliente</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Grupo/Segmento</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableEmpty colSpan={7} message="Nenhum cliente encontrado" />
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
                            <div className="text-[11.5px] text-text-muted truncate">{client.tradeName}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">{client.cnpjCpf}</TableCell>
                    <TableCell className="text-[12px] text-text-secondary">
                      <div>{client.email}</div>
                      <div className="text-text-muted">{client.phone}</div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">
                      {client.address?.city}/{client.address?.state}
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
                        {!client.group && !client.segment && (
                          <span className="text-text-muted">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-text-secondary">{formatDate(client.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <InlineDeleteAction
                        confirming={confirmId === client.id}
                        deleting={deleting}
                        onView={() => router.push(`/clients/${client.id}`)}
                        onEdit={canEdit ? () => router.push(`/clients/${client.id}/edit`) : undefined}
                        onRequestDelete={canDelete ? () => requestDelete(client.id) : undefined}
                        onConfirmDelete={() => confirmDelete(client.id)}
                        onCancelDelete={cancelDelete}
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

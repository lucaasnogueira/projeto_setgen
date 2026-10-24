"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { usersApi, User } from "@/lib/api/users";
import { teamsApi } from "@/lib/api/teams";
import { Client, ClientStatus, UserRole, Team } from "@/types";
import { useAuthStore } from "@/store/auth";
import { normalizeRoleKey } from "@/lib/permissions";
import {
  getInitials,
  getAvatarColor,
  formatDate,
  formatCNPJ,
  formatCPF,
  formatPhone,
} from "@/lib/utils";
import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Building2,
  X,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { TablePagination } from "@/components/ui/pagination";
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
import { ImportExportDropdown } from "@/components/ui/import-export-dropdown";

const ITEMS_PER_PAGE = 10;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("ALL");
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useAuthStore();

  const roleKey = normalizeRoleKey(user?.role, user?.roleName || user?.roleRef?.name);
  const canEdit = !user || roleKey === "ADMIN" || roleKey === "MANAGER" || roleKey === "ADMINISTRATIVO_COMPRAS";
  const canDelete = !user || roleKey === "ADMIN";

  useEffect(() => {
    loadClients();
    usersApi.getSelectable().then(setUsers).catch(() => setUsers([]));
    teamsApi.getAll(true).then(setTeams).catch(() => setTeams([]));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedUserFilter, selectedTeamFilter]);

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

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return clients
      .filter((client) => {
        const matchesSearch =
          !term ||
          client.companyName?.toLowerCase().includes(term) ||
          client.tradeName?.toLowerCase().includes(term) ||
          client.cnpjCpf?.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term) ||
          client.phone?.includes(term) ||
          client.responsibleUser?.name?.toLowerCase().includes(term) ||
          client.responsibleTeam?.name?.toLowerCase().includes(term) ||
          client.onSiteContact?.toLowerCase().includes(term);

        const matchesStatus =
          statusFilter === "ALL" || client.status === statusFilter;

        const matchesUser =
          selectedUserFilter === "ALL" ||
          (selectedUserFilter === "UNASSIGNED"
            ? !client.responsibleUserId && !client.responsibleUser
            : client.responsibleUserId === selectedUserFilter ||
              client.responsibleUser?.id === selectedUserFilter);

        const matchesTeam =
          selectedTeamFilter === "ALL" ||
          (selectedTeamFilter === "UNASSIGNED"
            ? !client.responsibleTeamId && !client.responsibleTeam
            : client.responsibleTeamId === selectedTeamFilter ||
              client.responsibleTeam?.id === selectedTeamFilter);

        return matchesSearch && matchesStatus && matchesUser && matchesTeam;
      })
      .sort((a, b) => {
        const nameA = a.companyName || a.tradeName || "";
        const nameB = b.companyName || b.tradeName || "";
        return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
      });
  }, [clients, searchTerm, statusFilter, selectedUserFilter, selectedTeamFilter]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, currentPage]);

  const totalAtivos = clients.filter((c) => c.status === ClientStatus.ACTIVE).length;
  const totalInativos = clients.filter((c) => c.status === ClientStatus.INACTIVE).length;
  const totalInadimplentes = clients.filter((c) => c.status === ClientStatus.DEFAULTER).length;

  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== "ALL" ||
    selectedUserFilter !== "ALL" ||
    selectedTeamFilter !== "ALL";

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await clientsApi.delete(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
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
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#E2661D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 font-medium">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com Ações */}
      <PageHeader
        title="Clientes"
        subtitle="Gerencie a base de clientes, contratos e plantas atendidas"
        actions={
          <div className="flex items-center gap-2">
            <ImportExportDropdown
              title="Clientes"
              entityName="Clientes"
              data={filteredClients.map((c) => ({
                "Código": c.externalCode || "",
                "Razão Social": c.companyName || "",
                "Nome Fantasia": c.tradeName || "",
                "CNPJ / CPF": c.cnpjCpf || "",
                "Telefone": c.phone || "",
                "E-mail": c.email || "",
                "Endereço": typeof c.address === "object" ? `${c.address?.street || ""}, ${c.address?.number || ""} - ${c.address?.city || ""}/${c.address?.state || ""}` : String(c.address || ""),
                "Status": c.status === ClientStatus.ACTIVE ? "Ativo" : "Inativo",
                "Colaborador Responsável": c.responsibleUser?.name || "Não atribuído",
                "Equipe Responsável": c.responsibleTeam?.name || "Não atribuída",
                "Contato no Local": c.onSiteContact || "",
              }))}
              exportFilename="clientes_setgen"
              templateColumns={[
                "Código",
                "Razão social",
                "Nome",
                "CPF ou CNPJ",
                "Telefone corporativo",
                "E-mail corporativo",
                "Endereço",
                "Status",
                "Falar com",
                "Observação",
              ]}
              templateSampleRow={{
                "Código": "CLI-001",
                "Razão social": "EMPRESA EXEMPLO LTDA",
                "Nome": "EXEMPLO",
                "CPF ou CNPJ": "00.000.000/0001-00",
                "Telefone corporativo": "(92) 99999-9999",
                "E-mail corporativo": "contato@exemplo.com",
                "Endereço": "Rua Exemplo, 100, Centro, Manaus, AM, 69000-000",
                "Status": "Ativo",
                "Falar com": "Responsável",
                "Observação": "Observações do cliente",
              }}
              onImport={clientsApi.bulkImport}
              onSuccess={loadClients}
            />
            {canEdit && (
              <Button
                onClick={() => router.push("/clients/new")}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs text-xs font-semibold h-8.5 px-3.5"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Novo Cliente
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards interativos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatusCard
          label="Total de Clientes"
          value={clients.length}
          icon={Building2}
          variant="orange"
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer transition-all ${
            statusFilter === "ALL"
              ? "ring-2 ring-[#E2661D] border-[#E2661D]/50 shadow-xs"
              : "hover:border-gray-300"
          }`}
        />
        <StatusCard
          label="Ativos"
          value={totalAtivos}
          icon={UserCheck}
          variant="emerald"
          onClick={() =>
            setStatusFilter(statusFilter === ClientStatus.ACTIVE ? "ALL" : ClientStatus.ACTIVE)
          }
          className={`cursor-pointer transition-all ${
            statusFilter === ClientStatus.ACTIVE
              ? "ring-2 ring-emerald-500 border-emerald-500/50 shadow-xs"
              : "hover:border-gray-300"
          }`}
        />
        <StatusCard
          label="Inativos"
          value={totalInativos}
          icon={Users}
          variant="slate"
          onClick={() =>
            setStatusFilter(statusFilter === ClientStatus.INACTIVE ? "ALL" : ClientStatus.INACTIVE)
          }
          className={`cursor-pointer transition-all ${
            statusFilter === ClientStatus.INACTIVE
              ? "ring-2 ring-slate-400 border-slate-400/50 shadow-xs"
              : "hover:border-gray-300"
          }`}
        />
        <StatusCard
          label="Inadimplentes"
          value={totalInadimplentes}
          icon={UserX}
          variant="red"
          onClick={() =>
            setStatusFilter(
              statusFilter === ClientStatus.DEFAULTER ? "ALL" : ClientStatus.DEFAULTER
            )
          }
          className={`cursor-pointer transition-all ${
            statusFilter === ClientStatus.DEFAULTER
              ? "ring-2 ring-rose-500 border-rose-500/50 shadow-xs"
              : "hover:border-gray-300"
          }`}
        />
      </div>

      <Card className="overflow-hidden border border-border/80 shadow-xs">
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 border-b border-border bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por cliente, CNPJ, responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
                  title="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Colaborador Responsável */}
            <div className="relative">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="h-8 pl-2.5 pr-7 border border-border rounded-lg text-[11.5px] font-medium bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] cursor-pointer"
                title="Filtrar por Colaborador Responsável"
              >
                <option value="ALL">👤 Todos os Colaboradores</option>
                <option value="UNASSIGNED">⚠️ Sem colaborador</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Equipe Responsável */}
            <div className="relative">
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="h-8 pl-2.5 pr-7 border border-border rounded-lg text-[11.5px] font-medium bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] cursor-pointer"
                title="Filtrar por Equipe Responsável"
              >
                <option value="ALL">👥 Todas as Equipes</option>
                <option value="UNASSIGNED">⚠️ Sem equipe</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    👥 {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro rápido por Status com Contadores */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
              {[
                { id: "ALL", label: "Todos", count: clients.length },
                { id: ClientStatus.ACTIVE, label: "Ativos", count: totalAtivos },
                { id: ClientStatus.INACTIVE, label: "Inativos", count: totalInativos },
                { id: ClientStatus.DEFAULTER, label: "Inadimplentes", count: totalInadimplentes },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-[11.5px] font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      statusFilter === tab.id
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setSelectedUserFilter("ALL");
                setSelectedTeamFilter("ALL");
              }}
              className="h-7 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Tabela com Coluna de Responsável para Controle Total */}
        <Table containerClassName="overflow-x-auto lg:overflow-x-visible">
          <TableHeader>
            <TableRow className="border-t-0 hover:bg-transparent bg-slate-50/70">
              <TableHead className="min-w-[240px]">Cliente</TableHead>
              <TableHead className="w-[160px] whitespace-nowrap">CNPJ / CPF</TableHead>
              <TableHead className="min-w-[190px] whitespace-nowrap">Contato</TableHead>
              <TableHead className="min-w-[200px] whitespace-nowrap">Responsável</TableHead>
              <TableHead className="w-[120px] whitespace-nowrap text-center">Status</TableHead>
              <TableHead className="w-[90px] whitespace-nowrap text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={Users}
                message={
                  hasActiveFilters
                    ? "Nenhum cliente encontrado para os filtros selecionados"
                    : "Nenhum cliente cadastrado no sistema"
                }
              />
            ) : (
              paginatedClients.map((client) => {
                const color = getAvatarColor(client.companyName);
                const showTradeName =
                  client.tradeName &&
                  client.tradeName.trim().toLowerCase() !== client.companyName.trim().toLowerCase();

                return (
                  <TableRow
                    key={client.id}
                    className="group cursor-pointer hover:bg-orange-50/20 transition-colors"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    {/* Cliente: Avatar + Razão Social + Nome Fantasia + Tags */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${color.bg} ${color.fg}`}
                        >
                          {getInitials(client.companyName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-[13px] font-bold text-foreground group-hover:text-[#E2661D] transition-colors truncate"
                            title={client.companyName}
                          >
                            {client.companyName}
                          </div>
                          {showTradeName && (
                            <div
                              className="text-[11.5px] text-muted-foreground truncate"
                              title={client.tradeName}
                            >
                              {client.tradeName}
                            </div>
                          )}
                          {(client.group || client.segment) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {client.group && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                  {client.group.name}
                                </span>
                              )}
                              {client.segment && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  {client.segment.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* CNPJ / CPF */}
                    <TableCell className="whitespace-nowrap font-mono text-[12px] font-medium text-slate-600">
                      {client.cnpjCpf?.length === 11
                        ? formatCPF(client.cnpjCpf)
                        : client.cnpjCpf?.length === 14
                        ? formatCNPJ(client.cnpjCpf)
                        : client.cnpjCpf || "—"}
                    </TableCell>

                    {/* Contato: Email e Telefone */}
                    <TableCell className="text-xs whitespace-nowrap">
                      {client.email ? (
                        <div
                          className="flex items-center gap-1.5 text-foreground"
                          title={client.email}
                        >
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span>{client.email}</span>
                        </div>
                      ) : null}
                      {client.phone ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span>{formatPhone(client.phone)}</span>
                        </div>
                      ) : null}
                      {!client.email && !client.phone && (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Responsável: Colaborador Interno + Equipe + Contato no Local */}
                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        {client.responsibleUser ? (
                          <div
                            className="flex items-center gap-1.5 font-semibold text-slate-800"
                            title={`Colaborador Responsável: ${client.responsibleUser.name}`}
                          >
                            <UserCheck className="h-3.5 w-3.5 text-[#E2661D] shrink-0" />
                            <span className="truncate max-w-[155px]">{client.responsibleUser.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] italic">
                            <UserCheck className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            <span>Sem colaborador</span>
                          </div>
                        )}

                        {client.responsibleTeam && (
                          <div
                            className="flex items-center gap-1.5 text-slate-600 text-[11px]"
                            title={`Equipe Responsável: ${client.responsibleTeam.name}`}
                          >
                            <Users className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[155px]">{client.responsibleTeam.name}</span>
                          </div>
                        )}

                        {client.onSiteContact && (
                          <div
                            className="text-[10.5px] text-muted-foreground/80 truncate max-w-[165px]"
                            title={`Contato no Local: ${client.onSiteContact}`}
                          >
                            <span className="font-semibold text-slate-500">Local:</span> {client.onSiteContact}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="whitespace-nowrap text-center">
                      {client.status === ClientStatus.ACTIVE ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Ativo
                        </span>
                      ) : client.status === ClientStatus.DEFAULTER ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Inadimplente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Inativo
                        </span>
                      )}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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

        {/* Rodapé de Paginação */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="clientes"
        />
      </Card>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  Shield,
  Briefcase,
  Search,
  Plus,
  Eye,
  Edit,
  Key,
  Power,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types/user";
import usersService from "@/services/users/users.service";
import { EditUserModal } from "./EditUserModal";
import { UserViewModal } from "./UserViewModal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserRegistryPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modais
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersService.findAll();
      setUsers(res.data);
    } catch {
      toast.error("Erro ao carregar lista de usuários.");
    } finally {
      setLoading(false);
    }
  };

  // Contadores dinâmicos dos Stats Cards
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive !== false && u.active !== false).length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const collaborators = users.filter((u) => u.role !== "ADMIN").length;
    return { total, active, admins, collaborators };
  }, [users]);

  // Filtragem
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const isActive = user.isActive !== false && user.active !== false;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActive) ||
        (statusFilter === "INACTIVE" && !isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleToggleStatus = async (user: User) => {
    const isActive = user.isActive !== false && user.active !== false;
    const actionLabel = isActive ? "bloquear" : "ativar";
    if (!window.confirm(`Deseja realmente ${actionLabel} o acesso de ${user.name}?`)) return;

    try {
      await usersService.toggleStatus(user.id, !isActive);
      toast.success(`Usuário ${isActive ? "bloqueado" : "ativado"} com sucesso!`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alterar status.");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
      case "TECHNICIAN":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total de Usuários</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</div>
            <span className="text-[10px] text-muted-foreground">Cadastros totais</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Usuários Ativos</span>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.active}</div>
            <span className="text-[10px] text-muted-foreground">Acesso permitido</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Administradores</span>
            <div className="text-2xl font-bold text-purple-600 mt-0.5">{stats.admins}</div>
            <span className="text-[10px] text-muted-foreground">Privilégio total</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
            <Shield className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-card border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Colaboradores</span>
            <div className="text-2xl font-bold text-foreground mt-0.5">{stats.collaborators}</div>
            <span className="text-[10px] text-muted-foreground">Equipe operacional</span>
          </div>
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Briefcase className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* 2. Barra de Ações e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border rounded-2xl p-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Perfis</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="MANAGER">MANAGER</SelectItem>
              <SelectItem value="COLLABORATOR">COLLABORATOR</SelectItem>
              <SelectItem value="TECHNICIAN">TECHNICIAN</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="ACTIVE">Ativos</SelectItem>
              <SelectItem value="INACTIVE">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedUser(null);
            setEditModalOpen(true);
          }}
          className="rounded-xl text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Usuário
        </Button>
      </div>

      {/* 3. Tabela de Dados */}
      <div className="border rounded-2xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Usuário</th>
                <th className="py-3 px-4 text-left font-semibold">Cargo & Empresa</th>
                <th className="py-3 px-4 text-center font-semibold">Provedor</th>
                <th className="py-3 px-4 text-center font-semibold">Perfil</th>
                <th className="py-3 px-4 text-center font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.isActive !== false && u.active !== false;
                  const isAD = u.authProvider === "AD";
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition">
                      {/* Avatar, Nome e E-mail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 border">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{u.name}</span>
                            <span className="text-[11px] text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo & Empresa */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground block">
                          {u.position || u.roleTitle || "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {u.company?.name || "Matriz Setgen"}
                        </span>
                      </td>

                      {/* Provedor LOCAL vs AD */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isAD ? "default" : "outline"}
                          className={`text-[10px] ${
                            isAD ? "bg-blue-600 hover:bg-blue-600" : ""
                          }`}
                        >
                          {isAD ? "Active Directory" : "Local"}
                        </Badge>
                      </td>

                      {/* Perfil */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${getRoleBadgeVariant(u.role)}`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isActive ? "default" : "destructive"} className="text-[10px]">
                          {isActive ? "Ativo" : "Bloqueado"}
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(u);
                                setViewModalOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalhes
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(u);
                                setEditModalOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-muted-foreground" /> Editar Usuário
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => router.push(`/permissoes/gestao?userId=${u.id}`)}
                              className="gap-2 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5 text-primary" /> Gerenciar Permissões
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(u)}
                              className={`gap-2 cursor-pointer ${
                                isActive ? "text-red-600" : "text-emerald-600"
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              {isActive ? "Bloquear Acesso" : "Ativar Acesso"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      <UserViewModal
        user={selectedUser}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
      />

      <EditUserModal
        user={selectedUser}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={loadUsers}
      />
    </div>
  );
}

export default UserRegistryPage;


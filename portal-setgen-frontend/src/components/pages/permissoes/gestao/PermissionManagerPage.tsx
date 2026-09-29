"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Shield,
  Key,
  Search,
  Check,
  RotateCcw,
  Save,
  Copy,
  ChevronDown,
  ChevronRight,
  Package,
  FileText,
  Building2,
  Wallet,
  Truck,
  Layers,
  LucideIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { User } from "@/types/user";
import { UserRole } from "@/types/auth";
import { UserModulesAccessStatus, ModuleAccess } from "@/types/access-control";
import usersService from "@/services/users/users.service";
import userModuleAccessService from "@/services/access/user-module-access.service";
import userActivityAccessService from "@/services/access/user-activity-access.service";
import { toast } from "sonner";

// Mapeamento dinâmico de ícones Lucide
const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  FileText,
  Users,
  Building2,
  Wallet,
  Truck,
  Shield,
  Layers,
  Receipt,
};

export function PermissionManagerPage() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  // Usuários (Coluna Esquerda)
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedRoleTab, setSelectedRoleTab] = useState<"COLLABORATORS" | "ADMINS">("COLLABORATORS");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Matriz de Acessos (Painel Direito)
  const [matrixStatus, setMatrixStatus] = useState<UserModulesAccessStatus | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [moduleSearchTerm, setModuleSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  // Estado Local de Edição
  const [localModuleEnabled, setLocalModuleEnabled] = useState<Record<number, boolean>>({});
  const [localActivityEnabled, setLocalActivityEnabled] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Modal de Clonagem de Permissões
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneSourceUserId, setCloneSourceUserId] = useState<string>("");
  const [cloning, setCloning] = useState(false);

  // 1. Carregar lista de usuários
  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const res = await usersService.findAll();
        setUsers(res.data);
        if (initialUserId) {
          setSelectedUserId(initialUserId);
        } else if (res.data.length > 0) {
          setSelectedUserId(res.data[0].id);
        }
      } catch {
        toast.error("Erro ao carregar colaboradores.");
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, [initialUserId]);

  // 2. Carregar Matriz do usuário selecionado
  useEffect(() => {
    if (!selectedUserId) return;

    async function loadMatrix(uid: string) {
      setLoadingMatrix(true);
      try {
        const status = await userModuleAccessService.getUserModulesAccess(uid);
        setMatrixStatus(status);

        // Inicializar estado local
        const initialModules: Record<number, boolean> = {};
        const initialActivities: Record<number, boolean> = {};
        const initialExpanded: Record<number, boolean> = {};

        status.modules.forEach((mod) => {
          initialModules[mod.id] = mod.isEnabled;
          initialExpanded[mod.id] = true; // Inicia expandido
          mod.activities.forEach((act) => {
            initialActivities[act.id] = act.isMandatory ? mod.isEnabled : act.isActive;
          });
        });

        setLocalModuleEnabled(initialModules);
        setLocalActivityEnabled(initialActivities);
        setExpandedModules(initialExpanded);
      } catch {
        toast.error("Erro ao carregar matriz de permissões.");
      } finally {
        setLoadingMatrix(false);
      }
    }

    loadMatrix(selectedUserId);
  }, [selectedUserId]);

  // Usuário atualmente selecionado
  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // Usuários filtrados na coluna esquerda
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const isAdmin = u.role === "ADMIN";
      const matchesTab = selectedRoleTab === "ADMINS" ? isAdmin : !isAdmin;
      const matchesSearch =
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [users, selectedRoleTab, userSearchTerm]);

  // Contadores de abas de perfil
  const adminCount = useMemo(() => users.filter((u) => u.role === "ADMIN").length, [users]);
  const collaboratorCount = useMemo(() => users.filter((u) => u.role !== "ADMIN").length, [users]);

  // Verificar se há alterações não salvas
  const hasChanges = useMemo(() => {
    if (!matrixStatus) return false;

    for (const mod of matrixStatus.modules) {
      if (localModuleEnabled[mod.id] !== mod.isEnabled) return true;
      for (const act of mod.activities) {
        if (!act.isMandatory && localActivityEnabled[act.id] !== act.isActive) {
          return true;
        }
      }
    }
    return false;
  }, [matrixStatus, localModuleEnabled, localActivityEnabled]);

  // Alternar módulo
  const handleToggleModule = (moduleId: number, isEnabled: boolean) => {
    setLocalModuleEnabled((prev) => ({ ...prev, [moduleId]: isEnabled }));
    // Atualiza atividades obrigatórias do módulo
    const mod = matrixStatus?.modules.find((m) => m.id === moduleId);
    if (mod) {
      setLocalActivityEnabled((prev) => {
        const next = { ...prev };
        mod.activities.forEach((act) => {
          if (act.isMandatory) {
            next[act.id] = isEnabled;
          }
        });
        return next;
      });
    }
  };

  // Alternar atividade
  const handleToggleActivity = (activityId: number, isEnabled: boolean) => {
    setLocalActivityEnabled((prev) => ({ ...prev, [activityId]: isEnabled }));
  };

  // Ações em Lote no Módulo (Conceder Tudo / Revogar Tudo)
  const handleBatchModule = (moduleId: number, enableAll: boolean) => {
    const mod = matrixStatus?.modules.find((m) => m.id === moduleId);
    if (!mod) return;

    setLocalModuleEnabled((prev) => ({ ...prev, [moduleId]: enableAll }));
    setLocalActivityEnabled((prev) => {
      const next = { ...prev };
      mod.activities.forEach((act) => {
        next[act.id] = enableAll;
      });
      return next;
    });
  };

  // Reverter alterações locais
  const handleReset = () => {
    if (!matrixStatus) return;
    const initialModules: Record<number, boolean> = {};
    const initialActivities: Record<number, boolean> = {};

    matrixStatus.modules.forEach((mod) => {
      initialModules[mod.id] = mod.isEnabled;
      mod.activities.forEach((act) => {
        initialActivities[act.id] = act.isMandatory ? mod.isEnabled : act.isActive;
      });
    });

    setLocalModuleEnabled(initialModules);
    setLocalActivityEnabled(initialActivities);
    toast.info("Alterações revertidas para o estado original.");
  };

  // Salvar Alterações Atômicas
  const handleSaveChanges = async () => {
    if (!selectedUserId || !matrixStatus) return;

    setSaving(true);
    try {
      // 1. Salvar módulos alterados
      for (const mod of matrixStatus.modules) {
        if (localModuleEnabled[mod.id] !== mod.isEnabled) {
          await userModuleAccessService.toggleModuleAccess(selectedUserId, mod.id, {
            isEnabled: !!localModuleEnabled[mod.id],
          });
        }
      }

      // 2. Salvar atividades alteradas por módulo
      for (const mod of matrixStatus.modules) {
        const changedActivities = mod.activities.filter(
          (act) => localActivityEnabled[act.id] !== act.isActive
        );

        if (changedActivities.length > 0) {
          await userActivityAccessService.configureBulkActivities(selectedUserId, mod.id, {
            activities: mod.activities.map((act) => ({
              activityId: act.id,
              isEnabled: !!localActivityEnabled[act.id],
            })),
          });
        }
      }

      toast.success("Matriz de acessos salva com sucesso!");
      // Recarregar dados atualizados do servidor
      const updatedStatus = await userModuleAccessService.getUserModulesAccess(selectedUserId);
      setMatrixStatus(updatedStatus);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar matriz de acessos.");
    } finally {
      setSaving(false);
    }
  };

  // Clonar permissões
  const handleClonePermissions = async () => {
    if (!selectedUserId || !cloneSourceUserId) return;
    setCloning(true);
    try {
      await userActivityAccessService.clonePermissions(selectedUserId, cloneSourceUserId);
      toast.success("Permissões clonadas com sucesso!");
      setCloneModalOpen(false);
      // Recarregar
      const updated = await userModuleAccessService.getUserModulesAccess(selectedUserId);
      setMatrixStatus(updated);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao clonar permissões.");
    } finally {
      setCloning(false);
    }
  };

  // Alterar rapidamente o papel do usuário
  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedUser) return;
    try {
      await usersService.update(selectedUser.id, { role: newRole });
      toast.success(`Perfil de ${selectedUser.name} alterado para ${newRole}!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
      );
    } catch {
      toast.error("Erro ao alterar perfil do usuário.");
    }
  };

  // Módulos filtrados pela busca
  const filteredModules = useMemo(() => {
    if (!matrixStatus) return [];
    if (!moduleSearchTerm.trim()) return matrixStatus.modules;

    return matrixStatus.modules.filter(
      (m) =>
        m.name.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
        m.activities.some((a) =>
          a.name.toLowerCase().includes(moduleSearchTerm.toLowerCase())
        )
    );
  }, [matrixStatus, moduleSearchTerm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ─────────────────────────────────────────────────────────────
          COLUNA ESQUERDA: SELEÇÃO DE USUÁRIO (4 COLUNAS)
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="p-4 border bg-card space-y-3">
          {/* Alternância por Role */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedRoleTab("COLLABORATORS")}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                selectedRoleTab === "COLLABORATORS"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Colaboradores</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {collaboratorCount}
              </Badge>
            </button>

            <button
              onClick={() => setSelectedRoleTab("ADMINS")}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                selectedRoleTab === "ADMINS"
                  ? "bg-card text-purple-600 shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Administradores</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {adminCount}
              </Badge>
            </button>
          </div>

          {/* Busca Rápida de Usuários */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>

          {/* Lista Vertical de Cards de Usuários */}
          <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
            {loadingUsers ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Carregando colaboradores...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs italic">
                Nenhum colaborador encontrado.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = u.id === selectedUserId;
                const isAD = u.authProvider === "AD";
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "hover:bg-muted/40 border-transparent bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 border ${
                          isSelected ? "bg-primary text-white" : "bg-card text-foreground"
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>
                    {isAD && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-blue-600 border-blue-200">
                        AD
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PAINEL DIREITO: MATRIZ DE MÓDULOS & ATIVIDADES (8 COLUNAS)
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-8 space-y-4">
        {selectedUser ? (
          <>
            {/* Cabeçalho do Usuário Selecionado */}
            <Card className="p-4 border bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-foreground">{selectedUser.name}</h2>
                    <Badge variant={selectedUser.authProvider === "AD" ? "default" : "outline"} className="text-[10px]">
                      {selectedUser.authProvider === "AD" ? "Active Directory" : "Local"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCloneModalOpen(true)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Clonar Permissões
                </Button>

                <Select
                  value={selectedUser.role}
                  onValueChange={(v) => handleRoleChange(v as UserRole)}
                >
                  <SelectTrigger className="h-8 text-xs w-[140px] rounded-xl font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                    <SelectItem value={UserRole.MANAGER}>MANAGER</SelectItem>
                    <SelectItem value={UserRole.COLLABORATOR}>COLLABORATOR</SelectItem>
                    <SelectItem value={UserRole.TECHNICIAN}>TECHNICIAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Barra de Filtro de Módulos */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filtrar módulos ou atividades..."
                  value={moduleSearchTerm}
                  onChange={(e) => setModuleSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              {matrixStatus && (
                <div className="text-[11px] text-muted-foreground hidden sm:block">
                  Ativos:{" "}
                  <strong className="text-foreground">
                    {Object.values(localModuleEnabled).filter(Boolean).length}
                  </strong>{" "}
                  de {matrixStatus.modules.length} módulos
                </div>
              )}
            </div>

            {/* Módulos em Acordeão */}
            <div className="space-y-3">
              {loadingMatrix ? (
                <div className="py-20 text-center text-muted-foreground text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Carregando permissões do colaborador...
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs italic border rounded-2xl bg-card">
                  Nenhum módulo encontrado.
                </div>
              ) : (
                filteredModules.map((mod) => {
                  const Icon = ICON_MAP[mod.icon || "Layers"] || Layers;
                  const isModEnabled = !!localModuleEnabled[mod.id];
                  const isExpanded = !!expandedModules[mod.id];

                  return (
                    <Card
                      key={mod.id}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        isModEnabled ? "bg-card" : "bg-muted/10 opacity-70"
                      }`}
                    >
                      {/* Cabeçalho do Módulo */}
                      <div className="p-4 flex items-center justify-between gap-3 border-b bg-muted/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModules((prev) => ({
                                ...prev,
                                [mod.id]: !prev[mod.id],
                              }))
                            }
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xs text-foreground truncate">
                                {mod.name}
                              </h3>
                              {mod.route && (
                                <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                  {mod.route}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        {/* Controles do Módulo */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleBatchModule(mod.id, true)}
                              className="text-xs text-primary hover:underline font-semibold"
                            >
                              Conceder Tudo
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button
                              type="button"
                              onClick={() => handleBatchModule(mod.id, false)}
                              className="text-xs text-muted-foreground hover:underline"
                            >
                              Revogar Tudo
                            </button>
                          </div>

                          <div className="flex items-center gap-2 pl-2 border-l">
                            <Switch
                              checked={isModEnabled}
                              onCheckedChange={(checked) => handleToggleModule(mod.id, checked)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Lista de Atividades Internas (se expandido) */}
                      {isExpanded && (
                        <div className="p-4 space-y-2 bg-card">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            Telas & Atividades do Módulo
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mod.activities.map((act) => {
                              const isActEnabled = isModEnabled && (act.isMandatory || !!localActivityEnabled[act.id]);

                              return (
                                <div
                                  key={act.id}
                                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                                    isActEnabled
                                      ? "bg-card border-border"
                                      : "bg-muted/10 border-transparent opacity-60"
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-xs text-foreground truncate">
                                        {act.label || act.name}
                                      </span>
                                      {act.isMandatory && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20"
                                        >
                                          Obrigatória
                                        </Badge>
                                      )}
                                    </div>
                                    {act.route && (
                                      <span className="text-[10px] font-mono text-muted-foreground block truncate">
                                        {act.route}
                                      </span>
                                    )}
                                  </div>

                                  <Switch
                                    checked={isActEnabled}
                                    disabled={!isModEnabled || act.isMandatory}
                                    onCheckedChange={(checked) =>
                                      handleToggleActivity(act.id, checked)
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Barra de Ações Flutuante (Persistência Atômica) */}
            {hasChanges && (
              <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-card border shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-semibold text-foreground">
                    Você possui alterações não salvas nesta matriz.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReset}
                    disabled={saving}
                    className="rounded-xl text-xs gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reverter
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="rounded-xl text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-muted-foreground text-xs border rounded-2xl bg-card">
            Selecione um colaborador à esquerda para gerenciar sua matriz de acessos.
          </div>
        )}
      </div>

      {/* Modal: Clonar Permissões */}
      <Dialog open={cloneModalOpen} onOpenChange={setCloneModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Clonar Matriz de Permissões
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Duplique integralmente as permissões de um usuário modelo para{" "}
                  <strong>{selectedUser?.name}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <Label className="text-xs font-semibold">Selecione o Usuário Modelo</Label>
            <Select value={cloneSourceUserId} onValueChange={setCloneSourceUserId}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Selecione o colaborador de origem..." />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter((u) => u.id !== selectedUserId)
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Esta ação substituirá os acessos a módulos e atividades atuais do usuário alvo.
            </p>
          </div>

          <DialogFooter className="flex sm:justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCloneModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleClonePermissions}
              disabled={!cloneSourceUserId || cloning}
              className="rounded-xl text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white"
            >
              {cloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              Confirmar Clonagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PermissionManagerPage;


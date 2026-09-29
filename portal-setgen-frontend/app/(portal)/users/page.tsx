"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usersApi, User } from "@/lib/api/users";
import { rolesApi, Role, PermissionGroup } from "@/lib/api/roles";
import { useAuthStore } from "@/store/auth";
import {
  Users,
  Shield,
  UserCheck,
  Plus,
  Search,
  Key,
  Trash2,
  Power,
  Building,
  Briefcase,
  Mail,
  Lock,
  Check,
  Save,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Eye,
  EyeOff,
  AtSign,
  Layers,
  Settings,
  Package,
  FileText,
  Truck,
  Wallet,
  DollarSign,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatNameToLogin(name: string): string {
  if (!name) return "";
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}

function mapRoleNameToUserRole(roleName: string): string {
  const norm = (roleName || "").toLowerCase();
  if (norm.includes("admin")) return "ADMIN";
  if (norm.includes("gestor") || norm.includes("gerente")) return "MANAGER";
  if (norm.includes("almoxarife") || norm.includes("estoque")) return "WAREHOUSE";
  if (norm.includes("financeiro")) return "ADMINISTRATIVE";
  if (norm.includes("compras") || norm.includes("administrativo")) return "ADMINISTRATIVE";
  if (norm.includes("atendimento")) return "TECHNICIAN";
  if (norm.includes("técnico") || norm.includes("tecnico")) return "TECHNICIAN";
  return "TECHNICIAN";
}

function getBadgeStyle(roleName: string) {
  const norm = (roleName || "").toLowerCase();
  if (norm.includes("admin")) return { label: "Administrador", bg: "bg-purple-50", text: "text-purple-700" };
  if (norm.includes("gestor") || norm.includes("gerente")) return { label: "Gestor", bg: "bg-amber-50", text: "text-amber-800" };
  if (norm.includes("financeiro")) return { label: "Financeiro", bg: "bg-emerald-50", text: "text-emerald-700" };
  if (norm.includes("compras") || norm.includes("administrativo")) return { label: "Administrativo / Compras", bg: "bg-teal-50", text: "text-teal-700" };
  if (norm.includes("almoxarife") || norm.includes("estoque")) return { label: "Almoxarifado", bg: "bg-orange-50", text: "text-orange-700" };
  if (norm.includes("atendimento")) return { label: "Atendimento", bg: "bg-sky-50", text: "text-sky-700" };
  if (norm.includes("técnico") || norm.includes("tecnico")) return { label: "Técnico", bg: "bg-blue-50", text: "text-blue-700" };
  return { label: roleName || "Colaborador", bg: "bg-gray-100", text: "text-gray-700" };
}

const MODULE_ICONS: Record<string, any> = {
  "Usuários": Users,
  "Cargos e Permissões": Shield,
  "Clientes": Building,
  "Visitas Técnicas": Wrench,
  "Ordens de Serviço": FileText,
  "Financeiro": Wallet,
  "Estoque": Package,
  "Equipamentos": Settings,
  "ART": FileText,
  "Mesa do Almoxarife": Package,
  "Compras": Layers,
  "Fornecedores": Building,
  "Garantia": ShieldCheck,
  "RH": Users,
  "Frota": Truck,
};

export default function UsersAndPermissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuthStore();

  // Tabs: "users" | "permissions"
  const [activeTab, setActiveTab] = useState<"users" | "permissions">(
    searchParams.get("tab") === "permissions" ? "permissions" : "users"
  );

  // Dados
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Usuários
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Form de Novo Usuário
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [provisionalPassword, setProvisionalPassword] = useState("");
  const [createRoleId, setCreateRoleId] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Modal de Redefinir Senha
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Modal de Edição de Usuário
  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editLogin, setEditLogin] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Estados de Permissões
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleSearchTerm, setModuleSearchTerm] = useState("");
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, permsData] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll(),
        rolesApi.getAvailablePermissions(),
      ]);
      setUsers(usersData || []);
      setRoles(rolesData || []);
      setPermissionGroups(permsData || []);

      if (rolesData && rolesData.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesData[0].id);
        const initialPerms = new Set(
          rolesData[0].permissions?.map((p) => p.permission.name || "").filter(Boolean) || []
        );
        setSelectedRolePermissions(initialPerms);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de usuários e permissões:", err);
      toast.error("Erro ao carregar usuários e permissões.");
    } finally {
      setLoading(false);
    }
  };

  // Quando troca o perfil selecionado na aba de Permissões
  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      const perms = new Set(
        role.permissions?.map((p) => p.permission.name || "").filter(Boolean) || []
      );
      setSelectedRolePermissions(perms);
    }
  };

  // Criação de Usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Informe o nome completo.");
      return;
    }
    if (!corporateEmail.trim()) {
      toast.error("Informe o e-mail corporativo.");
      return;
    }
    if (!provisionalPassword || provisionalPassword.length < 6) {
      toast.error("A senha provisória deve ter no mínimo 6 caracteres.");
      return;
    }

    setCreatingUser(true);
    try {
      const selectedRoleObj = roles.find((r) => r.id === createRoleId) || roles[0];
      const assignedRole = mapRoleNameToUserRole(selectedRoleObj?.name || "Técnico");
      const finalLogin = (login || formatNameToLogin(fullName) || corporateEmail.split("@")[0]).toLowerCase().trim();

      const created = await usersApi.create({
        name: fullName.trim(),
        email: corporateEmail.toLowerCase().trim(),
        password: provisionalPassword,
        login: finalLogin,
        role: assignedRole as any,
        roleId: selectedRoleObj?.id,
        roleName: selectedRoleObj?.name,
        jobTitle: jobTitle.trim() || selectedRoleObj?.name || undefined,
        active: true,
      } as any);

      setUsers((prev) => [created, ...prev]);
      toast.success(`Usuário ${fullName} (${selectedRoleObj?.name || assignedRole}) cadastrado com sucesso!`);

      // Limpa campos
      setFullName("");
      setLogin("");
      setCorporateEmail("");
      setProvisionalPassword("");
      setJobTitle("");
    } catch (err: any) {
      console.error("Erro ao cadastrar usuário:", err);
      toast.error(err.response?.data?.message || "Erro ao cadastrar usuário.");
    } finally {
      setCreatingUser(false);
    }
  };

  // Alternar status ativo/inativo
  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await usersApi.toggleActive(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: updated.active } : u)));
      toast.success(`Usuário ${user.name} ${updated.active ? "ativado" : "desativado"} com sucesso!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao alterar status do usuário.");
    }
  };

  // Exclusão de usuário
  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Deseja realmente desativar/excluir o usuário ${user.name}?`)) return;
    try {
      await usersApi.delete(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("Usuário removido com sucesso!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao remover usuário.");
    }
  };

  // Salvar nova senha provisória
  const handleSaveProvisionalPassword = async () => {
    if (!passwordModalUser || newPasswordValue.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setSavingPassword(true);
    try {
      await usersApi.resetPassword(passwordModalUser.id, newPasswordValue);
      toast.success(`Senha provisória atualizada para ${passwordModalUser.name}!`);
      setPasswordModalUser(null);
      setNewPasswordValue("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao redefinir senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  // Abrir Modal de Edição de Usuário
  const handleOpenEditModal = (user: User) => {
    setEditModalUser(user);
    setEditFullName(user.name || "");
    setEditLogin(user.login || formatNameToLogin(user.name) || user.email.split("@")[0]);
    setEditEmail(user.email || "");
    const matchedRole =
      roles.find((r) => r.id === user.roleId) ||
      roles.find(
        (r) =>
          r.name.toLowerCase() ===
          (user.roleRef?.name || (user as any).roleName || user.role || "").toLowerCase()
      ) ||
      roles[0];
    setEditRoleId(matchedRole?.id || "");
    setEditJobTitle(user.jobTitle || matchedRole?.name || "");
    setEditActive(user.active);
    setEditNewPassword("");
    setShowEditPassword(false);
  };

  // Salvar Edição de Usuário
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    if (!editFullName.trim()) {
      toast.error("Informe o nome completo.");
      return;
    }
    if (!editEmail.trim()) {
      toast.error("Informe o e-mail corporativo.");
      return;
    }

    setSavingEditUser(true);
    try {
      const selectedRoleObj = roles.find((r) => r.id === editRoleId) || roles[0];
      const assignedRole = mapRoleNameToUserRole(selectedRoleObj?.name || "Técnico");
      const finalLogin = (editLogin || formatNameToLogin(editFullName) || editEmail.split("@")[0]).toLowerCase().trim();

      const updatePayload: any = {
        name: editFullName.trim(),
        email: editEmail.toLowerCase().trim(),
        login: finalLogin,
        role: assignedRole,
        roleId: selectedRoleObj?.id,
        jobTitle: editJobTitle.trim() || selectedRoleObj?.name || undefined,
        active: editActive,
      };

      if (editNewPassword.trim()) {
        if (editNewPassword.trim().length < 6) {
          toast.error("A nova senha deve ter no mínimo 6 dígitos.");
          setSavingEditUser(false);
          return;
        }
        updatePayload.password = editNewPassword.trim();
      }

      const updated = await usersApi.update(editModalUser.id, updatePayload);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editModalUser.id
            ? {
                ...u,
                ...updated,
                name: editFullName.trim(),
                email: editEmail.toLowerCase().trim(),
                login: finalLogin,
                role: assignedRole as any,
                roleId: selectedRoleObj?.id,
                jobTitle: editJobTitle.trim() || selectedRoleObj?.name,
                roleRef: selectedRoleObj ? { id: selectedRoleObj.id, name: selectedRoleObj.name } : u.roleRef,
                roleName: selectedRoleObj?.name,
                active: editActive,
              }
            : u
        )
      );

      toast.success(`Usuário ${editFullName} atualizado com sucesso!`);
      setEditModalUser(null);
    } catch (err: any) {
      console.error("Erro ao atualizar usuário:", err);
      toast.error(err.response?.data?.message || "Erro ao atualizar usuário.");
    } finally {
      setSavingEditUser(false);
    }
  };

  // Toggle de permissão individual na aba 2
  const handleTogglePermission = (permId: string) => {
    setSelectedRolePermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  // Toggle master do módulo na aba 2
  const handleToggleModuleAll = (group: PermissionGroup, currentlyAllActive: boolean) => {
    setSelectedRolePermissions((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => {
        if (currentlyAllActive) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  // Salvar permissões do perfil
  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingPermissions(true);
    try {
      const permIdsArray = Array.from(selectedRolePermissions);
      await rolesApi.update(selectedRoleId, {
        permissionIds: permIdsArray,
      });

      // Recarrega do banco para garantir que a UI e estados em memória fiquem sincronizados
      const [freshRoles, freshUsers] = await Promise.all([
        rolesApi.getAll(),
        usersApi.getAll(),
      ]);
      setRoles(freshRoles || []);
      setUsers(freshUsers || []);

      const curRole = freshRoles?.find((r) => r.id === selectedRoleId);
      if (curRole) {
        const perms = new Set(
          curRole.permissions?.map((p) => p.permission.name || "").filter(Boolean) || []
        );
        setSelectedRolePermissions(perms);
      }

      toast.success("Permissões do perfil atualizadas e persistidas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar permissões:", err);
      toast.error(err.response?.data?.message || "Erro ao salvar permissões.");
    } finally {
      setSavingPermissions(false);
    }
  };

  // KPIs
  const totalUsersCount = users.length;
  const adminUsersCount = users.filter((u) => u.role === "ADMIN").length;
  const employeeUsersCount = users.filter((u) => u.role !== "ADMIN").length;

  // Filtragem de Usuários
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(term)) ||
        (u.login && u.login.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  // Filtragem de Grupos de Permissões
  const filteredPermissionGroups = useMemo(() => {
    if (!moduleSearchTerm.trim()) return permissionGroups;
    const term = moduleSearchTerm.toLowerCase();
    return permissionGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.permissions.some(
          (p) =>
            p.label.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.id.toLowerCase().includes(term)
        )
    );
  }, [permissionGroups, moduleSearchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E2661D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Abas Superiores Padrão Configurações */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("users");
            router.replace("/users?tab=users");
          }}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold border-b-2 transition-all select-none",
            activeTab === "users"
              ? "border-[#E2661D] text-[#E2661D]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Users className="h-4 w-4" />
          Gestão de Usuários
        </button>

        <button
          onClick={() => {
            setActiveTab("permissions");
            router.replace("/users?tab=permissions");
          }}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold border-b-2 transition-all select-none",
            activeTab === "permissions"
              ? "border-[#E2661D] text-[#E2661D]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          Gestão de Perfis & Permissões
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: GESTÃO DE USUÁRIOS                                                 */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header da Tela */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-gray-900">Cadastro de Usuários</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Gerencie os usuários e perfis de acesso do sistema
              </p>
            </div>
            <Button
              onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
              className="rounded-xl font-bold text-xs gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              {isCreateFormOpen ? "Fechar Formulário" : "Novo Usuário"}
            </Button>
          </div>

          {/* 3 Metric Cards no Topo (Exatamente como nas Imagens) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total de Usuários */}
            <Card className="p-5 rounded-2xl border border-gray-100 bg-white shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#E2661D] flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Total de Usuários</div>
                <div className="text-2xl font-black text-gray-900 mt-0.5">{totalUsersCount}</div>
              </div>
            </Card>

            {/* Administradores */}
            <Card className="p-5 rounded-2xl border border-gray-100 bg-white shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Administradores</div>
                <div className="text-2xl font-black text-gray-900 mt-0.5">{adminUsersCount}</div>
              </div>
            </Card>

            {/* Colaboradores */}
            <Card className="p-5 rounded-2xl border border-gray-100 bg-white shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Colaboradores</div>
                <div className="text-2xl font-black text-gray-900 mt-0.5">{employeeUsersCount}</div>
              </div>
            </Card>
          </div>

          {/* Card "Cadastrar Novo Usuário" (Idêntico à Imagem 1) */}
          {isCreateFormOpen && (
            <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#E2661D] flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">Cadastrar Novo Usuário</h2>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Nome Completo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Nome Completo *</label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        required
                        placeholder="Ex: João da Silva"
                        value={fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFullName(val);
                          const genLogin = formatNameToLogin(val);
                          setLogin(genLogin);
                          if (!corporateEmail || corporateEmail.endsWith("@setgen.com.br")) {
                            setCorporateEmail(genLogin ? `${genLogin}@setgen.com.br` : "");
                          }
                        }}
                        className="pl-10 text-xs h-11 rounded-xl border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Login de Acesso (nome.sobrenome) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Login de Acesso (nome.sobrenome) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">@</span>
                      <Input
                        type="text"
                        required
                        placeholder="joao.silva"
                        value={login}
                        onChange={(e) => setLogin(e.target.value.toLowerCase().trim())}
                        className="pl-10 text-xs h-11 rounded-xl border-gray-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* E-mail Corporativo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">E-mail Corporativo *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        required
                        placeholder="joao.silva@setgen.com.br"
                        value={corporateEmail}
                        onChange={(e) => setCorporateEmail(e.target.value)}
                        className="pl-10 text-xs h-11 rounded-xl border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Perfil de Acesso (Cargos do Sistema) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Perfil de Acesso / Cargo *</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                      <select
                        value={createRoleId}
                        onChange={(e) => {
                          setCreateRoleId(e.target.value);
                          const r = roles.find(r => r.id === e.target.value);
                          if (r && !jobTitle) setJobTitle(r.name);
                        }}
                        className="w-full pl-10 pr-4 text-xs h-11 rounded-xl border border-gray-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cargo Operacional / Especialidade */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Cargo / Especialidade</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Ex: Técnico Especialista em Geradores"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="pl-10 text-xs h-11 rounded-xl border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Senha Provisória */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Senha Provisória *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Mínimo 6 dígitos"
                        value={provisionalPassword}
                        onChange={(e) => setProvisionalPassword(e.target.value)}
                        className="pl-10 pr-10 text-xs h-11 rounded-xl border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={creatingUser}
                    className="rounded-xl font-bold text-xs h-10 px-6 bg-slate-800 hover:bg-slate-900 text-white gap-2 shadow-xs"
                  >
                    {creatingUser ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-emerald-400" />
                    )}
                    Cadastrar Usuário
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Barra de Busca (Idêntica à Imagem 1 & 2) */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30 shadow-2xs"
              />
            </div>
            <Button
              type="button"
              className="rounded-xl font-bold text-xs px-6 bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs"
            >
              Buscar
            </Button>
          </div>

          {/* Tabela de Usuários (Idêntica à Imagem 2) */}
          <Card className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">COLABORADOR</th>
                    <th className="py-3.5 px-4">USERNAME</th>
                    <th className="py-3.5 px-4">CARGO / EMPRESA</th>
                    <th className="py-3.5 px-4">PERFIL</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-6 text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const effectiveRoleName = user.roleRef?.name || (user as any).roleName || user.role;
                      const badge = getBadgeStyle(effectiveRoleName);
                      const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "U";
                      const displayUsername = user.login
                        ? `@${user.login}`
                        : `@${user.email.split("@")[0]}`;

                      return (
                        <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                          {/* Colaborador */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                {userInitial}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 text-xs truncate">
                                  {user.name}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Username */}
                          <td className="py-3.5 px-4 font-mono text-gray-500 text-[11.5px]">
                            {displayUsername}
                          </td>

                          {/* Cargo / Empresa */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 text-xs">
                              {user.jobTitle || "—"}
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium">SETGEN</div>
                          </td>

                          {/* Perfil */}
                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-bold inline-block",
                                badge.bg,
                                badge.text
                              )}
                            >
                              {badge.label}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {user.active ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Inativo
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Editar Usuário */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(user)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#E2661D] hover:bg-orange-50 transition-colors"
                                title="Editar dados e cargo do usuário"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* Reset de Senha */}
                              <button
                                type="button"
                                onClick={() => setPasswordModalUser(user)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Redefinir senha provisória"
                              >
                                <Key className="h-4 w-4" />
                              </button>

                              {/* Ir para Permissões */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab("permissions");
                                  if (user.roleId) setSelectedRoleId(user.roleId);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Ver permissões deste perfil"
                              >
                                <Shield className="h-4 w-4" />
                              </button>

                              {/* Ativar/Desativar */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  user.active
                                    ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                    : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                )}
                                title={user.active ? "Desativar usuário" : "Ativar usuário"}
                              >
                                <Power className="h-4 w-4" />
                              </button>

                              {/* Excluir */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Excluir usuário"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: GESTÃO DE PERFIS & PERMISSÕES (Idêntico à Imagem 3)               */}
      {/* ========================================================================= */}
      {activeTab === "permissions" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header com Seletor de Perfil */}
          <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Gestão de Perfis & Permissões</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ative ou oculte módulos e configure acessos granulares por perfil
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Perfil de Acesso:</span>
              <select
                value={selectedRoleId}
                onChange={(e) => handleSelectRole(e.target.value)}
                className="text-xs font-bold h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30 min-w-[200px]"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo de Busca de Módulos */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar módulos ou permissões..."
              value={moduleSearchTerm}
              onChange={(e) => setModuleSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30 shadow-2xs"
            />
          </div>

          {/* Lista de Módulos com Switches (Idêntico à Imagem 3) */}
          <div className="space-y-3">
            {filteredPermissionGroups.map((group) => {
              const activeCount = group.permissions.filter((p) =>
                selectedRolePermissions.has(p.id)
              ).length;
              const totalPerms = group.permissions.length;
              const allActive = activeCount === totalPerms && totalPerms > 0;
              const isExpanded = expandedModules.has(group.name);
              const IconComp = MODULE_ICONS[group.name] || Layers;

              return (
                <Card
                  key={group.name}
                  className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-xs hover:border-gray-300 transition-all"
                >
                  {/* Linha Resumo do Módulo */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Master Switch do Módulo */}
                      <button
                        type="button"
                        onClick={() => handleToggleModuleAll(group, allActive)}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative shrink-0",
                          allActive ? "bg-[#E2661D]" : activeCount > 0 ? "bg-amber-400" : "bg-gray-200"
                        )}
                        title={allActive ? "Desativar todas" : "Ativar todas"}
                      >
                        <span
                          className={cn(
                            "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs",
                            allActive || activeCount > 0 ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>

                      {/* Ícone em container arredondado */}
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                        <IconComp className="h-5 w-5" />
                      </div>

                      {/* Nome do Módulo e Atividades */}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{group.name}</h3>
                        <p className="text-[11.5px] text-gray-400 mt-0.5">
                          {activeCount} de {totalPerms} atividades ativas •{" "}
                          {activeCount > 0 ? "módulo visível para o perfil" : "módulo oculto do usuário"}
                        </p>
                      </div>
                    </div>

                    {/* Botão de Expandir Detalhes */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedModules((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.name)) next.delete(group.name);
                          else next.add(group.name);
                          return next;
                        });
                      }}
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Permissões Detalhadas (Expandido) */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 bg-gray-50/70 border-t border-gray-100 divide-y divide-gray-100">
                      {group.permissions.map((perm) => {
                        const isGranted = selectedRolePermissions.has(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className="py-3 flex items-center justify-between gap-4"
                          >
                            <div>
                              <div className="text-xs font-bold text-gray-800">{perm.label}</div>
                              <div className="text-[11px] text-gray-400">{perm.description}</div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(perm.id)}
                              className={cn(
                                "w-9 h-5 rounded-full transition-colors relative shrink-0",
                                isGranted ? "bg-[#E2661D]" : "bg-gray-300"
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-xs",
                                  isGranted ? "translate-x-4" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Botão Salvar Alterações Flutuante/Fixo no Rodapé */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSavePermissions}
              disabled={savingPermissions}
              className="rounded-xl font-bold text-xs h-11 px-8 bg-slate-800 hover:bg-slate-900 text-white gap-2 shadow-lg"
            >
              {savingPermissions ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 text-emerald-400" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Redefinir Senha Provisória */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Redefinir Senha Provisória</h3>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Defina uma nova senha de acesso para o colaborador{" "}
              <strong>{passwordModalUser.name}</strong> ({passwordModalUser.email}).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Nova Senha Provisória</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPasswordValue}
                onChange={(e) => setNewPasswordValue(e.target.value)}
                className="text-xs h-10 rounded-xl border-gray-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setPasswordModalUser(null)}
                className="rounded-xl text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveProvisionalPassword}
                disabled={savingPassword}
                className="rounded-xl font-bold text-xs h-9 bg-[#E2661D] hover:bg-[#c95716] text-white"
              >
                {savingPassword ? "Salvando..." : "Atualizar Senha"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Usuário */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#E2661D] flex items-center justify-center">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Editar Usuário</h3>
                  <p className="text-[11px] text-gray-400">Atualize os dados cadastrais e o perfil de acesso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700">Nome Completo *</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Nome completo"
                      className="pl-10 text-xs h-10 rounded-xl border-gray-200"
                    />
                  </div>
                </div>

                {/* Login de Acesso */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Login (nome.sobrenome) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">@</span>
                    <Input
                      type="text"
                      required
                      value={editLogin}
                      onChange={(e) => setEditLogin(e.target.value.toLowerCase().trim())}
                      placeholder="login.acesso"
                      className="pl-10 text-xs h-10 rounded-xl border-gray-200 font-mono"
                    />
                  </div>
                </div>

                {/* E-mail Corporativo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">E-mail Corporativo *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="colaborador@setgen.com.br"
                      className="pl-10 text-xs h-10 rounded-xl border-gray-200"
                    />
                  </div>
                </div>

                {/* Perfil de Acesso (Cargos) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Cargo / Perfil de Acesso *</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <select
                      value={editRoleId}
                      onChange={(e) => {
                        setEditRoleId(e.target.value);
                        const r = roles.find((role) => role.id === e.target.value);
                        if (r && (!editJobTitle || roles.some((x) => x.name === editJobTitle))) {
                          setEditJobTitle(r.name);
                        }
                      }}
                      className="w-full pl-10 pr-4 text-xs h-10 rounded-xl border border-gray-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Especialidade / Cargo Operacional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Cargo / Especialidade</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                      placeholder="Ex: Técnico Especialista"
                      className="pl-10 text-xs h-10 rounded-xl border-gray-200"
                    />
                  </div>
                </div>

                {/* Status da Conta */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700">Status da Conta</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input
                        type="radio"
                        name="editActive"
                        checked={editActive === true}
                        onChange={() => setEditActive(true)}
                        className="text-[#E2661D] focus:ring-[#E2661D]"
                      />
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Conta Ativa
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input
                        type="radio"
                        name="editActive"
                        checked={editActive === false}
                        onChange={() => setEditActive(false)}
                        className="text-[#E2661D] focus:ring-[#E2661D]"
                      />
                      <span className="inline-flex items-center gap-1.5 text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Conta Inativa
                      </span>
                    </label>
                  </div>
                </div>

                {/* Redefinir Senha (Opcional) */}
                <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Alterar Senha (Opcional)</label>
                    <span className="text-[11px] text-gray-400">Deixe em branco para manter a atual</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showEditPassword ? "text" : "password"}
                      placeholder="Preencha apenas se desejar trocar a senha"
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                      className="pl-10 pr-10 text-xs h-10 rounded-xl border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalUser(null)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingEditUser}
                  className="rounded-xl font-bold text-xs h-9 bg-[#E2661D] hover:bg-[#c95716] text-white gap-2"
                >
                  {savingEditUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingEditUser ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

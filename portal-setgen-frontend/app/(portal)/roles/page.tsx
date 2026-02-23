"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rolesApi, Role, PermissionGroup } from "@/lib/api/roles";
import { useAuthStore } from "@/store/auth";
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RolesPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [roleModal, setRoleModal] = useState<{
    open: boolean;
    role: Role | null;
    mode: "create" | "edit";
  }>({ open: false, role: null, mode: "create" });

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; role: Role | null }>({
    open: false,
    role: null,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
  });

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getAvailablePermissions(),
      ]);
      setRoles(rolesData);
      setAvailablePermissions(permsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: "create" | "edit", role: Role | null = null) => {
    if (mode === "edit" && role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        permissionIds: role.permissions?.map((p) => p.permission.id) || [],
      });
    } else {
      setFormData({ name: "", description: "", permissionIds: [] });
    }
    setRoleModal({ open: true, mode, role });
  };

  const handleSaveRole = async () => {
    if (!formData.name) return;
    setActionLoading(true);
    try {
      if (roleModal.mode === "create") {
        await rolesApi.create(formData);
      } else if (roleModal.role) {
        await rolesApi.update(roleModal.role.id, formData);
      }
      loadData();
      setRoleModal({ open: false, role: null, mode: "create" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao salvar cargo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteModal.role) return;
    setActionLoading(true);
    try {
      await rolesApi.delete(deleteModal.role.id);
      loadData();
      setDeleteModal({ open: false, role: null });
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao excluir cargo");
    } finally {
      setActionLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Cargos e Permissões</h1>
              <p className="text-gray-400">Gerencie os acessos e responsabilidades da equipe</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal("create")}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Novo Cargo
          </button>
        </div>
      </div>

      {/* Listagem de Cargos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="hover:shadow-xl transition-all border-none bg-white shadow-md overflow-hidden flex flex-col">
            <CardHeader className="bg-gray-50/50 pb-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal("edit", role)}>
                    <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteModal({ open: true, role })}>
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-3 text-xl">{role.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[40px] text-gray-500">
                {role.description || "Nenhuma descrição informada."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-grow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Permissões:</span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold border-none">
                    {role._count?.permissions || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Usuários vinculados:</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-bold border-none">
                    {role._count?.users || 0}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-6 group bg-gray-50 border-none hover:bg-orange-50 hover:text-orange-600 font-semibold"
                onClick={() => handleOpenModal("edit", role)}
              >
                Configurar Acessos
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={roleModal.open} onOpenChange={(open) => !actionLoading && setRoleModal({ ...roleModal, open })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <div className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                {roleModal.mode === "create" ? "Criar Novo Cargo" : `Editar Cargo: ${roleModal.role?.name}`}
              </DialogTitle>
              <DialogDescription>
                Defina o nome, descrição e quais permissões este cargo terá no sistema.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-6 space-y-8 bg-gray-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role-name" className="text-sm font-bold text-gray-700">Nome do Cargo</Label>
                <Input
                  id="role-name"
                  placeholder="Ex: Gerente Técnico"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white border-gray-200 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-desc" className="text-sm font-bold text-gray-700">Descrição (Opcional)</Label>
                <Input
                  id="role-desc"
                  placeholder="Descreva as responsabilidades..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white border-gray-200 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800">Permissões de Acesso</h3>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {formData.permissionIds.length} selecionadas
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {availablePermissions.map((group) => (
                  <div key={group.name} className="space-y-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm border-b pb-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      {group.name}
                    </h4>
                    <div className="space-y-2.5">
                      {group.permissions.map((perm) => (
                        <div
                          key={perm.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border-2 ${
                            formData.permissionIds.includes(perm.id)
                              ? "border-orange-200 bg-orange-50/30"
                              : "border-transparent"
                          }`}
                          onClick={() => togglePermission(perm.id)}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            formData.permissionIds.includes(perm.id)
                              ? "bg-orange-600 text-white"
                              : "bg-gray-100 text-transparent border border-gray-200"
                          }`}>
                            <Check className="h-3 w-3" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold transition-colors ${
                              formData.permissionIds.includes(perm.id) ? "text-orange-900" : "text-gray-700"
                            }`}>
                              {perm.label}
                            </p>
                            <p className="text-xs text-gray-500 leading-tight">
                              {perm.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white px-8 py-5 border-t border-gray-100 flex justify-end gap-3 z-10">
            <Button
              variant="outline"
              onClick={() => setRoleModal({ ...roleModal, open: false })}
              disabled={actionLoading}
              className="border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]"
              onClick={handleSaveRole}
              disabled={actionLoading || !formData.name}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {roleModal.mode === "create" ? "Criar Cargo" : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => !actionLoading && setDeleteModal({ ...deleteModal, open })}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Excluir Cargo</DialogTitle>
            <DialogDescription className="text-center">
              Tem certeza que deseja excluir o cargo <strong>{deleteModal.role?.name}</strong>? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModal({ open: false, role: null })} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteRole} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

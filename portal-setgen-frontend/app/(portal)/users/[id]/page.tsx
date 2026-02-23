"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { rolesApi, Role, PermissionGroup } from '@/lib/api/roles';
import { UserPlus, Save, X, Eye, EyeOff, Loader2, Shield, AlertCircle } from 'lucide-react';
import { PermissionSelector } from '@/components/access-control/permission-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Data for Selects
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionGroup[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // Optional for edit
    roleId: '',
    permissionIds: [] as string[],
    active: true,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [user, rolesData, permsData] = await Promise.all([
        usersApi.getById(id),
        rolesApi.getAll(),
        rolesApi.getAvailablePermissions(),
      ]);

      setRoles(rolesData);
      setAvailablePermissions(permsData);

      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        roleId: user.roleId || '', // Handle legacy users without roleId
        permissionIds: user.permissions?.map(p => p.permission.id) || [],
        active: user.active,
      });

      // If user has no roleId but has a legacy role, try to match it or default to something safe
      if (!user.roleId && user.role) {
         const matchedRole = rolesData.find(r => r.name.toUpperCase() === user.role) 
                          || rolesData.find(r => r.name === 'Técnico'); // Fallback
         if (matchedRole) {
            setFormData(prev => ({ ...prev, roleId: matchedRole.id }));
         }
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados do usuário', 'error');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } z-50 animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    if (!formData.roleId) {
      showToast('Selecione um cargo para o usuário', 'error');
      return;
    }

    setSaving(true);

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        permissionIds: formData.permissionIds,
        active: formData.active,
      };

      // Only send password if it was changed
      if (formData.password) {
        // For security, checking active/reset password endpoint might be better, 
        // but for now we follow the pattern (though the API update DTO might not expect password directly)
        // Adjusting: the create DTO has password, update DTO usually doesn't update password directly in REST
        // But let's check users.service.ts... yes, it handles password in update!
        updateData.password = formData.password;
      }

      // Legacy role field fallback
      const selectedRole = roles.find(r => r.id === formData.roleId);
      if (selectedRole) {
        // Approximate mapping just to be safe with DB constraints if any
        updateData.role = selectedRole.name === 'Administrador' ? 'ADMIN' : 'TECHNICIAN'; 
      }

      await usersApi.update(id, updateData);
      showToast('Usuário atualizado com sucesso!');
      router.push('/users');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao atualizar usuário', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Editar Usuário</h1>
            <p className="text-gray-300">Atualize as informações e permissões do usuário</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
        <Tabs defaultValue="general" className="w-full">
          <div className="border-b border-gray-100 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="general">Dados Gerais</TabsTrigger>
              <TabsTrigger value="permissions">Permissões Extras</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8">
            <TabsContent value="general" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: joao@empresa.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo / Função <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione um cargo...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  O cargo define as permissões base do usuário.
                </p>
              </div>

              <div className="border-t border-gray-100 my-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Alterar Senha (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Deixe em branco para manter a atual"
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo de 6 caracteres se for alterar.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-0 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Permissões Adicionais</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      As permissões selecionadas aqui serão adicionadas às permissões do cargo.
                      O usuário terá a soma das permissões do cargo + permissões individuais.
                    </p>
                  </div>
                </div>
              </div>

              <PermissionSelector
                availablePermissions={availablePermissions}
                selectedPermissions={formData.permissionIds}
                onChange={(ids) => setFormData({ ...formData, permissionIds: ids })}
              />
            </TabsContent>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-70 transition-all active:scale-[0.99]"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </button>
          </div>
        </Tabs>
      </form>
    </div>
  );
}

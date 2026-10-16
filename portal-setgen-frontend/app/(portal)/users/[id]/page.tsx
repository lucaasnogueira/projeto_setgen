"use client";

import { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { rolesApi, Role, PermissionGroup } from '@/lib/api/roles';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { PermissionSelector } from '@/components/access-control/permission-selector';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn, mapRoleNameToLegacyEnum } from '@/lib/utils';
import { StepRail, StepFooter, type WizardStep } from '@/components/ui/step-wizard';

type StepKey = 'general' | 'permissions';
const stepDefs: WizardStep[] = [
  { key: 'general', label: 'Dados Gerais' },
  { key: 'permissions', label: 'Permissões Extras' },
];

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>('general');

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

  // Permissões concedidas via cargo atribuído (base) - vêm marcadas e travadas no seletor.
  const rolePermissionNames = useMemo(() => {
    const role = roles.find((r) => r.id === formData.roleId);
    return (role?.permissions?.map((p) => p.permission.name).filter((n): n is string => !!n)) || [];
  }, [roles, formData.roleId]);

  const displayedPermissions = useMemo(
    () => Array.from(new Set([...rolePermissionNames, ...formData.permissionIds])),
    [rolePermissionNames, formData.permissionIds]
  );

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
        permissionIds: user.permissions?.map(p => p.permission.name) || [],
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
        updateData.role = mapRoleNameToLegacyEnum(selectedRole.name);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Editar Usuário" subtitle="Atualize as informações e permissões do usuário" />

      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-4">
            <div className={cn('space-y-4', activeStep !== 'general' && 'hidden')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: joao@empresa.com"
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Cargo / Função <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione um cargo...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  O cargo define as permissões base do usuário.
                </p>
              </div>

              <div className="border-t border-gray-100 my-4 pt-4">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Alterar Senha (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Deixe em branco para manter a atual"
                        className="w-full h-9 px-3 pr-10 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Mínimo de 6 caracteres se for alterar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn('space-y-4', activeStep !== 'permissions' && 'hidden')}>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 mb-4">
                <div className="flex gap-2.5">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-xs text-blue-900">Permissões Adicionais</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      As permissões selecionadas aqui serão adicionadas às permissões do cargo.
                      O usuário terá a soma das permissões do cargo + permissões individuais.
                    </p>
                  </div>
                </div>
              </div>

              <PermissionSelector
                availablePermissions={availablePermissions}
                selectedPermissions={displayedPermissions}
                lockedPermissions={rolePermissionNames}
                onChange={(ids) =>
                  setFormData({
                    ...formData,
                    permissionIds: ids.filter((id) => !rolePermissionNames.includes(id)),
                  })
                }
              />
            </div>
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <StepFooter
            steps={stepDefs}
            activeKey={activeStep}
            onNext={(k) => setActiveStep(k as StepKey)}
            onCancel={() => router.back()}
            loading={saving}
            submitLabel={saving ? 'Salvando Alterações...' : 'Salvar Alterações'}
          />
        </div>
      </form>
    </div>
  );
}

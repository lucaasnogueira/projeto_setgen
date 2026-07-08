"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { rolesApi, Role, PermissionGroup } from '@/lib/api/roles';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { PermissionSelector } from '@/components/access-control/permission-selector';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { StepRail, StepFooter, type WizardStep } from '@/components/ui/step-wizard';

type StepKey = 'general' | 'permissions';
const stepDefs: WizardStep[] = [
  { key: 'general', label: 'Dados Gerais' },
  { key: 'permissions', label: 'Permissões Extras' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>('general');

  // Data for Selects
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionGroup[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '', 
    permissionIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getAvailablePermissions(),
      ]);
      setRoles(rolesData);
      setAvailablePermissions(permsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar cargos e permissões', 'error');
    } finally {
      setInitialLoading(false);
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

    if (formData.password !== formData.confirmPassword) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    if (!formData.roleId) {
      showToast('Selecione um cargo para o usuário', 'error');
      return;
    }

    setLoading(true);

    // Encontrar o cargo selecionado para pegar o nome
    const selectedRole = roles.find(r => r.id === formData.roleId);
    // Fallback seguro caso algo dê errado, embora roleId seja obrigatório
    const roleName = (selectedRole?.name === 'Administrador' ? 'ADMIN' : 'TECHNICIAN') as any; 

    try {
      await usersApi.create({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: roleName, // Mantendo compatibilidade com campo antigo, mas o backend vai usar roleId
        roleId: formData.roleId,
        permissionIds: formData.permissionIds,
        active: true,
      });
      showToast('Usuário criado com sucesso!');
      router.push('/users');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao criar usuário', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Novo Usuário" subtitle="Cadastre um novo usuário e defina seus acessos" />

      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      <form onSubmit={handleSubmit} className="bg-card rounded-[14px] border border-border overflow-hidden">
        <div className="p-8">
            <div className={cn('space-y-6', activeStep !== 'general' && 'hidden')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: joao@empresa.com"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cargo / Função <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione um cargo...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  O cargo define as permissões base do usuário.
                </p>
              </div>

              <div className="border-t border-border my-6 pt-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Segurança</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Senha */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Senha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-2 pr-12 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confirmar Senha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Digite a senha novamente"
                        className="w-full px-4 py-2 pr-12 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Indicador de força da senha */}
                {formData.password.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2 h-1.5">
                      <div className={`flex-1 rounded-full transition-all ${formData.password.length >= 6 ? 'bg-orange-400' : 'bg-gray-200'}`} />
                      <div className={`flex-1 rounded-full transition-all ${formData.password.length >= 8 ? 'bg-orange-500' : 'bg-gray-200'}`} />
                      <div className={`flex-1 rounded-full transition-all ${formData.password.length >= 10 ? 'bg-green-500' : 'bg-gray-200'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground text-right font-medium">
                      {formData.password.length >= 10 ? 'Forte' :
                       formData.password.length >= 8 ? 'Média' :
                       formData.password.length >= 6 ? 'Fraca' : 'Muito curta'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className={cn('space-y-4', activeStep !== 'permissions' && 'hidden')}>
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
            </div>
        </div>

        <div className="px-8 pb-8">
          <StepFooter
            steps={stepDefs}
            activeKey={activeStep}
            onNext={(k) => setActiveStep(k as StepKey)}
            onCancel={() => router.back()}
            loading={loading}
            submitLabel={loading ? 'Criando Usuário...' : 'Criar Usuário'}
          />
        </div>
      </form>
    </div>
  );
}

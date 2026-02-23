"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { rolesApi, Role, PermissionGroup } from '@/lib/api/roles';
import { UserPlus, Save, X, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { PermissionSelector } from '@/components/access-control/permission-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <UserPlus className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Novo Usuário</h1>
            <p className="text-gray-300">Cadastre um novo usuário e defina seus acessos</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Segurança</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
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
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Senha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Digite a senha novamente"
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <p className="text-xs text-gray-600 text-right font-medium">
                      {formData.password.length >= 10 ? 'Forte' :
                       formData.password.length >= 8 ? 'Média' :
                       formData.password.length >= 6 ? 'Fraca' : 'Muito curta'}
                    </p>
                  </div>
                )}
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
              disabled={loading}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 flex items-center justify-center gap-2 font-medium shadow-lg disabled:opacity-70 transition-all active:scale-[0.99]"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Criando Usuário...' : 'Criar Usuário'}
            </button>
          </div>
        </Tabs>
      </form>
    </div>
  );
}

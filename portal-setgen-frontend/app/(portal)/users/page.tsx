"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, User } from '@/lib/api/users';
import { useAuthStore } from '@/store/auth';
import { getRoleLabel } from '@/lib/utils';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  UserCheck,
  UserX,
  Key,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';
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

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Modais
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [statusModal, setStatusModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const data = await usersApi.getAll();
      // Ordenação Alfabética
      const sortedData = data.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setUsers(sortedData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } z-[200] animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };

  const handleToggleStatus = async () => {
    if (!statusModal.user) return;
    setActionLoading(true);
    try {
      await usersApi.toggleActive(statusModal.user.id);
      showToast('Status alterado com sucesso!');
      setStatusModal({ open: false, user: null });
      loadUsers();
    } catch (error) {
      showToast('Erro ao alterar status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    setActionLoading(true);
    try {
      await usersApi.delete(deleteModal.user.id);
      showToast('Usuário excluído com sucesso!');
      setDeleteModal({ open: false, user: null });
      loadUsers();
    } catch (error) {
      showToast('Erro ao excluir usuário', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordModal.user || !newPassword) return;
    if (newPassword.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await usersApi.resetPassword(passwordModal.user.id, newPassword);
      showToast('Senha resetada com sucesso!');
      setPasswordModal({ open: false, user: null });
      setNewPassword('');
    } catch (error) {
      showToast('Erro ao resetar senha', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors = {
    ADMIN: 'bg-red-100 text-red-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    ADMINISTRATIVE: 'bg-purple-100 text-purple-800',
    WAREHOUSE: 'bg-amber-100 text-amber-800',
    TECHNICIAN: 'bg-green-100 text-green-800',
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Gerenciar Usuários</h1>
              <p className="text-gray-300">Administre os usuários do sistema em ordem alfabética</p>
            </div>
          </div>
          <Shield className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => router.push('/users/new')}
            className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-600">Total de Usuários</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.active).length}
          </div>
          <div className="text-sm text-gray-600">Ativos</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => !u.active).length}
          </div>
          <div className="text-sm text-gray-600">Inativos</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
          <div className="text-sm text-gray-600">Administradores</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  E-mail
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 opacity-20 mx-auto mb-4" />
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold border-2 border-white shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">{user.name}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">Você</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.active ? (
                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                          <UserCheck className="h-4 w-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                          <UserX className="h-4 w-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/users/${user.id}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPasswordModal({ open: true, user })}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Resetar Senha"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setStatusModal({ open: true, user })}
                          className={`p-2 transition-all rounded-lg ${
                            user.active 
                              ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50' 
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.active ? 'Desativar' : 'Ativar'}
                        >
                          {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => setDeleteModal({ open: true, user })}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Exclusão */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => !actionLoading && setDeleteModal({ open, user: open ? deleteModal.user : null })}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Excluir Usuário</DialogTitle>
            <DialogDescription className="text-center">
              Você tem certeza que deseja excluir o usuário <strong>{deleteModal.user?.name}</strong>? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, user: null })} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Status */}
      <Dialog open={statusModal.open} onOpenChange={(open) => !actionLoading && setStatusModal({ open, user: open ? statusModal.user : null })}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${statusModal.user?.active ? 'bg-orange-100' : 'bg-green-100'}`}>
              {statusModal.user?.active ? <UserX className="h-6 w-6 text-orange-600" /> : <UserCheck className="h-6 w-6 text-green-600" />}
            </div>
            <DialogTitle className="text-center">{statusModal.user?.active ? 'Desativar' : 'Reativar'} Usuário</DialogTitle>
            <DialogDescription className="text-center">
              Deseja alterar o status de <strong>{statusModal.user?.name}</strong> para <strong>{statusModal.user?.active ? 'Inativo' : 'Ativo'}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setStatusModal({ open: false, user: null })} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button 
              className={statusModal.user?.active ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
              onClick={handleToggleStatus} 
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Resetar Senha */}
      <Dialog open={passwordModal.open} onOpenChange={(open) => {
        if (!actionLoading) {
          setPasswordModal({ open, user: open ? passwordModal.user : null })
          if (!open) setNewPassword('')
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Key className="h-6 w-6 text-purple-600" />
            </div>
            <DialogTitle className="text-center">Resetar Senha</DialogTitle>
            <DialogDescription className="text-center">
              Defina uma nova senha para o usuário <strong>{passwordModal.user?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPasswordModal({ open: false, user: null })} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleResetPassword} disabled={actionLoading || !newPassword}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Atualizar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

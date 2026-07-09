"use client"

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';
import { getRoleLabel, getInitials } from '@/lib/utils';
import { User, Mail, Briefcase, Calendar, Shield, Key, Bell, Pencil, X, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const NOTIFICATION_OPTIONS = [
  { key: 'approvals' as const, label: 'Aprovações pendentes', description: 'Ordens de serviço aguardando sua aprovação' },
  { key: 'lowStock' as const, label: 'Estoque baixo', description: 'Produtos abaixo do estoque mínimo' },
  { key: 'fuelRequests' as const, label: 'Abastecimentos', description: 'Solicitações de abastecimento pendentes' },
  { key: 'materialRequests' as const, label: 'Solicitações de material', description: 'Pedidos pendentes na mesa do almoxarife' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();

  const [editingInfo, setEditingInfo] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingInfo, setSavingInfo] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => ({
    approvals: user?.notifyPrefs?.approvals ?? true,
    lowStock: user?.notifyPrefs?.lowStock ?? true,
    fuelRequests: user?.notifyPrefs?.fuelRequests ?? true,
    materialRequests: user?.notifyPrefs?.materialRequests ?? true,
  }));
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    usersApi.getMe().then((fresh) => {
      updateUser({
        name: fresh.name,
        email: fresh.email,
        active: fresh.active,
        createdAt: fresh.createdAt,
        notifyPrefs: fresh.notifyPrefs,
      });
      setPrefs({
        approvals: fresh.notifyPrefs?.approvals ?? true,
        lowStock: fresh.notifyPrefs?.lowStock ?? true,
        fuelRequests: fresh.notifyPrefs?.fuelRequests ?? true,
        materialRequests: fresh.notifyPrefs?.materialRequests ?? true,
      });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const startEditingInfo = () => {
    setName(user.name);
    setEmail(user.email);
    setEditingInfo(true);
  };

  const cancelEditingInfo = () => {
    setEditingInfo(false);
  };

  const saveInfo = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: 'Erro', description: 'Nome e e-mail são obrigatórios.', variant: 'destructive' });
      return;
    }
    setSavingInfo(true);
    try {
      const updated = await usersApi.updateMe({ name: name.trim(), email: email.trim() });
      updateUser({ name: updated.name, email: updated.email });
      setEditingInfo(false);
      toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setSavingInfo(false);
    }
  };

  const submitPasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Erro', description: 'A nova senha deve ter no mínimo 8 caracteres.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast({ title: 'Sucesso', description: 'Senha alterada com sucesso!' });
      setPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const submitPrefs = async () => {
    setSavingPrefs(true);
    try {
      const updated = await usersApi.updateMyNotifications(prefs);
      updateUser({ notifyPrefs: updated.notifyPrefs });
      toast({ title: 'Sucesso', description: 'Preferências de notificação atualizadas!' });
      setNotificationsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível salvar as preferências.',
        variant: 'destructive',
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
          {getInitials(user.name)}
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground leading-tight">{user.name}</h1>
          <p className="text-text-secondary flex items-center gap-2 text-[13px] mt-1">
            <Briefcase className="h-3.5 w-3.5" />
            {getRoleLabel(user.role)}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14.5px] font-bold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Informações Pessoais
            </h2>
            {!editingInfo ? (
              <button
                onClick={startEditingInfo}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditingInfo}
                  disabled={savingInfo}
                  className="flex items-center gap-1 text-[12px] font-semibold text-text-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={saveInfo}
                  disabled={savingInfo}
                  className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {savingInfo ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-text-muted flex items-center gap-1.5 font-semibold">
                <User className="h-3.5 w-3.5" />
                Nome Completo
              </label>
              {editingInfo ? (
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              ) : (
                <p className="text-foreground font-semibold mt-1 text-[13px]">{user.name}</p>
              )}
            </div>
            <div>
              <label className="text-[12px] text-text-muted flex items-center gap-1.5 font-semibold">
                <Mail className="h-3.5 w-3.5" />
                E-mail
              </label>
              {editingInfo ? (
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              ) : (
                <p className="text-foreground font-semibold mt-1 text-[13px]">{user.email}</p>
              )}
            </div>
            <div>
              <label className="text-[12px] text-text-muted flex items-center gap-1.5 font-semibold">
                <Briefcase className="h-3.5 w-3.5" />
                Cargo/Perfil
              </label>
              <p className="text-foreground font-semibold mt-1 text-[13px]">{getRoleLabel(user.role)}</p>
            </div>
            <div>
              <label className="text-[12px] text-text-muted flex items-center gap-1.5 font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                Membro desde
              </label>
              <p className="text-foreground font-semibold mt-1 text-[13px]">
                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[14.5px] font-bold text-foreground mb-5 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Segurança
          </h2>
          <div className="space-y-2.5">
            <button
              onClick={() => setPasswordOpen(true)}
              className="w-full px-4 py-3 bg-primary text-white rounded-[9px] hover:bg-primary/90 flex items-center justify-center gap-2 font-bold text-[13px]"
            >
              <Key className="h-4 w-4" />
              Alterar Senha
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="w-full px-4 py-3 border border-border rounded-[9px] hover:bg-muted/40 flex items-center justify-center gap-2 font-semibold text-[13px] text-text-secondary"
            >
              <Bell className="h-4 w-4" />
              Gerenciar Notificações
            </button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-[14.5px] font-bold text-foreground mb-4">Atividade Recente</h2>
        <div className="space-y-2.5">
          {[
            { action: 'Login realizado', time: 'Há 2 horas', icon: User },
            { action: 'OS #1234 aprovada', time: 'Ontem às 15:30', icon: Shield },
            { action: 'Perfil atualizado', time: '3 dias atrás', icon: User },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-[10px]">
              <div className="w-9 h-9 rounded-[9px] bg-status-amber-bg flex items-center justify-center shrink-0">
                <activity.icon className="h-4 w-4 text-status-amber-fg" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">{activity.action}</p>
                <p className="text-[11.5px] text-text-muted">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)} disabled={savingPassword}>
              Cancelar
            </Button>
            <Button onClick={submitPasswordChange} disabled={savingPassword}>
              {savingPassword ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Notificações</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {NOTIFICATION_OPTIONS.map((option) => (
              <label
                key={option.key}
                className="flex items-start gap-3 p-3 rounded-[9px] border border-border cursor-pointer hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  checked={prefs[option.key]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [option.key]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 accent-orange-600"
                />
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{option.label}</p>
                  <p className="text-[11.5px] text-text-muted">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationsOpen(false)} disabled={savingPrefs}>
              Cancelar
            </Button>
            <Button onClick={submitPrefs} disabled={savingPrefs}>
              {savingPrefs ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

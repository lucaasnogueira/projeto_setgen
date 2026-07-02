"use client"

import { useAuthStore } from '@/store/auth';
import { getRoleLabel, getInitials } from '@/lib/utils';
import { User, Mail, Briefcase, Calendar, Shield, Key, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

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
          <h2 className="text-[14.5px] font-bold text-foreground mb-5 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Informações Pessoais
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-text-muted flex items-center gap-1.5 font-semibold">
                <User className="h-3.5 w-3.5" />
                Nome Completo
              </label>
              <p className="text-foreground font-semibold mt-1 text-[13px]">{user.name}</p>
            </div>
            <div>
              <label className="text-[12px] text-text-muted flex items-center gap-1.5 font-semibold">
                <Mail className="h-3.5 w-3.5" />
                E-mail
              </label>
              <p className="text-foreground font-semibold mt-1 text-[13px]">{user.email}</p>
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
            <button className="w-full px-4 py-3 bg-primary text-white rounded-[9px] hover:bg-primary/90 flex items-center justify-center gap-2 font-bold text-[13px]">
              <Key className="h-4 w-4" />
              Alterar Senha
            </button>
            <button className="w-full px-4 py-3 border border-border rounded-[9px] hover:bg-muted/40 flex items-center justify-center gap-2 font-semibold text-[13px] text-text-secondary">
              <Shield className="h-4 w-4" />
              Ativar Autenticação 2FA
            </button>
            <button className="w-full px-4 py-3 border border-border rounded-[9px] hover:bg-muted/40 flex items-center justify-center gap-2 font-semibold text-[13px] text-text-secondary">
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
    </div>
  );
}

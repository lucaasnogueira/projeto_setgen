"use client"

import { useAuthStore } from '@/store/auth';
import { getRoleLabel } from '@/lib/utils';
import { User, Mail, Briefcase, Calendar, Shield, Key, Bell } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
            <p className="text-gray-300 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            Informações Pessoais
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo
              </label>
              <p className="text-gray-900 font-medium mt-1">{user.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </label>
              <p className="text-gray-900 font-medium mt-1">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Cargo/Perfil
              </label>
              <p className="text-gray-900 font-medium mt-1">{getRoleLabel(user.role)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membro desde
              </label>
              <p className="text-gray-900 font-medium mt-1">
                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Segurança
          </h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 font-medium shadow-lg">
              <Key className="h-4 w-4" />
              Alterar Senha
            </button>
            <button className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium">
              <Shield className="h-4 w-4" />
              Ativar Autenticação 2FA
            </button>
            <button className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium">
              <Bell className="h-4 w-4" />
              Gerenciar Notificações
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Atividade Recente</h2>
        <div className="space-y-3">
          {[
            { action: 'Login realizado', time: 'Há 2 horas', icon: User },
            { action: 'OS #1234 aprovada', time: 'Ontem às 15:30', icon: Shield },
            { action: 'Perfil atualizado', time: '3 dias atrás', icon: User },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <activity.icon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

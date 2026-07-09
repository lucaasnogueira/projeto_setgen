"use client"

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import {
  User,
  UserCog,
  Shield,
  Tags,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';

interface SettingsLink {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Array<'ADMIN' | 'MANAGER' | 'ADMINISTRATIVE' | 'WAREHOUSE' | 'TECHNICIAN'>;
}

const ACCOUNT_LINKS: SettingsLink[] = [
  {
    title: 'Meu Perfil',
    description: 'Nome, e-mail, senha e preferências de notificação',
    href: '/profile',
    icon: User,
  },
];

const ADMIN_LINKS: SettingsLink[] = [
  {
    title: 'Usuários',
    description: 'Gerenciar contas e acessos do sistema',
    href: '/users',
    icon: UserCog,
    roles: ['ADMIN'],
  },
  {
    title: 'Cargos e Permissões',
    description: 'Definir papéis e o que cada um pode acessar',
    href: '/roles',
    icon: Shield,
    roles: ['ADMIN'],
  },
  {
    title: 'Equipes e Grupos',
    description: 'Organizar equipes e agrupamentos de clientes',
    href: '/settings/client-lookups',
    icon: Tags,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Templates de Checklist',
    description: 'Modelos usados em visitas e ordens de serviço',
    href: '/settings/checklist-templates',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'MANAGER'],
  },
];

function SettingsLinkCard({ link }: { link: SettingsLink }) {
  const router = useRouter();
  const Icon = link.icon;
  return (
    <button
      onClick={() => router.push(link.href)}
      className="w-full text-left"
    >
      <Card className="p-4 flex items-center gap-3.5 hover:border-primary/50 hover:bg-muted/30 transition-colors">
        <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-[18px] w-[18px] text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-foreground">{link.title}</p>
          <p className="text-[12px] text-text-secondary">{link.description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
      </Card>
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const adminLinks = ADMIN_LINKS.filter(
    (link) => !link.roles || (user?.role && link.roles.includes(user.role))
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Gerencie sua conta e as configurações do sistema" />

      <div>
        <h2 className="text-[13px] font-bold text-text-muted uppercase tracking-wide mb-3">
          Minha Conta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACCOUNT_LINKS.map((link) => (
            <SettingsLinkCard key={link.href} link={link} />
          ))}
        </div>
      </div>

      {adminLinks.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold text-text-muted uppercase tracking-wide mb-3">
            Administração
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adminLinks.map((link) => (
              <SettingsLinkCard key={link.href} link={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

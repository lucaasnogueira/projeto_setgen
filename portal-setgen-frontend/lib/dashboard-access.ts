import { UserRole } from '@/types';

/**
 * O dashboard agrega KPIs comerciais, financeiros, de execução e top clientes.
 * Não existe permissão própria dele, então o acesso é derivado: precisa poder
 * ver ao menos uma das áreas que ele resume.
 *
 * Quem não se qualifica (um cargo de RH, por exemplo) não perde o acesso ao
 * portal — cai numa tela de boas-vindas, já que /dashboard é para onde o login
 * redireciona todo mundo.
 *
 * Fica aqui, e não solto na sidebar, para o menu e a página concordarem: item
 * escondido no menu e página aberta seria incoerente.
 */
export const DASHBOARD_PERMISSIONS = [
  'orders:view',
  'expenses:view',
  'clients:view',
  'visits:view',
  'inventory:view',
  'fleet:view',
];

export function canSeeDashboard(
  role: UserRole | undefined,
  permissions: string[] | undefined,
): boolean {
  // ADMIN ignora permissões no backend (PermissionsGuard) — aqui também.
  if (role === UserRole.ADMIN) return true;
  return DASHBOARD_PERMISSIONS.some((p) => permissions?.includes(p));
}

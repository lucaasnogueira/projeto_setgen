/**
 * Deriva as permissões implícitas de uma lista de permissões concedidas.
 *
 * Quem pode criar, editar, excluir, aprovar ou gerenciar um recurso
 * obviamente pode vê-lo — mas isso não estava em lugar nenhum, então um cargo
 * montado com `expenses:create` e sem `expenses:view` deixava o item sumir do
 * menu e a listagem retornar 403. Era um erro de configuração fácil de
 * cometer e difícil de perceber.
 *
 * Aplicar aqui, e não na tela de cargos, garante que API e menu concordem —
 * e que cargos já cadastrados sejam corrigidos sem ninguém reeditar nada.
 */

/** Sufixos que pressupõem leitura do mesmo recurso. */
const IMPLIES_VIEW = [
  'create',
  'edit',
  'delete',
  'manage',
  'approve',
] as const;

export function expandImpliedPermissions(granted: string[]): string[] {
  const effective = new Set(granted);

  for (const name of granted) {
    const separator = name.lastIndexOf(':');
    if (separator < 0) continue;

    const resource = name.slice(0, separator);
    const action = name.slice(separator + 1);

    if ((IMPLIES_VIEW as readonly string[]).includes(action)) {
      effective.add(`${resource}:view`);
    }
  }

  return Array.from(effective);
}

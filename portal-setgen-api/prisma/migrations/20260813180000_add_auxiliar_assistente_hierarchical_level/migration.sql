-- Novos níveis hierárquicos: AUXILIAR e ASSISTENTE.
--
-- Posicionados ANTES de TRAINEE para o enum refletir a ordem real da
-- estrutura (auxiliar -> assistente -> trainee -> júnior -> ...), já que a
-- ordem do tipo é o que o Postgres usa em ORDER BY sobre a coluna.
--
-- ADD VALUE é idempotente com IF NOT EXISTS, então reexecutar a migration
-- num banco que já tenha os valores não quebra.
ALTER TYPE "HierarchicalLevel" ADD VALUE IF NOT EXISTS 'AUXILIAR' BEFORE 'TRAINEE';
ALTER TYPE "HierarchicalLevel" ADD VALUE IF NOT EXISTS 'ASSISTENTE' BEFORE 'TRAINEE';

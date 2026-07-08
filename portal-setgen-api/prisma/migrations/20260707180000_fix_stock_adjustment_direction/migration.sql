-- Replaces the ambiguous MovementType.ADJUSTMENT (was always treated as a
-- stock decrease, so an inventory count that found MORE stock than the
-- system had no way to be recorded) with explicit ADJUSTMENT_IN /
-- ADJUSTMENT_OUT values.
ALTER TYPE "MovementType" RENAME TO "MovementType_old";
CREATE TYPE "MovementType" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER');
ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "MovementType" USING ("type"::text::"MovementType");
DROP TYPE "MovementType_old";

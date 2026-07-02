-- CreateEnum
CREATE TYPE "IcmsTaxpayerType" AS ENUM ('CONTRIBUINTE', 'ISENTO', 'NAO_CONTRIBUINTE');

-- CreateEnum
CREATE TYPE "ClientTaxonomyKind" AS ENUM ('GROUP', 'SEGMENT');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'AWAY', 'VACATION', 'TERMINATED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "CivilStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'STABLE_UNION');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CLT', 'PJ', 'INTERN', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'HOURLY');

-- CreateEnum
CREATE TYPE "WorkRegime" AS ENUM ('PRESENTIAL', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS');

-- CreateEnum
CREATE TYPE "HierarchicalLevel" AS ENUM ('TRAINEE', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'VP', 'CEO');

-- CreateEnum
CREATE TYPE "ASOType" AS ENUM ('ADMISSIONAL', 'PERIODIC', 'RETURN_TO_WORK', 'CHANGE_OF_FUNCTION', 'DISMISSAL');

-- CreateEnum
CREATE TYPE "TipoNota" AS ENUM ('NFE', 'NFSE');

-- CreateEnum
CREATE TYPE "ModalidadeNota" AS ENUM ('SERVICO', 'MERCADORIA', 'MISTA');

-- CreateEnum
CREATE TYPE "StatusNota" AS ENUM ('PENDENTE', 'PROCESSANDO', 'AUTORIZADA', 'REJEITADA', 'CANCELADA', 'DENEGADA');

-- CreateEnum
CREATE TYPE "AmbienteNota" AS ENUM ('PRODUCAO', 'HOMOLOGACAO');

-- CreateEnum
CREATE TYPE "EventoSefazTipo" AS ENUM ('AUTORIZACAO', 'CANCELAMENTO', 'INUTILIZACAO', 'CARTA_CORRECAO', 'REJEICAO');

-- CreateEnum
CREATE TYPE "WebhookEventoTipo" AS ENUM ('NOTA_AUTORIZADA', 'NOTA_REJEITADA', 'NOTA_CANCELADA');

-- DropForeignKey
ALTER TABLE "technical_visits" DROP CONSTRAINT "technical_visits_technicianId_fkey";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "corporateEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "corporatePhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "externalCode" TEXT,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "icmsTaxpayerType" "IcmsTaxpayerType",
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "municipalRegistration" TEXT,
ADD COLUMN     "onSiteContact" TEXT,
ADD COLUMN     "responsibleTeamId" TEXT,
ADD COLUMN     "responsibleUserId" TEXT,
ADD COLUMN     "segmentId" TEXT,
ADD COLUMN     "stateRegistration" TEXT;

-- AlterTable
ALTER TABLE "technical_visits" ADD COLUMN     "attachmentsData" JSONB,
ADD COLUMN     "checkinAccuracy" DOUBLE PRECISION,
ADD COLUMN     "checkinAt" TIMESTAMP(3),
ADD COLUMN     "checkinLat" DOUBLE PRECISION,
ADD COLUMN     "checkinLng" DOUBLE PRECISION,
ADD COLUMN     "checkoutAccuracy" DOUBLE PRECISION,
ADD COLUMN     "checkoutAt" TIMESTAMP(3),
ADD COLUMN     "checkoutLat" DOUBLE PRECISION,
ADD COLUMN     "checkoutLng" DOUBLE PRECISION,
ADD COLUMN     "responsibleIds" TEXT[],
ADD COLUMN     "userReport" TEXT,
ALTER COLUMN "technicianId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roleId" TEXT;

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_taxonomies" (
    "id" TEXT NOT NULL,
    "kind" "ClientTaxonomyKind" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_taxonomies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "socialName" TEXT,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "civilStatus" "CivilStatus",
    "nationality" TEXT,
    "birthPlace" TEXT,
    "photoUrl" TEXT,
    "isPcd" BOOLEAN NOT NULL DEFAULT false,
    "pcdType" TEXT,
    "personalEmail" TEXT,
    "corporateEmail" TEXT,
    "mobilePhone" TEXT,
    "landlinePhone" TEXT,
    "address" JSONB,
    "ctps" TEXT,
    "pisPasep" TEXT,
    "voterId" TEXT,
    "militaryCertificate" TEXT,
    "admissionDate" TIMESTAMP(3),
    "contractType" "ContractType" DEFAULT 'CLT',
    "workHours" TEXT,
    "position" TEXT,
    "department" TEXT,
    "costCenterId" TEXT,
    "baseSalary" DECIMAL(10,2),
    "salaryType" "SalaryType" DEFAULT 'MONTHLY',
    "workRegime" "WorkRegime" DEFAULT 'PRESENTIAL',
    "bank" TEXT,
    "agency" TEXT,
    "account" TEXT,
    "accountType" "AccountType",
    "pixKey" TEXT,
    "irDependents" INTEGER NOT NULL DEFAULT 0,
    "benefitsPlan" JSONB,
    "registration" TEXT,
    "managerId" TEXT,
    "team" TEXT,
    "branch" TEXT,
    "businessUnit" TEXT,
    "hierarchicalLevel" "HierarchicalLevel",
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "terminationReason" TEXT,
    "terminationDate" TIMESTAMP(3),
    "userId" TEXT,
    "login" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_movements" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asos" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "ASOType" NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "result" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "tipo" "TipoNota" NOT NULL,
    "modalidade" "ModalidadeNota" NOT NULL,
    "chaveAcesso" TEXT,
    "protocolo" TEXT,
    "serviceOrderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "emitenteCnpj" TEXT NOT NULL,
    "destinatarioCnpj" TEXT NOT NULL,
    "valorBruto" DECIMAL(14,2) NOT NULL,
    "valorLiquido" DECIMAL(14,2) NOT NULL,
    "xmlAssinado" TEXT,
    "xmlAutorizado" TEXT,
    "pdfDanfeUrl" TEXT,
    "status" "StatusNota" NOT NULL DEFAULT 'PENDENTE',
    "ambiente" "AmbienteNota" NOT NULL DEFAULT 'HOMOLOGACAO',
    "splitPayment" JSONB,
    "motivoCancelamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impostos_retidos" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "aliquotaIss" DECIMAL(6,4),
    "valorIss" DECIMAL(14,4),
    "aliquotaIcms" DECIMAL(6,4),
    "valorIcms" DECIMAL(14,4),
    "aliquotaPis" DECIMAL(6,4),
    "valorPis" DECIMAL(14,4),
    "aliquotaCofins" DECIMAL(6,4),
    "valorCofins" DECIMAL(14,4),
    "aliquotaCbs" DECIMAL(6,4) NOT NULL,
    "valorCbs" DECIMAL(14,4) NOT NULL,
    "aliquotaIbs" DECIMAL(6,4) NOT NULL,
    "valorIbs" DECIMAL(14,4) NOT NULL,
    "creditoPresumidoZfm" DECIMAL(14,4),
    "beneficioZfmAtivo" BOOLEAN NOT NULL DEFAULT false,
    "totalImpostoLegado" DECIMAL(14,4) NOT NULL,
    "totalImposto2026" DECIMAL(14,4) NOT NULL,
    "calculoPorFora" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impostos_retidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_sefaz" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "tipo" "EventoSefazTipo" NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "protocolo" TEXT,
    "xmlEvento" TEXT,
    "xmlRetorno" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_sefaz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_dispatches" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "evento" "WebhookEventoTipo" NOT NULL,
    "url" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "sucesso" BOOLEAN NOT NULL DEFAULT false,
    "proxTentativa" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeamToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeamToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_taxonomies_kind_name_key" ON "client_taxonomies"("kind", "name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_key" ON "employees"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "employees_personalEmail_key" ON "employees"("personalEmail");

-- CreateIndex
CREATE UNIQUE INDEX "employees_corporateEmail_key" ON "employees"("corporateEmail");

-- CreateIndex
CREATE UNIQUE INDEX "employees_registration_key" ON "employees"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_login_key" ON "employees"("login");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_numero_key" ON "notas_fiscais"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_chaveAcesso_key" ON "notas_fiscais"("chaveAcesso");

-- CreateIndex
CREATE INDEX "notas_fiscais_serviceOrderId_idx" ON "notas_fiscais"("serviceOrderId");

-- CreateIndex
CREATE INDEX "notas_fiscais_status_idx" ON "notas_fiscais"("status");

-- CreateIndex
CREATE INDEX "_TeamToUser_B_index" ON "_TeamToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "clients_externalCode_key" ON "clients"("externalCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_responsibleTeamId_fkey" FOREIGN KEY ("responsibleTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "client_taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "client_taxonomies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_visits" ADD CONSTRAINT "technical_visits_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asos" ADD CONSTRAINT "asos_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos_retidos" ADD CONSTRAINT "impostos_retidos_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_sefaz" ADD CONSTRAINT "eventos_sefaz_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_dispatches" ADD CONSTRAINT "webhook_dispatches_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamToUser" ADD CONSTRAINT "_TeamToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamToUser" ADD CONSTRAINT "_TeamToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


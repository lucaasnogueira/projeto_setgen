import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { TeamsModule } from './teams/teams.module';
import { ClientTaxonomiesModule } from './client-taxonomies/client-taxonomies.module';
import { VisitsModule } from './visits/visits.module';
import { EquipmentModule } from './equipment/equipment.module';
import { VisitTaskTypesModule } from './visit-task-types/visit-task-types.module';
import { FailureCategoriesModule } from './failure-categories/failure-categories.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { ChecklistTemplatesModule } from './checklist-templates/checklist-templates.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { ArtModule } from './art/art.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { MaterialRequestsModule } from './material-requests/material-requests.module';
import { ProcurementOrdersModule } from './procurement-orders/procurement-orders.module';
import { WarrantiesModule } from './warranties/warranties.module';
import { ReportsModule } from './reports/reports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { EmployeesModule } from './employees/employees.module';
import { AccessControlModule } from './access-control/access-control.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { UploadsModule } from './common/uploads/uploads.module';
import { PublicQuotesModule } from './public-quotes/public-quotes.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { FuelRequestsModule } from './fuel-requests/fuel-requests.module';
import { StockLocationsModule } from './stock-locations/stock-locations.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    TeamsModule,
    ClientTaxonomiesModule,
    VisitsModule,
    EquipmentModule,
    VisitTaskTypesModule,
    FailureCategoriesModule,
    ServiceOrdersModule,
    ChecklistTemplatesModule,
    ApprovalsModule,
    ArtModule,
    PurchaseOrdersModule,
    DeliveriesModule,
    WarrantiesModule,
    DashboardModule,
    InventoryModule,
    SuppliersModule,
    MaterialRequestsModule,
    ProcurementOrdersModule,
    ReportsModule,
    ExpensesModule,
    ExpenseCategoriesModule,
    EmployeesModule,
    AccessControlModule,
    FiscalModule,
    UploadsModule,
    PublicQuotesModule,
    VehiclesModule,
    FuelRequestsModule,
    StockLocationsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
})
export class AppModule {}

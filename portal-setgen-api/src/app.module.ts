import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { VisitsModule } from './visits/visits.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    VisitsModule,
    VisitsModule,
    ServiceOrdersModule,
    ApprovalsModule,
    PurchaseOrdersModule,
    InvoicesModule,
    DeliveriesModule,
    DashboardModule,
    InventoryModule,
    ReportsModule,
  ],
})
export class AppModule {}

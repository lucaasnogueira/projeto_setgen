// Barrel export for all API services
export { authApi } from './auth';
export { clientsApi } from './clients';
export { visitsApi } from './visits';
export { serviceOrdersApi } from './service-orders';
export { approvalsApi } from './approvals';
export { purchaseOrdersApi } from './purchase-orders';
export { invoicesApi } from './invoices';
export { deliveriesApi } from './deliveries';
export { inventoryApi } from './inventory';
export { dashboardApi } from './dashboard';
export { usersApi } from './users';
export { ordersApi } from './orders';

// Export the default axios instance
export { api as default } from './client';

// ========================================
// ENUMS
// ========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  WAREHOUSE = 'WAREHOUSE',
  TECHNICIAN = 'TECHNICIAN',
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEFAULTER = 'DEFAULTER',
}

export enum VisitType {
  COMMERCIAL = 'COMMERCIAL',
  TECHNICAL = 'TECHNICAL',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ServiceOrderType {
  VISIT_REPORT = 'VISIT_REPORT',
  EXECUTION = 'EXECUTION',
}

export enum ServiceOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PurchaseOrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EXPIRED = 'EXPIRED',
}

export enum InvoiceStatus {
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

// ========================================
// INTERFACES
// ========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  cnpjCpf: string;
  companyName: string;
  tradeName?: string;
  address: Address;
  phone: string;
  email: string;
  contacts: Contact[];
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface TechnicalVisit {
  id: string;
  clientId: string;
  technicianId: string;
  visitDate: string;
  visitType: VisitType;
  location: string;
  description: string;
  identifiedNeeds?: string;
  suggestedScope?: string;
  estimatedDeadline?: string;
  estimatedValue?: number;
  attachments: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  technician?: User;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  type: ServiceOrderType;
  clientId: string;
  technicalVisitId?: string;
  status: ServiceOrderStatus;
  scope: string;
  reportedDefects?: string;
  requestedServices?: string;
  notes?: string;
  requiredResources?: any;
  deadline?: string;
  responsibleIds: string[];
  checklist: ChecklistItem[];
  progress: number;
  attachments: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  technicalVisit?: TechnicalVisit;
  createdBy?: User;
  items?: ServiceOrderProduct[];
  statusHistory?: ServiceOrderStatusHistory[];
}

export interface ServiceOrderStatusHistory {
  id: string;
  serviceOrderId: string;
  previousStatus: ServiceOrderStatus;
  newStatus: ServiceOrderStatus;
  changedById: string;
  changedBy?: User;
  comments?: string;
  changedAt: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}
export interface ServiceOrderProduct {
  id: string;
  serviceOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  product?: Product;
}

export interface Approval {
  id: string;
  serviceOrderId: string;
  approverId: string;
  status: ApprovalStatus;
  comments?: string;
  approvedAt: string;
  createdAt: string;
  serviceOrder?: ServiceOrder;
  approver?: User;
}

export interface PurchaseOrder {
  id: string;
  serviceOrderId: string;
  clientId: string;
  orderNumber: string;
  value: number;
  issueDate: string;
  expiryDate: string;
  status: PurchaseOrderStatus;
  fileUrl: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  serviceOrder?: ServiceOrder;
  client?: Client;
  uploadedBy?: User;
}

export interface Invoice {
  id: string;
  serviceOrderId: string;
  purchaseOrderId: string;
  invoiceNumber: string;
  series: string;
  value: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  xmlUrl?: string;
  pdfUrl?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  serviceOrder?: ServiceOrder;
  purchaseOrder?: PurchaseOrder;
  createdBy?: User;
}

export interface Delivery {
  id: string;
  serviceOrderId: string;
  deliveryDate: string;
  deliveredById: string;
  receivedBy: string;
  checklist: ChecklistItem[];
  evidences: string[];
  acceptanceSignature?: string;
  notes?: string;
  createdAt: string;
  serviceOrder?: ServiceOrder;
  deliveredBy?: User;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  minStock: number;
  currentStock: number;
  unitCost?: number;
  unitPrice?: number;
  unitsPerPackage?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  referenceId?: string;
  createdById: string;
  createdAt: string;
  product?: Product;
  createdBy?: User;
}

export interface DashboardStats {
  pendingApprovals: number;
  activeOrders: number;
  completedThisMonth: number;
  totalRevenue: number;
  lowStockItems: number;
  overdueInvoices: number;
}

export interface CNPJData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  telefone: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  accessToken?: string; // Backend retorna accessToken (camelCase)
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

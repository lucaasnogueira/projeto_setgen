// ========================================
// ENUMS
// ========================================

import { PaymentMethod } from './financial';
export { PaymentMethod };

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

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  EN_ROUTE = 'EN_ROUTE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum EquipmentType {
  GENERATOR = 'GENERATOR',
  SUBSTATION = 'SUBSTATION',
  OTHER = 'OTHER',
}

export enum VisitPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum ServiceOrderType {
  VISIT_REPORT = 'VISIT_REPORT',
  EXECUTION = 'EXECUTION',
}

export enum ChecklistFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  PHOTO = 'PHOTO',
  SIGNATURE = 'SIGNATURE',
  BOOLEAN = 'BOOLEAN',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

export enum ServiceOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT_TO_CLIENT = 'SENT_TO_CLIENT',
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_MATERIALS = 'AWAITING_MATERIALS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum QuoteLineType {
  SERVICE = 'SERVICE',
  MATERIAL = 'MATERIAL',
  LABOR_HOUR = 'LABOR_HOUR',
  TRAVEL = 'TRAVEL',
  ADDITIONAL_COST = 'ADDITIONAL_COST',
}

export enum MaterialRequestStatus {
  PENDING = 'PENDING',
  PARTIALLY_RESERVED = 'PARTIALLY_RESERVED',
  SEPARATED = 'SEPARATED',
  AWAITING_PURCHASE = 'AWAITING_PURCHASE',
  RELEASED = 'RELEASED',
}

export enum ProcurementOrderStatus {
  QUOTING = 'QUOTING',
  ORDER_ISSUED = 'ORDER_ISSUED',
  AWAITING_DELIVERY = 'AWAITING_DELIVERY',
  RECEIVED = 'RECEIVED',
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

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  TRANSFER = 'TRANSFER',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  AWAY = 'AWAY',
  VACATION = 'VACATION',
  TERMINATED = 'TERMINATED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum CivilStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  STABLE_UNION = 'STABLE_UNION',
}

export enum ContractType {
  CLT = 'CLT',
  PJ = 'PJ',
  INTERN = 'INTERN',
  TEMPORARY = 'TEMPORARY',
}

export enum SalaryType {
  MONTHLY = 'MONTHLY',
  HOURLY = 'HOURLY',
}

export enum WorkRegime {
  PRESENTIAL = 'PRESENTIAL',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export enum HierarchicalLevel {
  TRAINEE = 'TRAINEE',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  VP = 'VP',
  CEO = 'CEO',
}

export enum ASOType {
  ADMISSIONAL = 'ADMISSIONAL',
  PERIODIC = 'PERIODIC',
  RETURN_TO_WORK = 'RETURN_TO_WORK',
  CHANGE_OF_FUNCTION = 'CHANGE_OF_FUNCTION',
  DISMISSAL = 'DISMISSAL',
}

export enum FiscalStatus {
  PENDENTE = 'PENDENTE',
  PROCESSANDO = 'PROCESSANDO',
  AUTORIZADA = 'AUTORIZADA',
  REJEITADA = 'REJEITADA',
  CANCELADA = 'CANCELADA',
  DENEGADA = 'DENEGADA',
}

export enum IcmsTaxpayerType {
  CONTRIBUINTE = 'CONTRIBUINTE',
  ISENTO = 'ISENTO',
  NAO_CONTRIBUINTE = 'NAO_CONTRIBUINTE',
}

export enum ClientTaxonomyKind {
  GROUP = 'GROUP',
  SEGMENT = 'SEGMENT',
}

export enum VehicleTripStatus {
  OUT = 'OUT',
  RETURNED = 'RETURNED',
}

export enum FuelRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ========================================
// INTERFACES
// ========================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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

  // Paridade Auvo
  externalCode?: string;
  onSiteContact?: string;
  corporatePhones?: string[];
  corporateEmails?: string[];
  internalNotes?: string;
  icmsTaxpayerType?: IcmsTaxpayerType;
  stateRegistration?: string;
  municipalRegistration?: string;
  billingEmail?: string;
  latitude?: number;
  longitude?: number;
  responsibleUserId?: string;
  responsibleTeamId?: string;
  groupId?: string;
  segmentId?: string;
  responsibleUser?: Pick<User, 'id' | 'name'>;
  responsibleTeam?: Team;
  group?: ClientTaxonomy;
  segment?: ClientTaxonomy;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  members?: Pick<User, 'id' | 'name'>[];
}

export interface ClientTaxonomy {
  id: string;
  kind: ClientTaxonomyKind;
  name: string;
  color?: string;
  active: boolean;
  createdAt: string;
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

export interface AttachmentData {
  url: string;
  legend?: string;
}

export interface FailureCategory {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface VisitTaskType {
  id: string;
  name: string;
  defaultChecklistTemplateId?: string;
  active: boolean;
  createdAt: string;
  defaultChecklistTemplate?: Pick<ChecklistTemplate, 'id' | 'name'>;
}

export interface VisitEquipmentLink {
  id: string;
  visitId: string;
  equipmentId: string;
  equipment?: Equipment;
}

export interface TechnicalVisit {
  id: string;
  clientId: string;
  technicianId?: string;
  equipmentId?: string;
  equipmentIds?: string[];
  failureCategoryId?: string;
  taskTypeId?: string;
  priority?: VisitPriority;
  checklistTemplateId?: string;
  checklist?: ChecklistAnswerItem[];
  externalCode?: string;
  createdById?: string;
  actualValue?: number;
  visitDate: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  status?: VisitStatus;
  chargeable?: boolean;
  visitType: VisitType;
  location: string;
  description: string;
  userReport?: string;
  identifiedNeeds?: string;
  suggestedScope?: string;
  estimatedDeadline?: string;
  estimatedValue?: number;
  attachments: string[];
  attachmentsData?: AttachmentData[];
  responsibleIds?: string[];
  notes?: string;
  checkinAt?: string;
  checkinLat?: number;
  checkinLng?: number;
  checkinAccuracy?: number;
  checkinDistanceMeters?: number | null;
  checkinImprecise?: boolean;
  checkoutAt?: string;
  checkoutLat?: number;
  checkoutLng?: number;
  checkoutAccuracy?: number;
  checkoutDistanceMeters?: number | null;
  checkoutImprecise?: boolean;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  technician?: User;
  createdBy?: Pick<User, 'id' | 'name'>;
  equipment?: Equipment;
  equipments?: VisitEquipmentLink[];
  failureCategory?: FailureCategory;
  taskType?: VisitTaskType;
  checklistTemplate?: Pick<ChecklistTemplate, 'id' | 'name'>;
}

export interface Equipment {
  id: string;
  clientId: string;
  type: EquipmentType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  powerRating?: string;
  installLocation?: string;
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Pick<Client, 'id' | 'companyName' | 'tradeName'>;
  technicalVisits?: Pick<TechnicalVisit, 'id' | 'visitDate' | 'status' | 'chargeable' | 'failureCategoryId'>[];
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
  validUntil?: string;
  responsibleIds: string[];
  checklist: ChecklistAnswerItem[];
  checklistTemplateId?: string;
  checklistTemplate?: Pick<ChecklistTemplate, 'id' | 'name'>;
  progress: number;
  attachments: string[];
  createdById: string;
  paymentMethod?: PaymentMethod;
  paymentTerms?: string;
  warrantyMonths?: number;
  salesRepId?: string;
  salesRep?: Pick<User, 'id' | 'name'>;
  linkedVisits?: ServiceOrderVisitLink[];
  createdAt: string;
  updatedAt: string;
  client?: Client;
  technicalVisit?: TechnicalVisit;
  createdBy?: User;
  items?: ServiceOrderProduct[];
  statusHistory?: ServiceOrderStatusHistory[];
  quoteLines?: QuoteLine[];
  art?: ART;
}

export interface ServiceOrderVisitLink {
  id: string;
  serviceOrderId: string;
  technicalVisitId: string;
  technicalVisit?: Pick<TechnicalVisit, 'id' | 'visitDate' | 'visitType' | 'status'>;
}

export interface QuoteLine {
  id: string;
  serviceOrderId: string;
  type: QuoteLineType;
  description: string;
  quantity: number;
  unitValue: number;
  discount: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderAuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes: { from?: string; to?: string; comments?: string; reason?: string } | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name'>;
}

export interface ART {
  id: string;
  serviceOrderId: string;
  number: string;
  engineerName: string;
  creaNumber: string;
  issueDate: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistFieldDefinition {
  id: string;
  type: ChecklistFieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface ChecklistAnswerItem extends ChecklistFieldDefinition {
  answer: string | number | boolean | null;
  completed: boolean;
  // Shape legado (pré-templates): { item, completed }
  item?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  serviceOrderType?: ServiceOrderType;
  active: boolean;
  fields: ChecklistFieldDefinition[];
  createdAt: string;
  updatedAt: string;
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

export interface NotaFiscalItem {
  id: string;
  notaId: string;
  productId: string;
  product?: Product;
  ncm: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  fabricadoNaZfm: boolean;
  cfop: string;
}

export interface Invoice {
  id: string;
  serviceOrderId?: string;
  clientId: string;
  invoiceNumber: string;
  series: string;
  serie?: string;
  value: number;
  issueDate: string;
  status: FiscalStatus;
  chaveAcesso?: string;
  protocolo?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  serviceOrder?: ServiceOrder;
  client?: Client;
  createdBy?: User;
  itens?: NotaFiscalItem[];
  impostos?: FiscalTax[];
  splitPayment?: FiscalSplitPayment;
  eventos?: EventoSefaz[];
}

export interface EventoSefaz {
  id: string;
  notaId: string;
  tipo: string;
  codigo: string;
  descricao: string;
  protocolo?: string;
  xmlEvento?: string;
  xmlRetorno?: string;
  createdAt: string;
}

export interface FiscalTax {
  id: string;
  notaId: string;
  valorIss?: number;
  valorIcms?: number;
  valorPis?: number;
  valorCofins?: number;
  aliquotaCbs: number;
  valorCbs: number;
  aliquotaIbs: number;
  valorIbs: number;
  creditoPresumidoZfm?: number;
  beneficioZfmAtivo: boolean;
  totalImposto: number;
  createdAt: string;
}

export interface FiscalSplitPayment {
  valorRetido: number;
  banco?: string;
  chavePix?: string;
  descricao?: string;
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

export interface StockLocation {
  id: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  ncm?: string;
  minStock: number;
  currentStock: number;
  unitCost?: number;
  photoUrl?: string;
  barcode?: string;
  locationId?: string;
  location?: Pick<StockLocation, 'id' | 'code'>;
  unitPrice?: number;
  unitsPerPackage?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
}

export interface MaterialRequestItem {
  id: string;
  materialRequestId: string;
  productId: string;
  quantityNeeded: number;
  quantityReserved: number;
  product?: Product;
}

export interface MaterialRequest {
  id: string;
  serviceOrderId: string;
  status: MaterialRequestStatus;
  priority: number;
  expectedExecutionDate?: string;
  createdAt: string;
  updatedAt: string;
  serviceOrder?: {
    id: string;
    orderNumber: string;
    client?: { id: string; companyName: string };
  };
  items: MaterialRequestItem[];
  procurementOrders?: Pick<ProcurementOrder, 'id' | 'status' | 'supplierId'>[];
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementOrderItem {
  id: string;
  procurementOrderId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  product?: Product;
}

export interface ProcurementOrder {
  id: string;
  supplierId?: string;
  materialRequestId?: string;
  status: ProcurementOrderStatus;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items: ProcurementOrderItem[];
  materialRequest?: {
    id: string;
    serviceOrder?: { id: string; orderNumber: string };
  };
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

export interface Employee {
  id: string;
  // 📌 1. Dados Pessoais
  name: string;
  socialName?: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  gender?: Gender;
  civilStatus?: CivilStatus;
  nationality?: string;
  birthPlace?: string;
  photoUrl?: string;
  isPcd: boolean;
  pcdType?: string;

  // 📌 2. Contato
  personalEmail?: string;
  corporateEmail?: string;
  mobilePhone?: string;
  landlinePhone?: string;
  address?: Address;

  // 📌 3. Dados Trabalhistas
  ctps?: string;
  pisPasep?: string;
  voterId?: string;
  militaryCertificate?: string;
  admissionDate?: string;
  contractType?: ContractType;
  workHours?: string;
  position?: string;
  department?: string;
  costCenterId?: string;
  baseSalary?: number;
  salaryType?: SalaryType;
  workRegime?: WorkRegime;

  // 📌 4. Dados Financeiros
  bank?: string;
  agency?: string;
  account?: string;
  accountType?: AccountType;
  pixKey?: string;
  irDependents: number;
  benefitsPlan?: any;

  // 📌 5. Estrutura Organizacional
  registration?: string;
  managerId?: string;
  manager?: Employee;
  subordinates?: Employee[];
  team?: string;
  branch?: string;
  businessUnit?: string;
  hierarchicalLevel?: HierarchicalLevel;

  // 📌 6. Status do Colaborador
  status: EmployeeStatus;
  terminationReason?: string;
  terminationDate?: string;
  movements?: EmployeeMovement[];

  // 📌 7. Dados de Acesso ao Sistema
  userId?: string;
  user?: User;
  login?: string;

  // 📌 8. Anexos
  asos?: ASO[];
  documents?: EmployeeDocument[];
  
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeMovement {
  id: string;
  employeeId: string;
  type: string;
  description: string;
  previousValue?: string;
  newValue?: string;
  date: string;
  createdAt: string;
}

export interface ASO {
  id: string;
  employeeId: string;
  type: ASOType;
  examDate: string;
  expiryDate: string;
  result?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  name: string;
  type?: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  photoUrl?: string;
  currentKm: number;
  lastOilChangeKm: number;
  oilChangeIntervalKm: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculados pelo backend (nunca persistidos)
  nextOilChangeKm: number;
  oilStatus: 'OK' | 'TROCAR';
  kmUntilOilChange: number;
}

export interface VehicleTrip {
  id: string;
  vehicleId: string;
  driverId: string;
  destination: string;
  startKm: number;
  endKm?: number;
  status: VehicleTripStatus;
  startedAt: string;
  endedAt?: string;
  createdById: string;
  vehicle?: Pick<Vehicle, 'id' | 'name' | 'plate'>;
  driver?: Pick<Employee, 'id' | 'name'>;
}

export interface FuelRequest {
  id: string;
  vehicleId: string;
  requestedById: string;
  requestedAt: string;
  liters: number;
  unitPrice: number;
  totalValue: number;
  currentKm?: number;
  fuelStation?: string;
  status: FuelRequestStatus;
  approverId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  vehicle?: Pick<Vehicle, 'id' | 'name' | 'plate'>;
  requestedBy?: Pick<User, 'id' | 'name'>;
  approver?: Pick<User, 'id' | 'name'>;
}

export * from './financial';

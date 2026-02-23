import { User, Client, TechnicalVisit, ServiceOrder } from './index';

export enum ExpenseType {
  SERVICE = 'SERVICE',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  FINANCIAL = 'FINANCIAL',
  TAX = 'TAX',
  PAYROLL = 'PAYROLL',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PIX = 'PIX',
  BANK_SLIP = 'BANK_SLIP',
  CHECK = 'CHECK',
}

export enum ExpenseCategoryType {
  OPERATIONAL = 'OPERATIONAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  FINANCIAL = 'FINANCIAL',
  TAX = 'TAX',
  PAYROLL = 'PAYROLL',
}

export enum ExpenseGroup {
  SUPPLIERS_AND_PURCHASES = 'SUPPLIERS_AND_PURCHASES',
  PRO_LABORE = 'PRO_LABORE',
  FINANCIAL_COMMITMENTS = 'FINANCIAL_COMMITMENTS',
  TAXES = 'TAXES',
  MONTHLY_EXPENSES = 'MONTHLY_EXPENSES',
  BANK_DISBURSEMENTS = 'BANK_DISBURSEMENTS',
  SERVICE_EXPENSES = 'SERVICE_EXPENSES',
}

export enum RecurrenceFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum CashFlowType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  type: ExpenseCategoryType;
  group: ExpenseGroup;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  defaultBudget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  agency: string;
  account: string;
  type: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  categoryId: string;
  amount: number;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  category?: ExpenseCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseAttachment {
  id: string;
  expenseId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
  user?: User;
}

export interface Expense {
  id: string;
  code: string;
  description: string;
  type: ExpenseType;
  amount: number;
  paidAmount?: number;
  date: string;
  dueDate: string;
  paymentDate?: string;
  competenceDate: string;
  categoryId: string;
  category?: ExpenseCategory;
  costCenterId?: string;
  costCenter?: CostCenter;
  visitId?: string;
  visit?: TechnicalVisit;
  serviceOrderId?: string;
  serviceOrder?: ServiceOrder;
  clientId?: string;
  client?: Client;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  documentNumber?: string;
  userId: string;
  user?: User;
  approvedBy?: string;
  approver?: User;
  approvalDate?: string;
  rejectionReason?: string;
  status: ExpenseStatus;
  notes?: string;
  isRecurring: boolean;
  recurringId?: string;
  recurring?: RecurringExpense;
  supplier?: string;
  installment?: number;
  totalInstallments?: number;
  parentExpenseId?: string;
  tags: string[];
  isFixed: boolean;
  reconciled: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
  attachments?: ExpenseAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CashFlow {
  id: string;
  date: string;
  type: CashFlowType;
  category: string;
  amount: number;
  balance: number;
  description: string;
  expenseId?: string;
  bankAccountId: string;
  bankAccount?: BankAccount;
  createdAt: string;
}

export interface DashboardData {
  summary: {
    totalExpenses: number;
    totalCount: number;
    paidExpenses: number;
    paidCount: number;
    pendingExpenses: number;
    pendingCount: number;
    totalBalance: number;
  };
  byCategory: Array<{
    category: ExpenseCategory;
    total: number;
    count: number;
  }>;
  byType: Array<{
    type: ExpenseType;
    _sum: { amount: number };
  }>;
  bankAccounts: BankAccount[];
  cashFlow: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

export interface CreateExpenseDto {
  description: string;
  type: ExpenseType;
  amount: number;
  paidAmount?: number;
  date: string;
  dueDate: string;
  paymentDate?: string;
  competenceDate: string;
  categoryId: string;
  costCenterId?: string;
  visitId?: string;
  serviceOrderId?: string;
  clientId?: string;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  documentNumber?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringId?: string;
  supplier?: string;
  installment?: number;
  totalInstallments?: number;
  tags?: string[];
  isFixed?: boolean;
}

export interface FilterExpenseDto {
  startDate?: string;
  endDate?: string;
  competenceMonth?: string;
  type?: ExpenseType[];
  status?: ExpenseStatus[];
  categoryId?: string[];
  costCenterId?: string[];
  clientId?: string;
  visitId?: string;
  serviceOrderId?: string;
  userId?: string;
  paymentMethod?: PaymentMethod[];
  bankAccountId?: string;
  minAmount?: number;
  maxAmount?: number;
  isRecurring?: boolean;
  isFixed?: boolean;
  reconciled?: boolean;
  tags?: string[];
  sortBy?: 'date' | 'amount' | 'dueDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

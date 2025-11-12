/**
 * Job Types following ACTION-ENTITY pattern
 */
export enum JobAction {
  FETCH = 'fetch',
  PAY = 'pay',
  REJECT = 'reject',
}

export enum JobEntity {
  ACCOUNT_DATA = 'account-data',
  INVOICE = 'invoice',
}

export type JobType = `${JobAction}-${JobEntity}`;

/**
 * Base job data interface
 */
export interface BaseJobData {
  provider: string;
  accountContract: string;
}

/**
 * Fetch Account Data Job
 */
export interface FetchAccountDataJobData extends BaseJobData {
  type: 'fetch-account-data';
}

export interface FetchAccountDataResult {
  balance: number;
  refund: boolean;
  date: string;
  refundInProcess: boolean;
  refundRequestCreatedAt: string | null;
  hasGuarantee: boolean;
  hasUnpaidGuarantee: boolean;
  balancePay: boolean;
  refundDocumentsRequired: boolean;
  isAssociation: boolean;
}

/**
 * Fetch Invoice Job
 */
export interface FetchInvoiceJobData extends BaseJobData {
  type: 'fetch-invoice';
  status?: 'unpaid' | 'paid' | 'all';
}

export interface Invoice {
  fiscalNumber: string;
  maturityDate: string;
  emissionDate: string;
  disconnectionDate: string | null;
  printDate: string;
  archiveDate: string | null;
  issuedValue: number;
  balanceValue: number;
  invoiceNumber: string;
  state: string;
  type: string;
  sector: string;
  cb: string;
  companyCode: string;
  electronic: boolean;
  accountContract: string;
  hasDetails: boolean;
  hasPdf: boolean;
  isDownloadable: boolean;
  canPay: boolean;
  canActivate: boolean;
  invoiceTypeCode: string;
  paymentInstalment: boolean;
  refund: boolean;
  refundInProcess: boolean;
  digitalInvoice: boolean;
  refundRequestCreatedAt: string | null;
  storno: string | null;
}

export interface FetchInvoiceResult {
  invoices: Invoice[];
  count: number;
}

/**
 * Pay Invoice Job
 */
export interface PayInvoiceJobData extends BaseJobData {
  type: 'pay-invoice';
  invoiceNumber: string;
  amount: number;
}

export interface PayInvoiceResult {
  success: boolean;
  transactionId?: string;
  invoiceNumber: string;
  amount: number;
  paidAt: string;
  message?: string;
}

/**
 * Reject Invoice Job
 */
export interface RejectInvoiceJobData extends BaseJobData {
  type: 'reject-invoice';
  invoiceNumber: string;
  reason: string;
}

export interface RejectInvoiceResult {
  success: boolean;
  invoiceNumber: string;
  rejectedAt: string;
  reason: string;
  message?: string;
}

/**
 * Union type for all job data
 */
export type AnyJobData =
  | FetchAccountDataJobData
  | FetchInvoiceJobData
  | PayInvoiceJobData
  | RejectInvoiceJobData;

/**
 * Union type for all job results
 */
export type AnyJobResult =
  | FetchAccountDataResult
  | FetchInvoiceResult
  | PayInvoiceResult
  | RejectInvoiceResult;

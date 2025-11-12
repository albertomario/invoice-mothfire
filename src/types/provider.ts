import {
  FetchAccountDataResult,
  FetchInvoiceResult,
  PayInvoiceResult,
  RejectInvoiceResult,
} from './jobs';

/**
 * Provider interface that all providers must implement
 */
export interface IProvider {
  /**
   * Authenticate and get access token
   */
  authenticate(): Promise<string>;

  /**
   * Fetch account balance and details
   */
  fetchAccountData(accountContract: string): Promise<FetchAccountDataResult>;

  /**
   * Fetch invoices with optional status filter
   */
  fetchInvoices(
    accountContract: string,
    status?: 'unpaid' | 'paid' | 'all'
  ): Promise<FetchInvoiceResult>;

  /**
   * Pay an invoice
   */
  payInvoice(
    accountContract: string,
    invoiceNumber: string,
    amount: number
  ): Promise<PayInvoiceResult>;

  /**
   * Reject an invoice (dispute or contest)
   */
  rejectInvoice(
    accountContract: string,
    invoiceNumber: string,
    reason: string
  ): Promise<RejectInvoiceResult>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiBaseUrl: string;
  apiKey: string;
  username: string;
  password: string;
}

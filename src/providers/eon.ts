import {
  FetchAccountDataResult,
  FetchInvoiceResult,
  Invoice,
  PayInvoiceResult,
  RejectInvoiceResult,
} from '../types/jobs';
import { IProvider, ProviderConfig } from '../types/provider';

interface EONAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  uuid: string;
  legacyId: string;
  scope: string;
}

interface EONAccountBalanceResponse {
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

export class EONProvider implements IProvider {
  private config: ProviderConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Authenticate with EON API and get access token
   */
  async authenticate(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/users/v1/userauth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
          'User-Agent': 'Mozilla/5.0 (compatible; InvoiceNotifier/1.0)',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          rememberMe: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Authentication failed: ${response.status} ${response.statusText}`
      );
    }

    const data: EONAuthResponse = await response.json();
    this.accessToken = data.accessToken;
    // Set expiration to 90% of actual expiration time for safety margin
    this.tokenExpiresAt = Date.now() + data.expiresIn * 900;

    return this.accessToken;
  }

  /**
   * Fetch account balance and details
   */
  async fetchAccountData(
    accountContract: string
  ): Promise<FetchAccountDataResult> {
    const token = await this.authenticate();

    const response = await fetch(
      `${this.config.apiBaseUrl}/invoices/v1/invoices/invoice-balance?accountContract=${accountContract}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (compatible; InvoiceNotifier/1.0)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch account data: ${response.status} ${response.statusText}`
      );
    }

    const data: EONAccountBalanceResponse = await response.json();
    return data;
  }

  /**
   * Fetch invoices with optional status filter
   */
  async fetchInvoices(
    accountContract: string,
    status: 'unpaid' | 'paid' | 'all' = 'unpaid'
  ): Promise<FetchInvoiceResult> {
    const token = await this.authenticate();

    const url = new URL(
      `${this.config.apiBaseUrl}/invoices/v1/invoices/list`
    );
    url.searchParams.append('accountContract', accountContract);
    if (status !== 'all') {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Ocp-Apim-Subscription-Key': this.config.apiKey,
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (compatible; InvoiceNotifier/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch invoices: ${response.status} ${response.statusText}`
      );
    }

    const invoices: Invoice[] = await response.json();
    return {
      invoices,
      count: invoices.length,
    };
  }

  /**
   * Pay an invoice
   * Note: This is a placeholder implementation as the API spec doesn't include payment endpoint
   */
  async payInvoice(
    accountContract: string,
    invoiceNumber: string,
    amount: number
  ): Promise<PayInvoiceResult> {
    const token = await this.authenticate();

    // TODO: Implement actual payment endpoint when API spec is available
    // This is a placeholder implementation
    throw new Error(
      'Payment functionality not yet implemented in EON API specification'
    );

    // Placeholder return structure for when endpoint is available:
    // return {
    //   success: true,
    //   transactionId: 'TXN-123456',
    //   invoiceNumber,
    //   amount,
    //   paidAt: new Date().toISOString(),
    // };
  }

  /**
   * Reject an invoice (dispute or contest)
   * Note: This is a placeholder implementation as the API spec doesn't include reject endpoint
   */
  async rejectInvoice(
    accountContract: string,
    invoiceNumber: string,
    reason: string
  ): Promise<RejectInvoiceResult> {
    const token = await this.authenticate();

    // TODO: Implement actual rejection endpoint when API spec is available
    // This is a placeholder implementation
    throw new Error(
      'Invoice rejection functionality not yet implemented in EON API specification'
    );

    // Placeholder return structure for when endpoint is available:
    // return {
    //   success: true,
    //   invoiceNumber,
    //   rejectedAt: new Date().toISOString(),
    //   reason,
    // };
  }
}

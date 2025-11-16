import {
  FetchAccountDataResult,
  FetchInvoiceResult,
  Invoice,
  PayInvoiceResult,
  RejectInvoiceResult,
} from '../types/jobs';
import { IProvider, ProviderConfig } from '../types/provider';

interface NovaApaServAuthResponse {
  Code: number;
  Message: string;
}

interface NovaApaServInvoice {
  Achitat: number;
  AdrWeb: string | null;
  CanDownload: boolean;
  CodAbonat: number;
  Data: string; // Date string in format "/Date(timestamp+timezone)/"
  DataAsString: string;
  DataFact: string;
  DataFactAsString: string;
  Email: string;
  Fact: number;
  NrFact: number;
  Numar: number;
  Restplata: number;
  Total_factura: number;
}

export class NovaApaServProvider implements IProvider {
  private config: ProviderConfig;
  private sessionCookie: string | null = null;
  private sessionExpiresAt: number = 0;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Parse ASP.NET Date format: /Date(1762898400000+0200)/
   */
  private parseAspNetDate(dateString: string): Date {
    const match = dateString.match(/\/Date\((\d+)([+-]\d{4})\)\//);
    if (!match) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    const timestamp = parseInt(match[1], 10);
    return new Date(timestamp);
  }

  /**
   * Authenticate with Nova Apa Serv API and get session cookie
   */
  async authenticate(): Promise<string> {
    // Return cached session if still valid (sessions typically last 20 minutes)
    if (this.sessionCookie && Date.now() < this.sessionExpiresAt) {
      return this.sessionCookie;
    }

    const response = await fetch(
      `${this.config.apiBaseUrl}/AuthService.svc/Authentificate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          Origin: this.config.apiBaseUrl,
          Referer: `${this.config.apiBaseUrl}/pages/contulmeu.html`,
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          tipClient: 0,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Authentication failed: ${response.status} ${response.statusText}`
      );
    }

    const data: NovaApaServAuthResponse = await response.json();

    if (data.Code !== 0) {
      throw new Error(`Authentication failed: ${data.Message}`);
    }

    // Extract session cookie from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('No session cookie received from authentication');
    }

    // Extract ASP.NET_SessionId from Set-Cookie header
    const sessionMatch = setCookie.match(/ASP\.NET_SessionId=([^;]+)/);
    if (!sessionMatch) {
      throw new Error('Could not extract session ID from cookie');
    }

    this.sessionCookie = sessionMatch[1];
    // Set expiration to 15 minutes (900000ms) for safety
    this.sessionExpiresAt = Date.now() + 900000;

    return this.sessionCookie;
  }

  /**
   * Fetch account balance and details
   * Note: Nova Apa Serv doesn't have a specific balance endpoint,
   * so we'll calculate it from unpaid invoices
   */
  async fetchAccountData(
    accountContract: string
  ): Promise<FetchAccountDataResult> {
    // Fetch unpaid invoices to calculate balance
    const sessionId = await this.authenticate();
    const timestamp = Date.now();
    const endpoint = `${this.config.apiBaseUrl}/AuthService.svc/GetFacturiNeachitate?tipAbonat=0&codAbonat=${accountContract}&_=${timestamp}`;

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: `ASP.NET_SessionId=${sessionId}`,
        Referer: `${this.config.apiBaseUrl}/pages/contulmeu.html`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch account data: ${response.status} ${response.statusText}`
      );
    }

    const data: NovaApaServInvoice[] = await response.json();
    
    const balance = data.reduce((sum, inv) => sum + inv.Restplata, 0);

    return {
      balance,
      refund: false,
      date: new Date().toISOString(),
      refundInProcess: false,
      refundRequestCreatedAt: null,
      hasGuarantee: false,
      hasUnpaidGuarantee: false,
      balancePay: balance > 0,
      refundDocumentsRequired: false,
      isAssociation: false,
    };
  }

  /**
   * Fetch invoices with optional status filter
   */
  async fetchInvoices(
    accountContract: string,
    status: 'unpaid' | 'paid' | 'all' = 'unpaid'
  ): Promise<FetchInvoiceResult> {
    const sessionId = await this.authenticate();
    const timestamp = Date.now();

    let endpoint: string;
    if (status === 'paid') {
      endpoint = `${this.config.apiBaseUrl}/AuthService.svc/GetFacturiAchitate?tipAbonat=0&codAbonat=${accountContract}&_=${timestamp}`;
    } else if (status === 'unpaid') {
      endpoint = `${this.config.apiBaseUrl}/AuthService.svc/GetFacturiNeachitate?tipAbonat=0&codAbonat=${accountContract}&_=${timestamp}`;
    } else {
      // For 'all', we need to fetch both paid and unpaid
      const [paidResult, unpaidResult] = await Promise.all([
        this.fetchInvoices(accountContract, 'paid'),
        this.fetchInvoices(accountContract, 'unpaid'),
      ]);
      return {
        invoices: [...unpaidResult.invoices, ...paidResult.invoices],
        count: unpaidResult.count + paidResult.count,
      };
    }

    const response = await fetch(endpoint, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: `ASP.NET_SessionId=${sessionId}`,
        Referer: `${this.config.apiBaseUrl}/pages/contulmeu.html`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch invoices: ${response.status} ${response.statusText}`
      );
    }

    const data: NovaApaServInvoice[] = await response.json();

    const invoices: Invoice[] = data.map((inv) => ({
      fiscalNumber: inv.NrFact.toString(),
      maturityDate: this.parseAspNetDate(inv.Data).toISOString(),
      emissionDate: this.parseAspNetDate(inv.DataFact).toISOString(),
      disconnectionDate: null,
      printDate: inv.DataAsString,
      archiveDate: null,
      issuedValue: inv.Total_factura,
      balanceValue: inv.Restplata,
      invoiceNumber: inv.NrFact.toString(),
      state: inv.Restplata > 0 ? 'unpaid' : 'paid',
      type: 'water',
      sector: 'utilities',
      cb: accountContract,
      companyCode: 'NOVA_APA_SERV',
      electronic: true,
      accountContract,
      hasDetails: true,
      hasPdf: inv.CanDownload,
      isDownloadable: inv.CanDownload,
      canPay: inv.Restplata > 0,
      canActivate: false,
      invoiceTypeCode: 'WATER',
      paymentInstalment: false,
      refund: false,
      refundInProcess: false,
      digitalInvoice: true,
      refundRequestCreatedAt: null,
      storno: null,
    }));

    return {
      invoices,
      count: invoices.length,
    };
  }

  /**
   * Pay an invoice
   * Note: Nova Apa Serv doesn't provide a payment API endpoint
   */
  async payInvoice(
    accountContract: string,
    invoiceNumber: string,
    amount: number
  ): Promise<PayInvoiceResult> {
    throw new Error(
      'Payment functionality not available through API. Nova Apa Serv does not provide a payment API endpoint.'
    );
  }

  /**
   * Reject an invoice
   * Note: Nova Apa Serv doesn't provide an invoice rejection/dispute API
   */
  async rejectInvoice(
    accountContract: string,
    invoiceNumber: string,
    reason: string
  ): Promise<RejectInvoiceResult> {
    throw new Error(
      'Rejection functionality not available through API. Nova Apa Serv does not provide an invoice rejection/dispute API endpoint.'
    );
  }
}

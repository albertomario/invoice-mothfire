# Job Types Reference

## Quick Reference for ACTION-ENTITY Pattern

### Job Types Overview

| Job Type | Action | Entity | Purpose |
|----------|--------|--------|---------|
| `fetch-account-data` | FETCH | ACCOUNT_DATA | Get account balance and details |
| `fetch-invoice` | FETCH | INVOICE | List invoices with optional status filter |
| `pay-invoice` | PAY | INVOICE | Process payment for an invoice |
| `reject-invoice` | REJECT | INVOICE | Dispute or reject an invoice |

## Job Data Structures

### 1. fetch-account-data

**Purpose**: Retrieve account balance and metadata

**Request Fields**:
```typescript
{
  type: "fetch-account-data",
  provider: string,              // e.g., "eon"
  accountContract: string        // Contract number
}
```

**Response**:
```typescript
{
  balance: number,
  refund: boolean,
  date: string,
  refundInProcess: boolean,
  refundRequestCreatedAt: string | null,
  hasGuarantee: boolean,
  hasUnpaidGuarantee: boolean,
  balancePay: boolean,
  refundDocumentsRequired: boolean,
  isAssociation: boolean
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-account-data","provider":"eon","accountContract":"002202348574"}'
```

---

### 2. fetch-invoice

**Purpose**: List invoices with optional status filtering

**Request Fields**:
```typescript
{
  type: "fetch-invoice",
  provider: string,              // e.g., "eon"
  accountContract: string,       // Contract number
  status?: "unpaid" | "paid" | "all"  // Optional, defaults to "unpaid"
}
```

**Response**:
```typescript
{
  invoices: Invoice[],           // Array of invoice objects
  count: number                  // Total number of invoices
}
```

**Invoice Object**:
```typescript
{
  fiscalNumber: string,
  maturityDate: string,
  emissionDate: string,
  issuedValue: number,
  balanceValue: number,
  invoiceNumber: string,
  state: string,
  canPay: boolean,
  // ... additional fields
}
```

**Examples**:
```bash
# Fetch unpaid invoices (default)
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-invoice","provider":"eon","accountContract":"002202348574"}'

# Fetch paid invoices
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-invoice","provider":"eon","accountContract":"002202348574","status":"paid"}'

# Fetch all invoices
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-invoice","provider":"eon","accountContract":"002202348574","status":"all"}'
```

---

### 3. pay-invoice

**Purpose**: Process payment for a specific invoice

**Request Fields**:
```typescript
{
  type: "pay-invoice",
  provider: string,              // e.g., "eon"
  accountContract: string,       // Contract number
  invoiceNumber: string,         // Invoice to pay (required)
  amount: number                 // Payment amount (required)
}
```

**Response**:
```typescript
{
  success: boolean,
  transactionId?: string,        // Transaction reference
  invoiceNumber: string,
  amount: number,
  paidAt: string,                // ISO timestamp
  message?: string               // Additional info or error message
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type":"pay-invoice",
    "provider":"eon",
    "accountContract":"002202348574",
    "invoiceNumber":"011895623139",
    "amount":317.79
  }'
```

**Note**: Payment functionality is currently a placeholder - EON API spec doesn't include payment endpoint yet.

---

### 4. reject-invoice

**Purpose**: Dispute or reject an invoice

**Request Fields**:
```typescript
{
  type: "reject-invoice",
  provider: string,              // e.g., "eon"
  accountContract: string,       // Contract number
  invoiceNumber: string,         // Invoice to reject (required)
  reason: string                 // Rejection reason (required)
}
```

**Response**:
```typescript
{
  success: boolean,
  invoiceNumber: string,
  rejectedAt: string,            // ISO timestamp
  reason: string,
  message?: string               // Additional info or error message
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type":"reject-invoice",
    "provider":"eon",
    "accountContract":"002202348574",
    "invoiceNumber":"011895623139",
    "reason":"Incorrect meter reading"
  }'
```

**Note**: Rejection functionality is currently a placeholder - EON API spec doesn't include rejection endpoint yet.

---

## Validation Rules

### All Jobs
- `type`: Required, must be one of the four job types
- `provider`: Required, string (currently "eon")
- `accountContract`: Required, string

### pay-invoice
- `invoiceNumber`: Required
- `amount`: Required, must be a positive number

### reject-invoice
- `invoiceNumber`: Required
- `reason`: Required, non-empty string

### fetch-invoice
- `status`: Optional, must be "unpaid", "paid", or "all" if provided

## API Response Format

### Success Response
```json
{
  "ok": true,
  "jobId": "12345",
  "jobName": "fetch-account-data-1699876543210",
  "jobType": "fetch-account-data"
}
```

### Error Response
```json
{
  "error": "pay-invoice requires invoiceNumber and amount"
}
```

## Provider Support

### EON (eon)
- ✅ fetch-account-data: Fully implemented
- ✅ fetch-invoice: Fully implemented
- ⚠️ pay-invoice: API endpoint not documented (placeholder)
- ⚠️ reject-invoice: API endpoint not documented (placeholder)

## Job Progress Tracking

All jobs report progress through Bull Board:
- 10%: Job started, validating inputs
- 30%: Provider initialized
- 90%: Operation completed, preparing results
- 100%: Job finished

View progress at: `http://localhost:3000`

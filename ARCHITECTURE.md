# Invoice Notifier - Architecture Documentation

## Overview

This is a BullMQ-based queue worker system for managing invoice operations across multiple utility providers. The architecture follows an **ACTION-ENTITY** pattern where jobs are structured as `{action}-{entity}`.

## Architecture Pattern: ACTION-ENTITY

### Job Types

All jobs follow the pattern: `{action}-{entity}`

| Job Type | Description | Required Fields |
|----------|-------------|-----------------|
| `fetch-account-data` | Retrieve account balance and details | `provider`, `accountContract` |
| `fetch-invoice` | Retrieve invoices with optional status filter | `provider`, `accountContract`, `status?` |
| `pay-invoice` | Process invoice payment | `provider`, `accountContract`, `invoiceNumber`, `amount` |
| `reject-invoice` | Reject/dispute an invoice | `provider`, `accountContract`, `invoiceNumber`, `reason` |

### Directory Structure

```
src/
├── index.ts                    # Fastify server with Bull Board UI and API endpoints
├── queue.ts                    # Queue creation and worker setup
├── env.ts                      # Environment configuration with envsafe
├── types/
│   ├── jobs.ts                # Job data types and result interfaces
│   └── provider.ts            # Provider interface and configuration
├── providers/
│   ├── index.ts               # Provider factory for creating provider instances
│   └── eon.ts                 # EON provider implementation
└── processors/
    ├── index.ts               # Main job router
    ├── fetch-account-data.ts  # Account data fetching processor
    ├── fetch-invoice.ts       # Invoice fetching processor
    ├── pay-invoice.ts         # Payment processing processor
    └── reject-invoice.ts      # Invoice rejection processor
```

## Components

### 1. Type System (`src/types/`)

**jobs.ts**: Defines all job data structures and result types
- `JobAction` enum: FETCH, PAY, REJECT
- `JobEntity` enum: ACCOUNT_DATA, INVOICE
- Job data interfaces for each job type
- Result interfaces for each operation

**provider.ts**: Defines the provider contract
- `IProvider` interface that all providers must implement
- `ProviderConfig` for provider initialization

### 2. Providers (`src/providers/`)

Providers implement the `IProvider` interface and handle API communication with external services.

**EONProvider** (`eon.ts`):
- Authentication with token caching
- Account balance retrieval
- Invoice listing with status filters
- Payment processing (placeholder)
- Invoice rejection (placeholder)

**ProviderFactory** (`index.ts`):
- Singleton pattern for provider instances
- Lazy initialization with caching
- Easy addition of new providers

### 3. Processors (`src/processors/`)

Each processor handles a specific job type:

- **processFetchAccountData**: Fetches account balance
- **processFetchInvoice**: Retrieves invoices
- **processPayInvoice**: Processes payments
- **processRejectInvoice**: Handles invoice disputes

All processors:
- Log progress at key milestones
- Update job progress (0-100%)
- Return structured results
- Handle errors gracefully

### 4. Queue Management (`src/queue.ts`)

- Single queue for all job types: `InvoiceNotifierQueue`
- Worker routes jobs to appropriate processors based on job type
- Uses BullMQ v5 with Redis backend

### 5. API & UI (`src/index.ts`)

**Endpoints**:
- `POST /add-job`: Submit jobs to the queue
- `/`: Bull Board UI for queue monitoring

**Features**:
- JSON body validation with Fastify schemas
- Job-specific validation (e.g., pay-invoice requires invoiceNumber and amount)
- Returns job ID and metadata

## Adding a New Provider

1. **Create provider class** in `src/providers/{name}.ts`:
```typescript
import { IProvider } from '../types/provider';

export class MyProvider implements IProvider {
  async authenticate(): Promise<string> { /* ... */ }
  async fetchAccountData(accountContract: string) { /* ... */ }
  async fetchInvoices(accountContract: string, status?: string) { /* ... */ }
  async payInvoice(accountContract: string, invoiceNumber: string, amount: number) { /* ... */ }
  async rejectInvoice(accountContract: string, invoiceNumber: string, reason: string) { /* ... */ }
}
```

2. **Register in ProviderFactory** (`src/providers/index.ts`):
```typescript
case 'myprovider':
  provider = new MyProvider({
    apiBaseUrl: env.MYPROVIDER_API_BASE_URL,
    apiKey: env.MYPROVIDER_API_KEY,
    username: env.MYPROVIDER_USERNAME,
    password: env.MYPROVIDER_PASSWORD,
  });
  break;
```

3. **Add environment variables** (`src/env.ts`):
```typescript
MYPROVIDER_API_BASE_URL: url(),
MYPROVIDER_API_KEY: str(),
MYPROVIDER_USERNAME: str(),
MYPROVIDER_PASSWORD: str(),
```

## Usage Examples

### Fetch Account Data
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fetch-account-data",
    "provider": "eon",
    "accountContract": "002202348574"
  }'
```

### Fetch Unpaid Invoices
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fetch-invoice",
    "provider": "eon",
    "accountContract": "002202348574",
    "status": "unpaid"
  }'
```

### Pay Invoice
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pay-invoice",
    "provider": "eon",
    "accountContract": "002202348574",
    "invoiceNumber": "011895623139",
    "amount": 317.79
  }'
```

### Reject Invoice
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reject-invoice",
    "provider": "eon",
    "accountContract": "002202348574",
    "invoiceNumber": "011895623139",
    "reason": "Incorrect billing"
  }'
```

## Environment Variables

Required environment variables:

```bash
# Redis Configuration
REDISHOST=localhost
REDISPORT=6379
REDISUSER=default
REDISPASSWORD=your-password

# Server Configuration
PORT=3000
RAILWAY_STATIC_URL=http://localhost:3000

# EON Provider Configuration
EON_API_BASE_URL=https://api2.eon.ro
EON_API_KEY=674e9032df9d456fa371e17a4097a5b8
EON_USERNAME=your-username
EON_PASSWORD=your-password
```

## Job Flow

1. **Job Submission**: Client sends POST request to `/add-job`
2. **Validation**: Fastify validates request body and job-specific requirements
3. **Queue Addition**: Job is added to `InvoiceNotifierQueue` with unique name
4. **Worker Processing**: Worker picks up job and routes to appropriate processor
5. **Provider Action**: Processor uses ProviderFactory to get provider instance
6. **API Call**: Provider makes authenticated API call to external service
7. **Result Return**: Processor returns structured result data
8. **Job Completion**: BullMQ marks job as completed with result data

## Monitoring

Access Bull Board UI at `http://localhost:3000` to:
- View all jobs (completed, active, failed)
- See job logs and progress
- Retry failed jobs
- View job results

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development (with .env file)
npm run dev

# Run in production
npm start

# Type check
npm run lint

# Watch mode
npm run watch
```

## Design Decisions

1. **Single Queue**: All job types use one queue for simpler management
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Provider Pattern**: Easy to add new utility providers
4. **Progress Tracking**: All processors report progress for better UX
5. **Error Handling**: Comprehensive error logging and propagation
6. **Token Caching**: Authentication tokens cached to reduce API calls
7. **Validation**: Both schema validation (Fastify) and business logic validation

# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client/API Consumer                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ POST /add-job
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Fastify Server (index.ts)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Schema Validation + Business Logic Validation           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Add job
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    InvoiceNotifierQueue (BullMQ)                 │
│                          Redis Backend                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Worker picks job
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Job Router (processors/index.ts)               │
│                                                                  │
│   ┌──────────────────────┬──────────────┬──────────────────┐    │
│   │  Based on job.type   │              │                  │    │
│   └──────────────────────┘              │                  │    │
└────────────┬────────────────────┬────────┴────────┬─────────────┘
             │                    │                 │
             │                    │                 │
    ┌────────▼──────┐   ┌────────▼──────┐  ┌───────▼────────┐
    │fetch-account  │   │fetch-invoice  │  │  pay-invoice   │
    │   -data       │   │               │  │  reject-invoice│
    │  processor    │   │  processor    │  │  processors    │
    └────────┬──────┘   └────────┬──────┘  └───────┬────────┘
             │                    │                 │
             └────────────┬───────┴─────────────────┘
                          │
                          │ Get provider instance
                          ▼
             ┌────────────────────────────┐
             │  Provider Factory          │
             │  (providers/index.ts)      │
             │                            │
             │  Singleton pattern         │
             │  Lazy initialization       │
             └────────────┬───────────────┘
                          │
                          │ Return cached or new instance
                          ▼
             ┌────────────────────────────┐
             │  Provider Implementation   │
             │  (e.g., EONProvider)       │
             │                            │
             │  • authenticate()          │
             │  • fetchAccountData()      │
             │  • fetchInvoices()         │
             │  • payInvoice()            │
             │  • rejectInvoice()         │
             └────────────┬───────────────┘
                          │
                          │ HTTP API Calls
                          ▼
             ┌────────────────────────────┐
             │  External Provider API     │
             │  (e.g., api2.eon.ro)       │
             └────────────────────────────┘
```

## ACTION-ENTITY Pattern Flow

```
Job Type Format: {ACTION}-{ENTITY}
                 
Actions:         Entities:
┌─────────┐      ┌──────────────┐
│ FETCH   │──┬──→│ ACCOUNT-DATA │ = fetch-account-data
│ PAY     │  │   │ INVOICE      │ = fetch-invoice
│ REJECT  │  └──→│              │ = pay-invoice
└─────────┘                      = reject-invoice
```

## Data Flow Example: fetch-invoice

```
1. Client Request
   ↓
   POST /add-job
   {
     "type": "fetch-invoice",
     "provider": "eon",
     "accountContract": "002202348574",
     "status": "unpaid"
   }

2. Validation
   ↓
   ✓ Schema valid
   ✓ Required fields present
   ✓ Job-specific validation

3. Queue
   ↓
   Job ID: 12345
   Progress: 0%

4. Worker
   ↓
   Router → processFetchInvoice()
   Progress: 10%

5. Provider
   ↓
   ProviderFactory.getProvider("eon")
   Progress: 30%

6. Authentication
   ↓
   EONProvider.authenticate()
   Token: "abc123..." (cached)

7. API Call
   ↓
   GET https://api2.eon.ro/invoices/v1/invoices/list
   ?accountContract=002202348574&status=unpaid
   Progress: 90%

8. Result
   ↓
   {
     "invoices": [...],
     "count": 2
   }
   Progress: 100%

9. Response to Client
   ↓
   {
     "ok": true,
     "jobId": "12345",
     "jobName": "fetch-invoice-1699876543210",
     "jobType": "fetch-invoice"
   }
```

## Component Dependencies

```
index.ts
  ├── queue.ts
  │     └── processors/index.ts
  │           ├── processors/fetch-account-data.ts
  │           ├── processors/fetch-invoice.ts
  │           ├── processors/pay-invoice.ts
  │           └── processors/reject-invoice.ts
  │                 └── providers/index.ts (ProviderFactory)
  │                       └── providers/eon.ts (EONProvider)
  │                             └── types/provider.ts (IProvider)
  └── env.ts

types/jobs.ts (imported by all processors)
types/provider.ts (imported by all providers)
```

## State Machine: Job Lifecycle

```
┌─────────┐
│ Waiting │ ──────────────────┐
└─────────┘                   │
     │                        │
     │ Worker available       │
     ▼                        │
┌─────────┐                   │
│ Active  │ ──────────────┐   │
└─────────┘               │   │
     │                    │   │
     │ Processing         │   │
     ▼                    │   │
┌─────────┐               │   │
│Progress │               │   │
│ 0→100%  │               │   │
└─────────┘               │   │
     │                    │   │
     │ Success      Error │   │ Max retries
     ▼                    ▼   ▼
┌──────────┐         ┌─────────┐
│Completed │         │ Failed  │
└──────────┘         └─────────┘
                          │
                          │ Manual retry
                          └────────────────┘
```

## Provider Extension Pattern

```
New Provider Implementation:

1. Create Provider Class
   src/providers/new-provider.ts
   ↓
   implements IProvider interface

2. Register in Factory
   src/providers/index.ts
   ↓
   case 'newprovider': return new NewProvider(...)

3. Add Environment Variables
   src/env.ts
   ↓
   NEWPROVIDER_API_BASE_URL: url()
   NEWPROVIDER_API_KEY: str()
   ...

4. Ready to Use!
   ↓
   {"type":"fetch-invoice","provider":"newprovider",...}

No changes needed to:
- Job processors
- Job types
- Queue management
- API endpoints
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         Application Layer           │
│  TypeScript 5.9 (Strict Mode)       │
└─────────────────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│         Web Framework               │
│      Fastify 5.6                    │
│  • Fast routing                     │
│  • Schema validation                │
│  • Plugin system                    │
└─────────────────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│        Queue System                 │
│       BullMQ 5.63                   │
│  • Job processing                   │
│  • Progress tracking                │
│  • Retry logic                      │
└─────────────────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│        Data Store                   │
│         Redis                       │
│  • Job storage                      │
│  • Queue management                 │
└─────────────────────────────────────┘

Additional:
• Bull Board 6.14 (Queue UI)
• envsafe 2.0 (Config validation)
• Native Fetch API (HTTP requests)
```

## Monitoring Dashboard (Bull Board)

```
http://localhost:3000

┌────────────────────────────────────────┐
│  Bull Board - InvoiceNotifierQueue     │
├────────────────────────────────────────┤
│                                        │
│  Jobs:  Waiting: 3  Active: 1          │
│         Completed: 145  Failed: 2      │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ fetch-invoice-1699876543210      │  │
│  │ Progress: ████████████░░ 80%     │  │
│  │ Status: Active                   │  │
│  │ Logs:                            │  │
│  │   - Fetching unpaid invoices     │  │
│  │   - Provider eon initialized     │  │
│  │                                  │  │
│  │ [View Details] [Logs] [Retry]   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Completed] [Failed] [Waiting]        │
└────────────────────────────────────────┘
```

# Nova Apa Serv Provider

## Overview
Nova Apa Serv (Apabotosani.ro) water and sewage services provider implementation for Botosani, Romania.

## Supported Operations

### ✅ Fetch Account Data
Retrieves account balance by fetching unpaid invoices and calculating the total remaining balance.

**Example:**
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "fetch-account-data",
    "provider": "nova-apa-serv",
    "accountContract": "27800"
  }'
```

### ✅ Fetch Invoices
Retrieves paid or unpaid invoices from the Nova Apa Serv API.

**Fetch unpaid invoices:**
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "fetch-invoice",
    "provider": "nova-apa-serv",
    "accountContract": "27800",
    "status": "unpaid"
  }'
```

**Fetch paid invoices:**
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "fetch-invoice",
    "provider": "nova-apa-serv",
    "accountContract": "27800",
    "status": "paid"
  }'
```

### ❌ Pay Invoice
**Not supported** - Nova Apa Serv API does not provide a payment endpoint.

### ❌ Reject Invoice
**Not supported** - Nova Apa Serv API does not provide an invoice rejection/dispute endpoint.

## Authentication

Nova Apa Serv uses session-based authentication with ASP.NET session cookies.

**Environment Variables:**
```env
NOVA_APA_SERV_API_BASE_URL=https://www.apabotosani.ro
NOVA_APA_SERV_USERNAME=your-email@example.com
NOVA_APA_SERV_PASSWORD=your-password
```

**Authentication Flow:**
1. POST to `/AuthService.svc/Authentificate` with username/password
2. Extract `ASP.NET_SessionId` cookie from response
3. Use cookie for subsequent requests
4. Sessions expire after ~15-20 minutes

## API Endpoints

### Authentication
- **URL:** `https://www.apabotosani.ro/AuthService.svc/Authentificate`
- **Method:** POST
- **Body:** `{"username":"email","password":"pass","tipClient":0}`
- **Response:** `{"Code":0,"Message":"login success"}`

### Get Unpaid Invoices
- **URL:** `https://www.apabotosani.ro/AuthService.svc/GetFacturiNeachitate`
- **Method:** GET
- **Params:** `tipAbonat=0&codAbonat={accountContract}&_={timestamp}`
- **Headers:** `Cookie: ASP.NET_SessionId={sessionId}`

### Get Paid Invoices
- **URL:** `https://www.apabotosani.ro/AuthService.svc/GetFacturiAchitate`
- **Method:** GET
- **Params:** `tipAbonat=0&codAbonat={accountContract}&_={timestamp}`
- **Headers:** `Cookie: ASP.NET_SessionId={sessionId}`

## Data Mapping

Nova Apa Serv returns invoice data in a custom format that is mapped to the standard Invoice type:

| Nova Apa Serv Field | Standard Field | Description |
|---------------------|----------------|-------------|
| `NrFact` | `invoiceNumber` | Invoice number |
| `Total_factura` | `issuedValue` | Total invoice amount |
| `Restplata` | `balanceValue` | Remaining balance |
| `Data` | `maturityDate` | Payment due date |
| `DataFact` | `emissionDate` | Invoice issue date |
| `CanDownload` | `isDownloadable` | Whether invoice PDF is available |

## Date Format

Nova Apa Serv uses ASP.NET JSON date format: `/Date(timestamp+timezone)/`

Example: `/Date(1762898400000+0200)/` = November 12, 2025

## Notes

- The `tipClient` parameter is always `0` (residential customer)
- Account contract numbers are typically 5-6 digits (e.g., `27800`)
- All amounts are in RON (Romanian Leu)
- Invoice PDFs may be downloadable through a separate endpoint (not yet implemented)
- Session cookies are cached and reused until expiration to reduce authentication calls

## Implementation Details

**File:** `src/providers/nova-apa-serv.ts`

**Key Features:**
- Session cookie caching with automatic expiration
- ASP.NET date parsing
- Parallel fetching for 'all' status (both paid and unpaid)
- Standard Invoice type mapping
- Error handling for unsupported operations

## Testing

Test the provider with a valid account contract:

```bash
# Get providers list (verify nova-apa-serv is available)
curl http://localhost:3000/providers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Fetch account balance
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "fetch-account-data",
    "provider": "nova-apa-serv",
    "accountContract": "27800"
  }'

# Check job status
curl http://localhost:3000/job/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

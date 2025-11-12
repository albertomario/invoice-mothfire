# Testing Guide

## Quick Start Testing

### 1. Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your credentials
nano .env
```

Required values in `.env`:
```bash
REDISHOST=localhost
REDISPORT=6379
REDISUSER=default
REDISPASSWORD=your-redis-password
PORT=3000
RAILWAY_STATIC_URL=http://localhost:3000
EON_API_BASE_URL=https://api2.eon.ro
EON_API_KEY=674e9032df9d456fa371e17a4097a5b8
EON_USERNAME=your-email@example.com
EON_PASSWORD=your-password
```

### 2. Build and Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

Expected output:
```
Server running on http://0.0.0.0:3000
Bull Board UI: http://0.0.0.0:3000

Example API calls:
...
```

### 3. Verify Server is Running

```bash
# Open Bull Board UI in browser
open http://localhost:3000
```

You should see the Bull Board dashboard with "InvoiceNotifierQueue".

## Test Each Job Type

### Test 1: fetch-account-data ✅

**Purpose**: Verify account balance retrieval works

```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fetch-account-data",
    "provider": "eon",
    "accountContract": "002202348574"
  }'
```

**Expected Response**:
```json
{
  "ok": true,
  "jobId": "1",
  "jobName": "fetch-account-data-1699876543210",
  "jobType": "fetch-account-data"
}
```

**Verify in Bull Board**:
1. Go to http://localhost:3000
2. Click on the job
3. Check logs show:
   - "Starting fetch-account-data for contract: 002202348574"
   - "Provider eon initialized"
   - "Fetching account balance from eon"
   - "Account data fetched successfully. Balance: XXX"
4. Check progress: 100%
5. Check result data contains balance, refund, date, etc.

---

### Test 2: fetch-invoice (unpaid) ✅

**Purpose**: Verify unpaid invoice listing works

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

**Expected Response**:
```json
{
  "ok": true,
  "jobId": "2",
  "jobName": "fetch-invoice-1699876543211",
  "jobType": "fetch-invoice"
}
```

**Verify in Bull Board**:
1. Check logs show invoice fetching
2. Check result contains:
   - `invoices` array with invoice objects
   - `count` with number of invoices
3. Each invoice should have:
   - fiscalNumber
   - maturityDate
   - invoiceNumber
   - balanceValue
   - canPay

---

### Test 3: fetch-invoice (all) ✅

**Purpose**: Verify all invoices can be fetched

```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fetch-invoice",
    "provider": "eon",
    "accountContract": "002202348574",
    "status": "all"
  }'
```

**Verify**: Should return both paid and unpaid invoices

---

### Test 4: pay-invoice ⚠️

**Purpose**: Test payment job submission (placeholder implementation)

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

**Expected**: Job will fail with error message:
```
"Payment functionality not yet implemented in EON API specification"
```

**This is expected** - the EON API spec doesn't include payment endpoint yet.

---

### Test 5: reject-invoice ⚠️

**Purpose**: Test rejection job submission (placeholder implementation)

```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reject-invoice",
    "provider": "eon",
    "accountContract": "002202348574",
    "invoiceNumber": "011895623139",
    "reason": "Incorrect meter reading"
  }'
```

**Expected**: Job will fail with error message:
```
"Invoice rejection functionality not yet implemented in EON API specification"
```

**This is expected** - the EON API spec doesn't include rejection endpoint yet.

## Test Validation

### Test Invalid Job Type

```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "invalid-type",
    "provider": "eon",
    "accountContract": "002202348574"
  }'
```

**Expected**: 400 Bad Request with validation error

---

### Test Missing Required Fields

**Missing invoiceNumber for pay-invoice**:
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pay-invoice",
    "provider": "eon",
    "accountContract": "002202348574"
  }'
```

**Expected Response**:
```json
{
  "error": "pay-invoice requires invoiceNumber and amount"
}
```

---

**Missing reason for reject-invoice**:
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reject-invoice",
    "provider": "eon",
    "accountContract": "002202348574",
    "invoiceNumber": "123"
  }'
```

**Expected Response**:
```json
{
  "error": "reject-invoice requires invoiceNumber and reason"
}
```

## Test Provider Factory

### Test Unknown Provider

```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fetch-account-data",
    "provider": "unknown",
    "accountContract": "002202348574"
  }'
```

**Expected**: Job will fail with error:
```
"Unknown provider: unknown"
```

## Test Authentication

### Test Invalid Credentials

1. Temporarily change `EON_USERNAME` or `EON_PASSWORD` in `.env` to invalid values
2. Restart server
3. Submit a fetch-account-data job

**Expected**: Job will fail with authentication error

### Test Token Caching

1. Submit multiple jobs in quick succession:
```bash
# Submit 3 jobs quickly
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-account-data","provider":"eon","accountContract":"002202348574"}'

curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-invoice","provider":"eon","accountContract":"002202348574"}'

curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-account-data","provider":"eon","accountContract":"002202348574"}'
```

2. Check logs in Bull Board
3. Only the first job should authenticate; others should use cached token

## Bull Board UI Testing

### View Jobs
1. Navigate to http://localhost:3000
2. Verify you can see:
   - Queue statistics (waiting, active, completed, failed)
   - Job list
   - Job details when clicked

### View Job Details
1. Click on any job
2. Verify you can see:
   - Job data (input parameters)
   - Job logs (progress messages)
   - Job result (output data)
   - Progress bar
   - Status (completed/failed/active)

### Retry Failed Job
1. Submit a job that will fail (e.g., pay-invoice)
2. Wait for it to fail
3. Click "Retry" button in Bull Board
4. Verify job is reprocessed

### View Logs
1. Click on any completed job
2. Click "Logs" tab
3. Verify you can see all progress messages

## Performance Testing

### Submit Multiple Jobs

Create a script `test-bulk.sh`:
```bash
#!/bin/bash

for i in {1..10}
do
  curl -X POST http://localhost:3000/add-job \
    -H "Content-Type: application/json" \
    -d '{
      "type": "fetch-account-data",
      "provider": "eon",
      "accountContract": "002202348574"
    }'
  echo "Job $i submitted"
done
```

Run:
```bash
chmod +x test-bulk.sh
./test-bulk.sh
```

Monitor in Bull Board to see jobs being processed.

## Expected Results Summary

| Job Type | Expected Outcome |
|----------|------------------|
| fetch-account-data | ✅ Success - Returns balance data |
| fetch-invoice (unpaid) | ✅ Success - Returns unpaid invoices |
| fetch-invoice (paid) | ✅ Success - Returns paid invoices |
| fetch-invoice (all) | ✅ Success - Returns all invoices |
| pay-invoice | ⚠️ Fails with "not implemented" message |
| reject-invoice | ⚠️ Fails with "not implemented" message |

## Troubleshooting

### Jobs Stay in Waiting State
- Check Redis connection (REDISHOST, REDISPORT, credentials)
- Verify worker is running (check console for worker initialization)

### Authentication Errors
- Verify EON_USERNAME and EON_PASSWORD in .env
- Check EON_API_KEY is correct
- Ensure account credentials are valid

### Jobs Fail Immediately
- Check job logs in Bull Board for error details
- Verify required fields are provided
- Check provider name is correct ("eon")

### Can't Access Bull Board
- Verify server is running on PORT 3000
- Check firewall settings
- Try http://localhost:3000 instead of http://0.0.0.0:3000

## Production Testing Checklist

Before deploying to production:

- [ ] All environment variables set correctly
- [ ] Redis connection working
- [ ] fetch-account-data job succeeds
- [ ] fetch-invoice job succeeds with different status values
- [ ] Invalid job types are rejected
- [ ] Missing required fields are caught
- [ ] Unknown providers are rejected
- [ ] Bull Board UI is accessible
- [ ] Job logs are detailed and helpful
- [ ] Failed jobs can be retried
- [ ] Token caching is working (not re-authenticating every request)

## Automated Testing (Future)

For automated testing, consider adding:
```bash
npm test
```

With test files:
- `src/__tests__/providers/eon.test.ts` - Provider unit tests
- `src/__tests__/processors/*.test.ts` - Processor unit tests
- `src/__tests__/integration/api.test.ts` - API integration tests

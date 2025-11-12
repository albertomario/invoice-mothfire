# Node.js Backend Template

A production-ready Node.js backend template built with:
- **Fastify v5** - Fast and low overhead web framework
- **BullMQ v5** - Redis-backed queue for background job processing
- **Bull Board v6** - Beautiful UI for monitoring jobs and queues
- **TypeScript** - Type-safe development
- **Railway** - One-click deployment with Redis

## Features

- ⚡ **High Performance**: Fastify provides exceptional throughput
- 📊 **Job Dashboard**: Visual monitoring with Bull Board UI
- 🔄 **Background Jobs**: Reliable queue processing with BullMQ
- 🛡️ **Type Safe**: Full TypeScript support with strict typing
- 🚀 **Production Ready**: Built-in error handling and logging
- 📦 **Easy Deployment**: Configured for Railway with Redis service

## Quick Start

### Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

The template automatically provisions:
- Node.js application service
- Redis database service
- Environment variables configuration

### Local Development

1. **Clone and install**:
   ```bash
   git clone <your-repo>
   cd <your-repo>
   npm install
   ```

2. **Configure environment** (create `.env`):
   ```env
   REDISHOST=localhost
   REDISPORT=6379
   REDISUSER=default
   REDISPASSWORD=
   PORT=3000
   RAILWAY_STATIC_URL=http://localhost:3000
   ```

3. **Start Redis** (using Docker):
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

4. **Run the application**:
   ```bash
   npm run build
   npm start
   ```

5. **Access the services**:
   - API: http://localhost:3000
   - Bull Board Dashboard: http://localhost:3000
   - Add test job: `curl http://localhost:3000/add-job?id=1&email=test@example.com`

## Project Structure

```
├── src/
│   ├── index.ts      # Fastify server setup and routes
│   ├── queue.ts      # BullMQ queue and worker configuration
│   └── env.ts        # Environment variable validation
├── dist/             # Compiled JavaScript (generated)
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── railway.toml      # Railway deployment config
```

## API Endpoints

### `GET /`
Bull Board dashboard UI for monitoring queues and jobs

### `GET /add-job`
Add a new job to the queue

**Query Parameters:**
- `id` (required): Job identifier
- `email` (required): Email address for the job

**Example:**
```bash
curl "http://localhost:3000/add-job?id=123&email=user@example.com"
```

**Response:**
```json
{
  "ok": true
}
```

## Extending the Template

### Adding New Queues

1. **Create a new queue** in `src/queue.ts`:
   ```typescript
   export const emailQueue = createQueue('EmailQueue');
   export const invoiceQueue = createQueue('InvoiceQueue');
   ```

2. **Set up processors**:
   ```typescript
   export const setupEmailProcessor = async (queueName: string) => {
     new Worker(queueName, async (job) => {
       // Process email job
       await sendEmail(job.data);
       return { sent: true };
     }, { connection });
   };
   ```

3. **Register in Bull Board** (`src/index.ts`):
   ```typescript
   createBullBoard({
     queues: [
       new BullMQAdapter(emailQueue),
       new BullMQAdapter(invoiceQueue),
     ],
     serverAdapter,
   });
   ```

### Adding New API Routes

Add routes in `src/index.ts` before Bull Board registration:

```typescript
server.post<{ Body: MyBodyType }>(
  '/my-endpoint',
  {
    schema: {
      body: {
        type: 'object',
        required: ['field1'],
        properties: {
          field1: { type: 'string' },
        },
      },
    },
  },
  async (req, reply) => {
    const { field1 } = req.body;
    // Process request
    return { success: true };
  }
);
```

### Adding Database Support

1. **Install database client**:
   ```bash
   npm install @prisma/client
   # or
   npm install pg  # PostgreSQL
   ```

2. **Add to environment validation** (`src/env.ts`):
   ```typescript
   export const env = envsafe({
     // ... existing vars
     DATABASE_URL: str(),
   });
   ```

3. **Initialize in your routes or workers**:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   ```

## Environment Variables

| Variable | Description | Default (Dev) |
|----------|-------------|---------------|
| `REDISHOST` | Redis server hostname | - |
| `REDISPORT` | Redis server port | - |
| `REDISUSER` | Redis username | - |
| `REDISPASSWORD` | Redis password | - |
| `PORT` | Application port | `3000` |
| `RAILWAY_STATIC_URL` | Public URL | `http://localhost:3000` |

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled application
- `npm run watch` - Development mode with auto-reload
- `npm run lint` - Type-check without compilation

## Technology Stack

- **[Fastify](https://fastify.dev/)** v5 - Web framework
- **[BullMQ](https://docs.bullmq.io/)** v5 - Job queue
- **[Bull Board](https://github.com/felixmosh/bull-board)** v6 - Queue dashboard
- **[envsafe](https://github.com/KATT/envsafe)** - Environment validation
- **[TypeScript](https://www.typescriptlang.org/)** v5 - Type safety
- **[Redis](https://redis.io/)** - Data store and queue backend

## Common Use Cases

- **Email Processing**: Queue and send emails asynchronously
- **Invoice Generation**: Generate and process invoices in background
- **Data Processing**: ETL jobs, data transformation
- **Scheduled Tasks**: Cron-like job scheduling
- **Webhooks**: Reliable webhook processing and retries
- **Notifications**: Push notifications, SMS, etc.
- **Report Generation**: Long-running report creation
- **Image Processing**: Thumbnail generation, optimization

## Best Practices

1. **Job Idempotency**: Ensure jobs can be safely retried
2. **Error Handling**: Use try-catch in job processors
3. **Progress Tracking**: Update job progress for long-running tasks
4. **Logging**: Use `job.log()` for debugging
5. **Timeouts**: Set appropriate timeouts for jobs
6. **Rate Limiting**: Implement rate limiting for external API calls

## Production Considerations

- Enable Redis persistence for job data durability
- Set up monitoring and alerting for failed jobs
- Configure appropriate retry strategies
- Use Redis Sentinel or Cluster for high availability
- Implement proper logging (consider Pino or Winston)
- Set up health checks for the application

## License

MIT

## Support

For issues and questions:
- Review the [Fastify documentation](https://fastify.dev/docs/latest/)
- Check [BullMQ guides](https://docs.bullmq.io/)
- Open an issue in this repository

# AI Coding Guidelines for fastify-bullmq

## Architecture Overview
This is a Fastify v5-based queue service using BullMQ v5 with Redis backend and Bull Board v6 dashboard. The service provides a single API endpoint `/add-job` for queueing "WelcomeEmail" jobs with simulated processing.

## Key Components
- **`src/index.ts`**: Main Fastify server with Bull Board integration and `/add-job` endpoint
- **`src/queue.ts`**: Queue creation, worker setup, and job processing logic
- **`src/env.ts`**: Strict environment validation using `envsafe` for Redis and server config

## Patterns & Conventions

### Environment Configuration
Use `envsafe` for all environment variables with strict validation:
```typescript
import { envsafe, port, str } from 'envsafe';

export const env = envsafe({
  REDISHOST: str(),
  REDISPORT: port(),
  REDISUSER: str(),
  REDISPASSWORD: str(),
  PORT: port({ devDefault: 3000 }),
  RAILWAY_STATIC_URL: str({ devDefault: 'http://localhost:3000' }),
});
```

### Queue Management (BullMQ v5)
- Create queues with `new Queue(name, { connection })` 
- Use `new Worker(queueName, processorFn, { connection })` for processing
- **Breaking change**: `QueueScheduler` removed in BullMQ v5 - workers handle scheduling automatically
- Connection object requires Redis credentials from environment
- Workers are created directly without waiting

### Fastify v5 Integration
- Use `fastify()` without explicit types for better type inference
- Register routes BEFORE calling `server.register()` for plugins
- Do NOT await `server.register()` during route setup to preserve FastifyInstance type
- Bull Board adapter: call `serverAdapter.setBasePath()` before `createBullBoard()`
- Use generic types for routes: `server.get<{ Querystring: MyType }>(...)`
- Use `async` route handlers with `return` instead of `reply.send()`

### Bull Board v6 Integration
```typescript
const serverAdapter = new FastifyAdapter();
serverAdapter.setBasePath('/');

createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
});

server.register(serverAdapter.registerPlugin(), { prefix: '/' });
```

### Job Processing
Jobs include progress updates and logging:
```typescript
new Worker(queueName, async (job) => {
  for (let i = 0; i <= 100; i++) {
    await job.updateProgress(i);
    await job.log(`Processing job at interval ${i}`);
  }
  return { jobId: `Completed ${job.id}` };
}, { connection });
```

## Development Workflow

### Build & Run
- `npm run build`: Compile TypeScript with `tsc` (NOT dts-cli)
- `npm start`: Run compiled JavaScript from `dist/`
- `npm run watch`: Development watch mode with `tsc --watch`
- `npm run lint`: TypeScript type checking without emit

### Testing Jobs
Add test jobs via: `curl https://${env.RAILWAY_STATIC_URL}/add-job?id=1&email=test@example.com`

### Dependencies (Current Versions)
- **bullmq@^5.63.0**: Queue management (v5 removes QueueScheduler)
- **fastify@^5.6.2**: Web framework (v5 plugin changes)
- **@bull-board/api@^6.14.1**: Bull Board core
- **@bull-board/fastify@^6.14.1**: Fastify adapter for Bull Board
- **@bull-board/ui@^6.14.1**: Bull Board UI
- **envsafe@^2.0.3**: Environment validation
- **typescript@^5.9.3**: TypeScript compiler

## Build Configuration

### TypeScript Config
Uses standard `tsc` compiler with:
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Declaration files generated
- Output to `dist/`

### Important Notes
- **Do NOT use dts-cli** - it has type checking issues with Fastify v5
- Use standard TypeScript compiler (`tsc`) instead
- Routes must be defined BEFORE plugin registration to avoid type issues
- Don't await `server.register()` when defining routes afterward

## File Structure
```
src/
├── index.ts    # Server setup, API routes, Bull Board
├── queue.ts    # Queue creation and worker processing
└── env.ts      # Environment configuration
dist/           # Compiled JavaScript output
```

## Railway Deployment
Designed for Railway.app with Redis service integration. Environment variables map to Railway's Redis service configuration (`REDISHOST`, `REDISPORT`, `REDISUSER`, `REDISPASSWORD`). The service listens on `env.PORT` with host `0.0.0.0`.</content>
<parameter name="filePath">/home/alizeu/tools/invoice-notifier/.github/copilot-instructions.md
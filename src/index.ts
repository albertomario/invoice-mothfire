import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { env } from './env';
import { createQueue, setupQueueProcessor } from './queue';
import { AnyJobData } from './types/jobs';

interface AddJobBody {
  type: 'fetch-account-data' | 'fetch-invoice' | 'pay-invoice' | 'reject-invoice';
  provider: string;
  accountContract: string;
  // Optional fields for specific job types
  status?: 'unpaid' | 'paid' | 'all';
  invoiceNumber?: string;
  amount?: number;
  reason?: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  abilities: string[];
  logoPath?: string;
}

interface ProvidersConfig {
  providers: ProviderConfig[];
}

/**
 * Load providers configuration from JSON file
 */
const loadProvidersConfig = (): ProvidersConfig => {
  const configPath = join(process.cwd(), 'providers.json');
  const configData = readFileSync(configPath, 'utf-8');
  return JSON.parse(configData);
};

/**
 * Load and encode logo as base64
 */
const loadProviderLogo = (logoPath: string): string | null => {
  try {
    const fullPath = join(process.cwd(), logoPath);
    const logoData = readFileSync(fullPath);
    return `data:image/svg+xml;base64,${logoData.toString('base64')}`;
  } catch (error) {
    console.warn(`Failed to load logo: ${logoPath}`, error);
    return null;
  }
};

const run = async () => {
  const invoiceQueue = createQueue('InvoiceNotifierQueue');
  await setupQueueProcessor(invoiceQueue.name);

  const server = fastify();

  // API route to list all supported providers
  server.get('/providers', async (req, reply) => {
    const config = loadProvidersConfig();
    
    const providers = config.providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      abilities: provider.abilities,
      logo: provider.logoPath ? loadProviderLogo(provider.logoPath) : null,
    }));

    return {
      providers,
      count: providers.length,
    };
  });

  // API route to add jobs - MUST BE BEFORE Bull Board registration
  server.post<{ Body: AddJobBody }>(
    '/add-job',
    {
      schema: {
        body: {
          type: 'object',
          required: ['type', 'provider', 'accountContract'],
          properties: {
            type: {
              type: 'string',
              enum: ['fetch-account-data', 'fetch-invoice', 'pay-invoice', 'reject-invoice'],
            },
            provider: { type: 'string' },
            accountContract: { type: 'string' },
            status: { type: 'string', enum: ['unpaid', 'paid', 'all'] },
            invoiceNumber: { type: 'string' },
            amount: { type: 'number' },
            reason: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { type, provider, accountContract } = req.body;

      // Validate required fields based on job type
      if (type === 'pay-invoice') {
        if (!req.body.invoiceNumber || !req.body.amount) {
          return reply.status(400).send({
            error: 'pay-invoice requires invoiceNumber and amount',
          });
        }
      }

      if (type === 'reject-invoice') {
        if (!req.body.invoiceNumber || !req.body.reason) {
          return reply.status(400).send({
            error: 'reject-invoice requires invoiceNumber and reason',
          });
        }
      }

      // Build job data based on type
      let jobData: AnyJobData;

      switch (type) {
        case 'fetch-account-data':
          jobData = { type, provider, accountContract };
          break;

        case 'fetch-invoice':
          jobData = {
            type,
            provider,
            accountContract,
            status: req.body.status || 'unpaid',
          };
          break;

        case 'pay-invoice':
          jobData = {
            type,
            provider,
            accountContract,
            invoiceNumber: req.body.invoiceNumber!,
            amount: req.body.amount!,
          };
          break;

        case 'reject-invoice':
          jobData = {
            type,
            provider,
            accountContract,
            invoiceNumber: req.body.invoiceNumber!,
            reason: req.body.reason!,
          };
          break;
      }

      // Add job to queue
      const job = await invoiceQueue.add(`${type}-${Date.now()}`, jobData);

      return {
        ok: true,
        jobId: job.id,
        jobName: job.name,
        jobType: type,
      };
    }
  );

  // API route to check job status
  server.get<{ Params: { jobId: string } }>(
    '/job/:jobId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['jobId'],
          properties: {
            jobId: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const { jobId } = req.params;

      const job = await invoiceQueue.getJob(jobId);

      if (!job) {
        return reply.status(404).send({
          error: 'Job not found',
          jobId,
        });
      }

      const state = await job.getState();
      const progress = job.progress;
      const logs = await invoiceQueue.getJobLogs(jobId);

      return {
        jobId: job.id,
        jobName: job.name,
        state,
        progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        logs: logs.logs,
      };
    }
  );

  // Setup Bull Board AFTER routes
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath('/');
  
  createBullBoard({
    queues: [new BullMQAdapter(invoiceQueue)],
    serverAdapter,
  });

  // Register Bull Board plugin
  server.register(serverAdapter.registerPlugin(), {
    prefix: '/',
  });

  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  
  console.log(`Server running on http://0.0.0.0:${env.PORT}`);
  console.log(`Bull Board UI: http://0.0.0.0:${env.PORT}`);
  console.log('\nExample API calls:');
  console.log(`
# List all supported providers
curl http://localhost:${env.PORT}/providers

# Fetch account data
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -d '{"type":"fetch-account-data","provider":"eon","accountContract":"002202348574"}'

# Fetch unpaid invoices
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -d '{"type":"fetch-invoice","provider":"eon","accountContract":"002202348574","status":"unpaid"}'

# Pay invoice
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -d '{"type":"pay-invoice","provider":"eon","accountContract":"002202348574","invoiceNumber":"011895623139","amount":317.79}'

# Reject invoice
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -d '{"type":"reject-invoice","provider":"eon","accountContract":"002202348574","invoiceNumber":"011895623139","reason":"Incorrect billing"}'

# Check job status (replace JOB_ID with the ID returned from add-job)
curl http://localhost:${env.PORT}/job/JOB_ID
  `);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

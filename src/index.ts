import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import basicAuth from '@fastify/basic-auth';
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
    
    // Determine MIME type based on file extension
    const mimeType = logoPath.endsWith('.svg') 
      ? 'image/svg+xml' 
      : logoPath.endsWith('.png') 
      ? 'image/png'
      : logoPath.endsWith('.jpg') || logoPath.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/svg+xml'; // default fallback
    
    return `data:${mimeType};base64,${logoData.toString('base64')}`;
  } catch (error) {
    console.warn(`Failed to load logo: ${logoPath}`, error);
    return null;
  }
};

const run = async () => {
  const invoiceQueue = createQueue('InvoiceNotifierQueue');
  await setupQueueProcessor(invoiceQueue.name);

  const server = fastify();

  // Register CORS plugin
  await server.register(cors, {
    origin: true, // Allow all origins, or specify specific origins
    credentials: true,
  });

  // Register basic auth plugin for Bull Board
  await server.register(basicAuth, {
    validate: async (username: string, password: string) => {
      if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
        return new Error('Invalid username or password');
      }
    },
    authenticate: { realm: 'Bull Board Admin' },
  });

  // Authentication hook for API endpoints
  const authenticateToken = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token || token !== env.API_TOKEN) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or missing API token',
      });
    }
  };

  // API route to list all supported providers
  server.get('/providers', { preHandler: authenticateToken }, async (req, reply) => {
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
      preHandler: authenticateToken,
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
      preHandler: authenticateToken,
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
  serverAdapter.setBasePath('/ui');
  
  createBullBoard({
    queues: [new BullMQAdapter(invoiceQueue)],
    serverAdapter,
  });

  // Register Bull Board plugin with basic auth
  await server.register(
    async (instance) => {
      instance.addHook('onRequest', instance.basicAuth);
      await instance.register(serverAdapter.registerPlugin(), {
        prefix: '/ui',
      });
    }
  );

  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  
  console.log(`Server running on http://0.0.0.0:${env.PORT}`);
  console.log(`Bull Board UI: http://0.0.0.0:${env.PORT}/ui (Basic Auth: ${env.ADMIN_USERNAME})`);
  console.log('\nAuthentication:');
  console.log(`  - API Token: Use "Authorization: Bearer YOUR_TOKEN" header`);
  console.log(`  - Bull Board: Basic Auth (username: ${env.ADMIN_USERNAME})`);
  console.log('\nExample API calls (replace YOUR_TOKEN with your API_TOKEN):');
  console.log(`
# List all supported providers
curl http://localhost:${env.PORT}/providers \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Fetch account data
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"type":"fetch-account-data","provider":"eon","accountContract":"002202348574"}'

# Fetch unpaid invoices
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"type":"fetch-invoice","provider":"eon","accountContract":"002202348574","status":"unpaid"}'

# Pay invoice
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"type":"pay-invoice","provider":"eon","accountContract":"002202348574","invoiceNumber":"011895623139","amount":317.79}'

# Reject invoice
curl -X POST http://localhost:${env.PORT}/add-job \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"type":"reject-invoice","provider":"eon","accountContract":"002202348574","invoiceNumber":"011895623139","reason":"Incorrect billing"}'

# Check job status (replace JOB_ID with the ID returned from add-job)
curl http://localhost:${env.PORT}/job/JOB_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"
  `);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

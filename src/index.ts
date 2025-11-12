import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
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

const run = async () => {
  const invoiceQueue = createQueue('InvoiceNotifierQueue');
  await setupQueueProcessor(invoiceQueue.name);

  const server = fastify();

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
  `);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

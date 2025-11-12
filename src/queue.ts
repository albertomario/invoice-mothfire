import { ConnectionOptions, Queue, Worker } from 'bullmq';

import { env } from './env';
import { AnyJobData } from './types/jobs';
import { processJob } from './processors';

const connection: ConnectionOptions = {
  host: env.REDISHOST,
  port: env.REDISPORT,
  username: env.REDISUSER,
  password: env.REDISPASSWORD,
};

/**
 * Create a queue for invoice notifier jobs
 */
export const createQueue = (name: string) =>
  new Queue<AnyJobData>(name, { connection });

/**
 * Setup queue processor with job type routing
 */
export const setupQueueProcessor = async (queueName: string) => {
  new Worker<AnyJobData>(queueName, processJob, { connection });
};

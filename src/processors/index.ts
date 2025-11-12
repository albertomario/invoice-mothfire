import { Job } from 'bullmq';
import { AnyJobData, AnyJobResult } from '../types/jobs';
import { processFetchAccountData } from './fetch-account-data';
import { processFetchInvoice } from './fetch-invoice';
import { processPayInvoice } from './pay-invoice';
import { processRejectInvoice } from './reject-invoice';

/**
 * Main job processor that routes jobs to appropriate handlers based on job type
 */
export async function processJob(
  job: Job<AnyJobData>
): Promise<AnyJobResult> {
  const { type } = job.data;

  await job.log(`Processing job type: ${type}`);

  switch (type) {
    case 'fetch-account-data':
      return processFetchAccountData(job as any);

    case 'fetch-invoice':
      return processFetchInvoice(job as any);

    case 'pay-invoice':
      return processPayInvoice(job as any);

    case 'reject-invoice':
      return processRejectInvoice(job as any);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

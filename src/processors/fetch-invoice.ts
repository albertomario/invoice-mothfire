import { Job } from 'bullmq';
import { FetchInvoiceJobData, FetchInvoiceResult } from '../types/jobs';
import { ProviderFactory } from '../providers';

/**
 * Process fetch-invoice jobs
 */
export async function processFetchInvoice(
  job: Job<FetchInvoiceJobData>
): Promise<FetchInvoiceResult> {
  const { provider, accountContract, status = 'unpaid' } = job.data;

  await job.log(
    `Starting fetch-invoice for contract: ${accountContract}, status: ${status}`
  );
  await job.updateProgress(10);

  try {
    // Get provider instance
    const providerInstance = ProviderFactory.getProvider(provider);
    await job.log(`Provider ${provider} initialized`);
    await job.updateProgress(30);

    // Fetch invoices
    await job.log(`Fetching ${status} invoices from ${provider}`);
    const result = await providerInstance.fetchInvoices(
      accountContract,
      status
    );
    await job.updateProgress(90);

    await job.log(
      `Invoices fetched successfully. Count: ${result.count}`
    );
    await job.updateProgress(100);

    return result;
  } catch (error) {
    await job.log(`Error fetching invoices: ${error}`);
    throw error;
  }
}

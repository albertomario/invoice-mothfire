import { Job } from 'bullmq';
import { RejectInvoiceJobData, RejectInvoiceResult } from '../types/jobs';
import { ProviderFactory } from '../providers';

/**
 * Process reject-invoice jobs
 */
export async function processRejectInvoice(
  job: Job<RejectInvoiceJobData>
): Promise<RejectInvoiceResult> {
  const { provider, accountContract, invoiceNumber, reason } = job.data;

  await job.log(
    `Starting reject-invoice for invoice: ${invoiceNumber}, reason: ${reason}`
  );
  await job.updateProgress(10);

  try {
    // Get provider instance
    const providerInstance = ProviderFactory.getProvider(provider);
    await job.log(`Provider ${provider} initialized`);
    await job.updateProgress(30);

    // Reject invoice
    await job.log(`Rejecting invoice ${invoiceNumber}`);
    const result = await providerInstance.rejectInvoice(
      accountContract,
      invoiceNumber,
      reason
    );
    await job.updateProgress(90);

    await job.log(
      `Invoice rejection ${result.success ? 'successful' : 'failed'}`
    );
    await job.updateProgress(100);

    return result;
  } catch (error) {
    await job.log(`Error rejecting invoice: ${error}`);
    throw error;
  }
}

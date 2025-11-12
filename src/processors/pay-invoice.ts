import { Job } from 'bullmq';
import { PayInvoiceJobData, PayInvoiceResult } from '../types/jobs';
import { ProviderFactory } from '../providers';

/**
 * Process pay-invoice jobs
 */
export async function processPayInvoice(
  job: Job<PayInvoiceJobData>
): Promise<PayInvoiceResult> {
  const { provider, accountContract, invoiceNumber, amount } = job.data;

  await job.log(
    `Starting pay-invoice for invoice: ${invoiceNumber}, amount: ${amount}`
  );
  await job.updateProgress(10);

  try {
    // Get provider instance
    const providerInstance = ProviderFactory.getProvider(provider);
    await job.log(`Provider ${provider} initialized`);
    await job.updateProgress(30);

    // Pay invoice
    await job.log(`Processing payment for invoice ${invoiceNumber}`);
    const result = await providerInstance.payInvoice(
      accountContract,
      invoiceNumber,
      amount
    );
    await job.updateProgress(90);

    await job.log(
      `Payment ${result.success ? 'successful' : 'failed'}. Transaction ID: ${result.transactionId}`
    );
    await job.updateProgress(100);

    return result;
  } catch (error) {
    await job.log(`Error paying invoice: ${error}`);
    throw error;
  }
}

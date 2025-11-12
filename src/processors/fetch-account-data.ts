import { Job } from 'bullmq';
import {
  FetchAccountDataJobData,
  FetchAccountDataResult,
} from '../types/jobs';
import { ProviderFactory } from '../providers';

/**
 * Process fetch-account-data jobs
 */
export async function processFetchAccountData(
  job: Job<FetchAccountDataJobData>
): Promise<FetchAccountDataResult> {
  const { provider, accountContract } = job.data;

  await job.log(`Starting fetch-account-data for contract: ${accountContract}`);
  await job.updateProgress(10);

  try {
    // Get provider instance
    const providerInstance = ProviderFactory.getProvider(provider);
    await job.log(`Provider ${provider} initialized`);
    await job.updateProgress(30);

    // Fetch account data
    await job.log(`Fetching account balance from ${provider}`);
    const result = await providerInstance.fetchAccountData(accountContract);
    await job.updateProgress(90);

    await job.log(
      `Account data fetched successfully. Balance: ${result.balance}`
    );
    await job.updateProgress(100);

    return result;
  } catch (error) {
    await job.log(`Error fetching account data: ${error}`);
    throw error;
  }
}

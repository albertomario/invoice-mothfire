import { IProvider, ProviderConfig } from '../types/provider';
import { EONProvider } from './eon';
import { env } from '../env';

/**
 * Provider factory to create provider instances based on provider name
 */
export class ProviderFactory {
  private static providers: Map<string, IProvider> = new Map();

  /**
   * Get or create a provider instance
   */
  static getProvider(providerName: string): IProvider {
    const key = providerName.toLowerCase();

    // Return cached provider if exists
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    // Create new provider based on name
    let provider: IProvider;

    switch (key) {
      case 'eon':
        provider = new EONProvider({
          apiBaseUrl: env.EON_API_BASE_URL,
          apiKey: env.EON_API_KEY,
          username: env.EON_USERNAME,
          password: env.EON_PASSWORD,
        });
        break;

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }

    // Cache and return
    this.providers.set(key, provider);
    return provider;
  }

  /**
   * Clear provider cache (useful for testing)
   */
  static clearCache(): void {
    this.providers.clear();
  }
}

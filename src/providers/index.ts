import { IProvider, ProviderConfig } from '../types/provider';
import { EONProvider } from './eon';
import { NovaApaServProvider } from './nova-apa-serv';
import { env } from '../env';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ProvidersConfigFile {
  providers: Array<{
    id: string;
    name: string;
    description: string;
    abilities: string[];
    logoPath?: string;
  }>;
}

/**
 * Provider factory to create provider instances based on provider name
 */
export class ProviderFactory {
  private static providers: Map<string, IProvider> = new Map();
  private static supportedProviders: Set<string> | null = null;

  /**
   * Load and cache supported provider IDs from providers.json
   */
  private static getSupportedProviders(): Set<string> {
    if (this.supportedProviders) {
      return this.supportedProviders;
    }

    try {
      const configPath = join(process.cwd(), 'providers.json');
      const configData = readFileSync(configPath, 'utf-8');
      const config: ProvidersConfigFile = JSON.parse(configData);
      this.supportedProviders = new Set(config.providers.map((p) => p.id.toLowerCase()));
      return this.supportedProviders;
    } catch (error) {
      console.warn('Failed to load providers.json, using default providers', error);
      // Fallback to hardcoded list
      this.supportedProviders = new Set(['eon']);
      return this.supportedProviders;
    }
  }

  /**
   * Check if a provider is supported
   */
  static isSupported(providerName: string): boolean {
    const key = providerName.toLowerCase();
    return this.getSupportedProviders().has(key);
  }

  /**
   * Get or create a provider instance
   */
  static getProvider(providerName: string): IProvider {
    const key = providerName.toLowerCase();

    // Check if provider is supported
    if (!this.isSupported(key)) {
      throw new Error(
        `Unknown provider: ${providerName}. Supported providers: ${Array.from(
          this.getSupportedProviders()
        ).join(', ')}`
      );
    }

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

      case 'nova-apa-serv':
        provider = new NovaApaServProvider({
          apiBaseUrl: env.NOVA_APA_SERV_API_BASE_URL,
          apiKey: '',
          username: env.NOVA_APA_SERV_USERNAME,
          password: env.NOVA_APA_SERV_PASSWORD,
        });
        break;

      default:
        throw new Error(`Provider ${providerName} is registered but not implemented`);
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
    this.supportedProviders = null;
  }
}

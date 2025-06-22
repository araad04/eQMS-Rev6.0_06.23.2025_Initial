/**
 * Storage Settings Service
 * ISO 13485:2016 compliant storage configuration management
 * Manages external repository integration for document storage
 */

import { StorageProviderFactory, StorageProviderInterface, StorageProviderConfig } from './storage-provider.interface';

export interface StorageConfigurationRequest {
  name: string;
  description: string;
  provider: 'aws-s3' | 'azure-blob' | 'gcp-storage' | 'sharepoint' | 'local-sftp' | 'local-https';
  config: StorageProviderConfig;
  isActive: boolean;
  isDefault: boolean;
  compliance: {
    iso13485: boolean;
    cfr21Part11: boolean;
    gdpr: boolean;
  };
  encryptionSettings: {
    enabled: boolean;
    algorithm?: string;
    keyManagement?: string;
  };
}

export interface StorageTestResult {
  success: boolean;
  latency?: number;
  error?: string;
  capabilities: {
    upload: boolean;
    download: boolean;
    delete: boolean;
    list: boolean;
    versioning: boolean;
    encryption: boolean;
  };
  compliance: {
    iso13485: boolean;
    cfr21Part11: boolean;
    auditTrail: boolean;
  };
}

export class StorageSettingsService {
  private activeProviders: Map<string, StorageProviderInterface> = new Map();
  private defaultProvider: string | null = null;

  /**
   * Test storage provider configuration
   */
  async testStorageConfiguration(config: StorageConfigurationRequest): Promise<StorageTestResult> {
    try {
      const provider = await StorageProviderFactory.createProvider(config.config);
      const testResult = await provider.testConnection();
      
      return {
        success: testResult.connected,
        latency: testResult.latency,
        error: testResult.error,
        capabilities: testResult.capabilities || {
          upload: false,
          download: false,
          delete: false,
          list: false,
          versioning: false,
          encryption: false,
        },
        compliance: testResult.compliance || {
          iso13485: false,
          cfr21Part11: false,
          auditTrail: false,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed',
        capabilities: {
          upload: false,
          download: false,
          delete: false,
          list: false,
          versioning: false,
          encryption: false,
        },
        compliance: {
          iso13485: false,
          cfr21Part11: false,
          auditTrail: false,
        }
      };
    }
  }

  /**
   * Validate storage configuration
   */
  async validateStorageConfiguration(config: StorageConfigurationRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate basic configuration
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Configuration name is required');
    }

    if (!config.provider) {
      errors.push('Storage provider is required');
    }

    // Validate provider-specific configuration
    try {
      const provider = await StorageProviderFactory.createProvider(config.config);
      const validationResult = await provider.validateConfig();
      
      if (!validationResult.valid) {
        errors.push(...validationResult.errors);
      }
    } catch (error) {
      errors.push(`Provider validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate compliance requirements
    if (config.compliance.iso13485 || config.compliance.cfr21Part11) {
      if (!config.encryptionSettings.enabled) {
        errors.push('Encryption is required for ISO 13485 and 21 CFR Part 11 compliance');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Initialize storage provider
   */
  async initializeStorageProvider(configId: string, config: StorageConfigurationRequest): Promise<void> {
    try {
      const provider = await StorageProviderFactory.createProvider(config.config);
      this.activeProviders.set(configId, provider);
      
      if (config.isDefault) {
        this.defaultProvider = configId;
      }
    } catch (error) {
      throw new Error(`Failed to initialize storage provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage provider instance
   */
  getStorageProvider(configId?: string): StorageProviderInterface | null {
    const providerId = configId || this.defaultProvider;
    
    if (!providerId) {
      return null;
    }
    
    return this.activeProviders.get(providerId) || null;
  }

  /**
   * Set default storage provider
   */
  setDefaultProvider(configId: string): void {
    if (this.activeProviders.has(configId)) {
      this.defaultProvider = configId;
    } else {
      throw new Error(`Storage provider ${configId} not found`);
    }
  }

  /**
   * Remove storage provider
   */
  async removeStorageProvider(configId: string): Promise<void> {
    const provider = this.activeProviders.get(configId);
    
    if (provider) {
      await provider.cleanup();
      this.activeProviders.delete(configId);
      
      if (this.defaultProvider === configId) {
        this.defaultProvider = null;
      }
    }
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(configId: string): any {
    const provider = this.activeProviders.get(configId);
    return provider ? provider.getCapabilities() : null;
  }

  /**
   * Generate storage configuration template
   */
  generateConfigurationTemplate(provider: string): Partial<StorageProviderConfig> {
    switch (provider) {
      case 'aws-s3':
        return {
          provider: 'aws-s3',
          region: 'us-east-1',
          bucket: '',
          accessKeyId: '',
          secretAccessKey: '',
          encryption: {
            enabled: true,
            algorithm: 'AES256'
          },
          compliance: {
            iso13485: true,
            cfr21Part11: true,
            gdpr: true
          }
        };

      case 'azure-blob':
        return {
          provider: 'azure-blob',
          connectionString: '',
          container: '',
          tenantId: '',
          clientId: '',
          clientSecret: '',
          encryption: {
            enabled: true
          },
          compliance: {
            iso13485: true,
            cfr21Part11: true,
            gdpr: true
          }
        };

      case 'gcp-storage':
        return {
          provider: 'gcp-storage',
          bucket: '',
          encryption: {
            enabled: true
          },
          compliance: {
            iso13485: true,
            cfr21Part11: true,
            gdpr: true
          }
        };

      case 'sharepoint':
        return {
          provider: 'sharepoint',
          siteUrl: '',
          libraryName: '',
          tenantId: '',
          clientId: '',
          clientSecret: '',
          compliance: {
            iso13485: true,
            cfr21Part11: true,
            gdpr: true
          }
        };

      case 'local-sftp':
        return {
          provider: 'local-sftp',
          endpoint: '',
          port: 22,
          username: '',
          password: '',
          basePath: '/uploads',
          compliance: {
            iso13485: true,
            cfr21Part11: true,
            gdpr: false
          }
        };

      case 'local-https':
        return {
          provider: 'local-https',
          basePath: './uploads',
          compliance: {
            iso13485: true,
            cfr21Part11: true,
            gdpr: false
          }
        };

      default:
        return {
          provider: 'local-https',
          basePath: './uploads'
        };
    }
  }

  /**
   * Get compliance recommendations
   */
  getComplianceRecommendations(provider: string): {
    iso13485: string[];
    cfr21Part11: string[];
    gdpr: string[];
  } {
    const baseRecommendations = {
      iso13485: [
        'Enable encryption at rest and in transit',
        'Implement comprehensive audit logging',
        'Ensure document version control',
        'Maintain data integrity validation',
        'Implement access control mechanisms'
      ],
      cfr21Part11: [
        'Enable electronic signatures',
        'Implement audit trail requirements',
        'Ensure data integrity and security',
        'Maintain system validation documentation',
        'Implement user authentication controls'
      ],
      gdpr: [
        'Implement data subject rights (access, deletion)',
        'Ensure data processing lawfulness',
        'Maintain data processing records',
        'Implement privacy by design',
        'Ensure cross-border transfer compliance'
      ]
    };

    // Provider-specific recommendations
    switch (provider) {
      case 'aws-s3':
        return {
          ...baseRecommendations,
          iso13485: [
            ...baseRecommendations.iso13485,
            'Configure S3 bucket versioning',
            'Enable S3 server-side encryption',
            'Configure CloudTrail for audit logging'
          ]
        };

      case 'azure-blob':
        return {
          ...baseRecommendations,
          iso13485: [
            ...baseRecommendations.iso13485,
            'Enable Azure blob versioning',
            'Configure Azure Storage encryption',
            'Enable Azure activity logging'
          ]
        };

      default:
        return baseRecommendations;
    }
  }

  /**
   * Cleanup all providers
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.activeProviders.values()).map(provider => provider.cleanup());
    await Promise.allSettled(cleanupPromises);
    
    this.activeProviders.clear();
    this.defaultProvider = null;
  }
}
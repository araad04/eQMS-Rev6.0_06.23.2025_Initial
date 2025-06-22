/**
 * Storage Provider Abstraction Layer (SPAL)
 * ISO 13485:2016 (4.2.5), ISO/IEC 27001 compliant storage interface
 * 
 * Abstract interface for medical device document storage providers
 * Supports AWS S3, Azure Blob, GCP Storage, SharePoint, and Local SFTP
 */

export interface StorageProviderConfig {
  provider: string;
  region?: string;
  bucket?: string;
  container?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  connectionString?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  siteUrl?: string;
  libraryName?: string;
  endpoint?: string;
  port?: number;
  username?: string;
  password?: string;
  basePath?: string;
  encryption?: {
    enabled: boolean;
    keyId?: string;
    algorithm?: string;
  };
  compliance?: {
    iso13485: boolean;
    cfr21Part11: boolean;
    gdpr: boolean;
  };
}

export interface FileMetadata {
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  version: string;
  documentType: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  uploadedBy: number;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface UploadOptions {
  encryption?: boolean;
  compression?: boolean;
  versioning?: boolean;
  auditTrail?: boolean;
  checksumValidation?: boolean;
  metadata?: Record<string, any>;
}

export interface DownloadOptions {
  version?: string;
  auditTrail?: boolean;
  accessControl?: {
    userId: number;
    permissions: string[];
  };
}

export interface StorageOperationResult {
  success: boolean;
  filePath?: string;
  fileId?: string;
  checksum?: string;
  version?: string;
  error?: string;
  auditLog?: {
    action: string;
    timestamp: Date;
    userId: number;
    details: Record<string, any>;
  };
}

export interface StorageListResult {
  files: Array<{
    filePath: string;
    fileName: string;
    fileSize: number;
    lastModified: Date;
    version: string;
    metadata?: Record<string, any>;
  }>;
  totalCount: number;
  hasMore: boolean;
  nextToken?: string;
}

export interface ConnectionTestResult {
  connected: boolean;
  latency?: number;
  error?: string;
  capabilities?: {
    upload: boolean;
    download: boolean;
    delete: boolean;
    list: boolean;
    versioning: boolean;
    encryption: boolean;
  };
  compliance?: {
    iso13485: boolean;
    cfr21Part11: boolean;
    auditTrail: boolean;
  };
}

/**
 * Abstract Storage Provider Interface
 * All storage providers must implement this interface
 */
export abstract class StorageProviderInterface {
  protected config: StorageProviderConfig;
  
  constructor(config: StorageProviderConfig) {
    this.config = config;
  }

  /**
   * Test connection to storage provider
   */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * Upload file to storage provider
   */
  abstract upload(
    fileBuffer: Buffer,
    metadata: FileMetadata,
    options?: UploadOptions
  ): Promise<StorageOperationResult>;

  /**
   * Download file from storage provider
   */
  abstract download(
    filePath: string,
    options?: DownloadOptions
  ): Promise<Buffer>;

  /**
   * List files in storage provider
   */
  abstract list(
    folder: string,
    options?: {
      recursive?: boolean;
      pageSize?: number;
      pageToken?: string;
    }
  ): Promise<StorageListResult>;

  /**
   * Delete file from storage provider
   */
  abstract delete(
    filePath: string,
    options?: {
      permanent?: boolean;
      auditTrail?: boolean;
    }
  ): Promise<StorageOperationResult>;

  /**
   * Move/rename file in storage provider
   */
  abstract move(
    sourcePath: string,
    destinationPath: string,
    options?: {
      auditTrail?: boolean;
    }
  ): Promise<StorageOperationResult>;

  /**
   * Copy file in storage provider
   */
  abstract copy(
    sourcePath: string,
    destinationPath: string,
    options?: {
      auditTrail?: boolean;
    }
  ): Promise<StorageOperationResult>;

  /**
   * Get file metadata
   */
  abstract getMetadata(filePath: string): Promise<FileMetadata>;

  /**
   * Update file metadata
   */
  abstract updateMetadata(
    filePath: string,
    metadata: Partial<FileMetadata>
  ): Promise<StorageOperationResult>;

  /**
   * Generate secure download URL
   */
  abstract generateDownloadUrl(
    filePath: string,
    expirationMinutes?: number
  ): Promise<string>;

  /**
   * Generate secure upload URL
   */
  abstract generateUploadUrl(
    filePath: string,
    expirationMinutes?: number
  ): Promise<string>;

  /**
   * Validate configuration
   */
  abstract validateConfig(): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Get storage provider capabilities
   */
  abstract getCapabilities(): {
    versioning: boolean;
    encryption: boolean;
    compression: boolean;
    auditTrail: boolean;
    accessControl: boolean;
    sharing: boolean;
    backup: boolean;
    compliance: string[];
  };

  /**
   * Cleanup temporary files and resources
   */
  abstract cleanup(): Promise<void>;
}

/**
 * Storage Provider Factory
 * Creates appropriate provider instance based on configuration
 */
export class StorageProviderFactory {
  static async createProvider(config: StorageProviderConfig): Promise<StorageProviderInterface> {
    const { S3StorageProvider } = await import('./providers/s3-storage-provider');
    const { AzureBlobStorageProvider } = await import('./providers/azure-blob-storage-provider');
    const { GCPStorageProvider } = await import('./providers/gcp-storage-provider');
    const { SharePointStorageProvider } = await import('./providers/sharepoint-storage-provider');
    const { LocalFileStorageProvider } = await import('./providers/local-file-storage-provider');

    switch (config.provider) {
      case 'aws-s3':
        return new S3StorageProvider(config);
      case 'azure-blob':
        return new AzureBlobStorageProvider(config);
      case 'gcp-storage':
        return new GCPStorageProvider(config);
      case 'sharepoint':
        return new SharePointStorageProvider(config);
      case 'local-sftp':
      case 'local-https':
        return new LocalFileStorageProvider(config);
      default:
        throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  }
}
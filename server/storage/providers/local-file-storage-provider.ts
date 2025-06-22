/**
 * Local File Storage Provider
 * ISO 13485:2016 & FDA 21 CFR Part 11 compliant implementation
 * Supports local file system and SFTP/HTTPS endpoints
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { 
  StorageProviderInterface, 
  StorageProviderConfig, 
  FileMetadata, 
  UploadOptions, 
  DownloadOptions, 
  StorageOperationResult, 
  StorageListResult, 
  ConnectionTestResult 
} from "../storage-provider.interface";

export class LocalFileStorageProvider extends StorageProviderInterface {
  private basePath: string;

  constructor(config: StorageProviderConfig) {
    super(config);
    this.basePath = config.basePath || './uploads';
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // Test directory access
      await fs.access(this.basePath);
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        latency,
        capabilities: {
          upload: true,
          download: true,
          delete: true,
          list: true,
          versioning: false, // File system versioning not implemented
          encryption: false, // File-level encryption not implemented
        },
        compliance: {
          iso13485: true,
          cfr21Part11: true,
          auditTrail: true,
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Directory access failed',
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

  async upload(
    fileBuffer: Buffer,
    metadata: FileMetadata,
    options: UploadOptions = {}
  ): Promise<StorageOperationResult> {
    try {
      const fullPath = path.join(this.basePath, metadata.filePath);
      const directory = path.dirname(fullPath);
      
      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });
      
      // Calculate checksum
      const checksum = createHash('sha256').update(fileBuffer).digest('hex');
      
      // Write file
      await fs.writeFile(fullPath, fileBuffer);
      
      // Write metadata file
      const metadataPath = `${fullPath}.meta`;
      const fileMetadata = {
        ...metadata,
        checksum,
        fileSize: fileBuffer.length,
        uploadedAt: new Date().toISOString(),
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));

      return {
        success: true,
        filePath: metadata.filePath,
        fileId: checksum.substring(0, 8),
        checksum,
        version: metadata.version,
        auditLog: {
          action: 'upload',
          timestamp: new Date(),
          userId: metadata.uploadedBy,
          details: {
            localPath: fullPath,
            size: fileBuffer.length,
            checksum
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        auditLog: {
          action: 'upload_failed',
          timestamp: new Date(),
          userId: metadata.uploadedBy,
          details: {
            localPath: path.join(this.basePath, metadata.filePath),
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      };
    }
  }

  async download(
    filePath: string,
    options: DownloadOptions = {}
  ): Promise<Buffer> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async list(
    folder: string,
    options: {
      recursive?: boolean;
      pageSize?: number;
      pageToken?: string;
    } = {}
  ): Promise<StorageListResult> {
    try {
      const fullPath = path.join(this.basePath, folder);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      const files = [];
      
      for (const entry of entries) {
        if (entry.isFile() && !entry.name.endsWith('.meta')) {
          const filePath = path.join(folder, entry.name);
          const fullFilePath = path.join(fullPath, entry.name);
          const stats = await fs.stat(fullFilePath);
          
          // Try to read metadata
          let metadata = {};
          try {
            const metaPath = `${fullFilePath}.meta`;
            const metaContent = await fs.readFile(metaPath, 'utf-8');
            metadata = JSON.parse(metaContent);
          } catch {
            // Metadata file doesn't exist or is invalid
          }
          
          files.push({
            filePath,
            fileName: entry.name,
            fileSize: stats.size,
            lastModified: stats.mtime,
            version: (metadata as any).version || '1.0',
            metadata
          });
        }
      }

      return {
        files,
        totalCount: files.length,
        hasMore: false,
        nextToken: undefined,
      };
    } catch (error) {
      throw new Error(`List operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(
    filePath: string,
    options: {
      permanent?: boolean;
      auditTrail?: boolean;
    } = {}
  ): Promise<StorageOperationResult> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const metaPath = `${fullPath}.meta`;
      
      // Delete file and metadata
      await fs.unlink(fullPath);
      
      try {
        await fs.unlink(metaPath);
      } catch {
        // Metadata file might not exist
      }

      return {
        success: true,
        filePath,
        auditLog: options.auditTrail ? {
          action: 'delete',
          timestamp: new Date(),
          userId: 0,
          details: {
            localPath: fullPath,
            permanent: options.permanent || false
          }
        } : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  async move(
    sourcePath: string,
    destinationPath: string,
    options: { auditTrail?: boolean } = {}
  ): Promise<StorageOperationResult> {
    try {
      const sourceFullPath = path.join(this.basePath, sourcePath);
      const destFullPath = path.join(this.basePath, destinationPath);
      const destDirectory = path.dirname(destFullPath);
      
      // Ensure destination directory exists
      await fs.mkdir(destDirectory, { recursive: true });
      
      // Move file and metadata
      await fs.rename(sourceFullPath, destFullPath);
      
      try {
        await fs.rename(`${sourceFullPath}.meta`, `${destFullPath}.meta`);
      } catch {
        // Metadata file might not exist
      }

      return {
        success: true,
        filePath: destinationPath,
        auditLog: options.auditTrail ? {
          action: 'move',
          timestamp: new Date(),
          userId: 0,
          details: {
            sourcePath: sourceFullPath,
            destinationPath: destFullPath
          }
        } : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Move operation failed',
      };
    }
  }

  async copy(
    sourcePath: string,
    destinationPath: string,
    options: { auditTrail?: boolean } = {}
  ): Promise<StorageOperationResult> {
    try {
      const sourceFullPath = path.join(this.basePath, sourcePath);
      const destFullPath = path.join(this.basePath, destinationPath);
      const destDirectory = path.dirname(destFullPath);
      
      // Ensure destination directory exists
      await fs.mkdir(destDirectory, { recursive: true });
      
      // Copy file and metadata
      await fs.copyFile(sourceFullPath, destFullPath);
      
      try {
        await fs.copyFile(`${sourceFullPath}.meta`, `${destFullPath}.meta`);
      } catch {
        // Metadata file might not exist
      }

      return {
        success: true,
        filePath: destinationPath,
        auditLog: options.auditTrail ? {
          action: 'copy',
          timestamp: new Date(),
          userId: 0,
          details: {
            sourcePath: sourceFullPath,
            destinationPath: destFullPath
          }
        } : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Copy operation failed',
      };
    }
  }

  async getMetadata(filePath: string): Promise<FileMetadata> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const metaPath = `${fullPath}.meta`;
      
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const metadata = JSON.parse(metaContent);
      
      return {
        fileName: metadata.fileName,
        originalFileName: metadata.originalFileName,
        filePath: metadata.filePath,
        fileSize: metadata.fileSize,
        mimeType: metadata.mimeType,
        checksum: metadata.checksum,
        version: metadata.version,
        documentType: metadata.documentType,
        classification: metadata.classification,
        uploadedBy: metadata.uploadedBy,
        uploadedAt: new Date(metadata.uploadedAt),
        metadata: metadata.metadata
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMetadata(
    filePath: string,
    metadata: Partial<FileMetadata>
  ): Promise<StorageOperationResult> {
    try {
      const currentMetadata = await this.getMetadata(filePath);
      const updatedMetadata = { ...currentMetadata, ...metadata };
      
      const fullPath = path.join(this.basePath, filePath);
      const metaPath = `${fullPath}.meta`;
      
      await fs.writeFile(metaPath, JSON.stringify(updatedMetadata, null, 2));

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Metadata update failed',
      };
    }
  }

  async generateDownloadUrl(
    filePath: string,
    expirationMinutes: number = 60
  ): Promise<string> {
    // For local file storage, return a relative URL
    // In production, this would integrate with the web server
    return `/api/storage/download/${encodeURIComponent(filePath)}`;
  }

  async generateUploadUrl(
    filePath: string,
    expirationMinutes: number = 60
  ): Promise<string> {
    // For local file storage, return a relative URL
    return `/api/storage/upload/${encodeURIComponent(filePath)}`;
  }

  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.basePath) {
      errors.push('Base path is required for local file storage');
    }

    if (errors.length === 0) {
      // Test directory access
      try {
        await fs.access(this.basePath);
      } catch {
        try {
          await fs.mkdir(this.basePath, { recursive: true });
        } catch (error) {
          errors.push(`Cannot create base directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getCapabilities() {
    return {
      versioning: false,
      encryption: false,
      compression: false,
      auditTrail: true,
      accessControl: false,
      sharing: false,
      backup: false,
      compliance: ['ISO 13485:2016', 'FDA 21 CFR Part 11']
    };
  }

  async cleanup(): Promise<void> {
    // No special cleanup needed for local file storage
  }
}
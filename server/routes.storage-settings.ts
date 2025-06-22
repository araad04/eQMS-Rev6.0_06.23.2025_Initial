/**
 * Storage Settings API Routes
 * ISO 13485:2016 compliant storage configuration management
 * Handles external repository integration for document storage
 */

import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { StorageSettingsService } from './storage/storage-settings.service';

const router = Router();

// Initialize storage settings service
const storageSettingsService = new StorageSettingsService();

// Validation schemas
const storageConfigSchema = z.object({
  name: z.string().min(1, 'Configuration name is required'),
  description: z.string().min(1, 'Description is required'),
  provider: z.enum(['aws-s3', 'azure-blob', 'gcp-storage', 'sharepoint', 'local-sftp', 'local-https']),
  config: z.object({
    provider: z.string(),
    region: z.string().optional(),
    bucket: z.string().optional(),
    container: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    connectionString: z.string().optional(),
    tenantId: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    siteUrl: z.string().optional(),
    libraryName: z.string().optional(),
    endpoint: z.string().optional(),
    port: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    basePath: z.string().optional(),
    encryption: z.object({
      enabled: z.boolean(),
      keyId: z.string().optional(),
      algorithm: z.string().optional(),
    }).optional(),
    compliance: z.object({
      iso13485: z.boolean(),
      cfr21Part11: z.boolean(),
      gdpr: z.boolean(),
    }).optional(),
  }),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  compliance: z.object({
    iso13485: z.boolean(),
    cfr21Part11: z.boolean(),
    gdpr: z.boolean(),
  }),
  encryptionSettings: z.object({
    enabled: z.boolean(),
    algorithm: z.string().optional(),
    keyManagement: z.string().optional(),
  }),
});

/**
 * GET /api/storage-settings/providers
 * Retrieve all available storage providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await storage.getStorageProviders();
    res.json({
      success: true,
      data: providers || []
    });
  } catch (error) {
    console.error('Error fetching storage providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storage providers'
    });
  }
});

/**
 * GET /api/storage-settings
 * Retrieve all storage configurations
 */
router.get('/', async (req, res) => {
  try {
    const configurations = await storage.getStorageConfigurations();
    
    res.json({
      success: true,
      data: configurations
    });
  } catch (error) {
    console.error('Error fetching storage configurations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storage configurations'
    });
  }
});

/**
 * GET /api/storage-settings/:id
 * Retrieve specific storage configuration
 */
router.get('/:id', async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const storageInstance = req.app.get('storage');
    const configuration = await storageInstance.getStorageConfiguration(configId);
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }
    
    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error fetching storage configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch storage configuration'
    });
  }
});

/**
 * POST /api/storage-settings
 * Create new storage configuration
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = storageConfigSchema.parse(req.body);
    
    // Validate configuration
    const validationResult = await storageSettingsService.validateStorageConfiguration(validatedData);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Configuration validation failed',
        errors: validationResult.errors
      });
    }
    
    // Create configuration in database
    const configuration = await storage.createStorageConfiguration({
      ...validatedData,
      createdBy: req.user?.id || 0,
      createdAt: new Date(),
    });
    
    // Initialize provider if active
    if (validatedData.isActive) {
      await storageSettingsService.initializeStorageProvider(
        configuration.id.toString(),
        validatedData
      );
    }
    
    res.status(201).json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error creating storage configuration:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create storage configuration'
    });
  }
});

/**
 * PUT /api/storage-settings/:id
 * Update storage configuration
 */
router.put('/:id', async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const validatedData = storageConfigSchema.parse(req.body);
    
    // Update configuration in database
    const configuration = await storage.updateStorageConfiguration(configId, {
      ...validatedData,
      updatedAt: new Date(),
    });
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }
    
    // Reinitialize provider if active
    if (validatedData.isActive) {
      await storageSettingsService.removeStorageProvider(configId.toString());
      await storageSettingsService.initializeStorageProvider(
        configId.toString(),
        validatedData
      );
    } else {
      await storageSettingsService.removeStorageProvider(configId.toString());
    }
    
    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error updating storage configuration:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update storage configuration'
    });
  }
});

/**
 * DELETE /api/storage-settings/:id
 * Delete storage configuration
 */
router.delete('/:id', async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const storage = req.app.get('storage') as DatabaseStorage;
    
    // Remove from storage service
    await storageSettingsService.removeStorageProvider(configId.toString());
    
    // Delete from database
    const success = await storage.deleteStorageConfiguration(configId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Storage configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting storage configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete storage configuration'
    });
  }
});

/**
 * POST /api/storage-settings/:id/test
 * Test storage configuration
 */
router.post('/:id/test', async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const storage = req.app.get('storage') as DatabaseStorage;
    const configuration = await storage.getStorageConfiguration(configId);
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }
    
    // Test configuration
    const testResult = await storageSettingsService.testStorageConfiguration(configuration as any);
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing storage configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test storage configuration'
    });
  }
});

/**
 * POST /api/storage-settings/test
 * Test storage configuration without saving
 */
router.post('/test', async (req, res) => {
  try {
    const validatedData = storageConfigSchema.parse(req.body);
    
    // Test configuration
    const testResult = await storageSettingsService.testStorageConfiguration(validatedData);
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing storage configuration:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to test storage configuration'
    });
  }
});

/**
 * POST /api/storage-settings/:id/set-default
 * Set storage configuration as default
 */
router.post('/:id/set-default', async (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const storage = req.app.get('storage') as DatabaseStorage;
    
    // Update default status in database
    const success = await storage.setDefaultStorageConfiguration(configId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }
    
    // Update storage service
    storageSettingsService.setDefaultProvider(configId.toString());
    
    res.json({
      success: true,
      message: 'Default storage configuration updated successfully'
    });
  } catch (error) {
    console.error('Error setting default storage configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set default storage configuration'
    });
  }
});

/**
 * GET /api/storage-settings/templates
 * Get configuration templates for all providers
 */
router.get('/templates', (req, res) => {
  try {
    // Return templates for all providers
    const templates = {
      'aws-s3': {
        provider: 'aws-s3',
        region: 'us-east-1',
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
        encryption: {
          enabled: true,
          algorithm: 'AES256'
        }
      },
      'azure-blob': {
        provider: 'azure-blob',
        connectionString: '',
        container: '',
        tenantId: '',
        clientId: '',
        clientSecret: '',
        encryption: {
          enabled: true
        }
      },
      'gcp-storage': {
        provider: 'gcp-storage',
        bucket: '',
        projectId: '',
        keyFilename: '',
        encryption: {
          enabled: true
        }
      },
      'sharepoint': {
        provider: 'sharepoint',
        siteUrl: '',
        libraryName: '',
        tenantId: '',
        clientId: '',
        clientSecret: ''
      },
      'local-sftp': {
        provider: 'local-sftp',
        host: 'localhost',
        port: 22,
        username: '',
        password: '',
        basePath: '/uploads'
      },
      'local-https': {
        provider: 'local-https',
        basePath: './uploads',
        maxFileSize: '50MB'
      }
    };
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error generating configuration template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate configuration template'
    });
  }
});

/**
 * GET /api/storage-settings/compliance/:provider
 * Get compliance recommendations for provider
 */
router.get('/compliance/:provider', (req, res) => {
  try {
    const provider = req.params.provider;
    const recommendations = storageSettingsService.getComplianceRecommendations(provider);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting compliance recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compliance recommendations'
    });
  }
});

/**
 * GET /api/storage-settings/:id/capabilities
 * Get storage provider capabilities
 */
router.get('/:id/capabilities', async (req, res) => {
  try {
    const configId = req.params.id;
    const capabilities = storageSettingsService.getProviderCapabilities(configId);
    
    if (!capabilities) {
      return res.status(404).json({
        success: false,
        error: 'Storage provider not found or not initialized'
      });
    }
    
    res.json({
      success: true,
      data: capabilities
    });
  } catch (error) {
    console.error('Error getting provider capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider capabilities'
    });
  }
});

export default router;
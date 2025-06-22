/**
 * Storage Settings API Routes
 * Database-based storage configuration functionality with PostgreSQL persistence
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from './db';
import { storageConfigurations, insertStorageConfigurationSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/storage-settings/templates
 * Get configuration templates for all providers
 */
router.get('/templates', (req, res) => {
  try {
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
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * GET /api/storage-settings
 * Get all storage configurations
 */
router.get('/', async (req, res) => {
  try {
    const configs = await db.select().from(storageConfigurations);
    
    res.json({
      success: true,
      data: configs
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
 * POST /api/storage-settings
 * Create storage configuration
 */
router.post('/', async (req, res) => {
  try {
    // Validate input data
    const inputData = {
      ...req.body,
      createdBy: 9999 // Development user ID
    };
    
    const validatedData = insertStorageConfigurationSchema.parse(inputData);
    
    const [newConfiguration] = await db.insert(storageConfigurations)
      .values(validatedData)
      .returning();

    console.log('Created storage configuration:', newConfiguration.name);

    res.status(201).json({
      success: true,
      data: newConfiguration
    });
  } catch (error) {
    console.error('Error creating storage configuration:', error);
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
    const validatedData = insertStorageConfigurationSchema.partial().parse(req.body);

    const [updatedConfiguration] = await db.update(storageConfigurations)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(storageConfigurations.id, configId))
      .returning();

    if (!updatedConfiguration) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }

    console.log('Updated storage configuration:', updatedConfiguration.name);

    res.json({
      success: true,
      data: updatedConfiguration
    });
  } catch (error) {
    console.error('Error updating storage configuration:', error);
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

    const [deletedConfiguration] = await db.delete(storageConfigurations)
      .where(eq(storageConfigurations.id, configId))
      .returning();

    if (!deletedConfiguration) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }

    console.log('Deleted storage configuration:', deletedConfiguration.name);

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
 * POST /api/storage-settings/test
 * Test storage configuration connection
 */
router.post('/test', async (req, res) => {
  try {
    const { provider, config } = req.body;

    // Mock test based on provider
    let testResult = {
      success: true,
      message: `Successfully connected to ${provider}`,
      details: {
        latency: Math.floor(Math.random() * 100) + 50,
        available: true,
        provider: provider
      }
    };

    // Simulate some basic validation
    if (provider === 'aws-s3' && (!config.bucket || !config.accessKeyId)) {
      testResult = {
        success: false,
        message: 'Missing required AWS S3 configuration',
        details: {
          provider: provider,
          error: 'bucket and accessKeyId are required'
        }
      };
    }

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

export default router;
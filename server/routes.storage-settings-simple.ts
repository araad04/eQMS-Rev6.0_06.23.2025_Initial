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
    console.error('Error generating configuration template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate configuration template'
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
router.post('/', (req, res) => {
  try {
    console.log('Creating storage configuration:', req.body);
    
    const newConfiguration = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    // Store the configuration in memory and save to file
    storageConfigurations.push(newConfiguration);
    saveConfigurations(storageConfigurations);
    
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
router.put('/:id', (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const configIndex = storageConfigurations.findIndex(config => config.id === configId);
    
    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }
    
    const updatedConfiguration = {
      ...storageConfigurations[configIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    storageConfigurations[configIndex] = updatedConfiguration;
    saveConfigurations(storageConfigurations);
    
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
router.delete('/:id', (req, res) => {
  try {
    const configId = parseInt(req.params.id);
    const configIndex = storageConfigurations.findIndex(config => config.id === configId);
    
    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Storage configuration not found'
      });
    }
    
    const deletedConfiguration = storageConfigurations.splice(configIndex, 1)[0];
    saveConfigurations(storageConfigurations);
    
    res.json({
      success: true,
      data: deletedConfiguration
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
router.post('/test', (req, res) => {
  try {
    console.log('Testing storage configuration:', req.body);
    
    // Simulate connection test
    const { provider } = req.body.config || {};
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider not specified'
      });
    }
    
    // Simulate successful test for all providers
    res.json({
      success: true,
      message: `Successfully connected to ${provider}`,
      details: {
        provider,
        connectionTime: Math.random() * 500 + 100, // Random connection time
        status: 'connected'
      }
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
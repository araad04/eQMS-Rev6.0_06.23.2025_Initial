import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { trainingRouter } from '../routes.training';
import { pool } from '../db';

const app = express();
app.use(express.json());
app.use('/api/training', trainingRouter);

describe('Training Routes - ISO 13485:2016 Compliance Tests', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM training_records WHERE id > 0');
    await pool.query('DELETE FROM training_modules WHERE name LIKE $1', ['%TEST%']);
  });

  afterEach(async () => {
    await pool.query('DELETE FROM training_records WHERE id > 0');
    await pool.query('DELETE FROM training_modules WHERE name LIKE $1', ['%TEST%']);
  });

  describe('GET /api/training/records - List Training Records', () => {
    it('should return empty array when no records exist', async () => {
      const response = await request(app)
        .get('/api/training/records')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return training records with proper structure', async () => {
      // Create test training module first
      const moduleResponse = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send({
          name: 'TEST ISO 13485:2016 Overview',
          description: 'Test training module for compliance verification',
          type: 'Regulatory',
          valid_period: 365
        })
        .expect(201);

      const moduleId = moduleResponse.body.id;

      // Create test training record
      const recordResponse = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send({
          moduleId: moduleId,
          userId: 9999,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          comments: 'TEST training assignment for compliance validation'
        })
        .expect(201);

      const response = await request(app)
        .get('/api/training/records')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      const record = response.body[0];
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('user_id');
      expect(record).toHaveProperty('module_id');
      expect(record).toHaveProperty('status');
      expect(record).toHaveProperty('assigned_date');
    });

    it('should filter records by user ID', async () => {
      const response = await request(app)
        .get('/api/training/records?userId=9999')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter records by status', async () => {
      const response = await request(app)
        .get('/api/training/records?status=assigned')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/training/modules - List Training Modules', () => {
    it('should return empty array when no modules exist', async () => {
      const response = await request(app)
        .get('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return training modules with proper structure', async () => {
      const testModule = {
        name: 'TEST CAPA Management Training',
        description: 'Test training module for CAPA process compliance',
        type: 'Compliance',
        valid_period: 365
      };

      await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(testModule)
        .expect(201);

      const response = await request(app)
        .get('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      const module = response.body[0];
      expect(module).toHaveProperty('id');
      expect(module).toHaveProperty('name');
      expect(module).toHaveProperty('type');
      expect(module).toHaveProperty('valid_period');
      expect(module).toHaveProperty('created_at');
    });
  });

  describe('POST /api/training/modules - Create Training Module', () => {
    it('should create new training module with valid data', async () => {
      const newModule = {
        name: 'TEST Document Control Training',
        description: 'Test training module for document control procedures',
        type: 'Technical',
        valid_period: 730
      };

      const response = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(newModule)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newModule.name);
      expect(response.body.type).toBe(newModule.type);
      expect(response.body.valid_period).toBe(newModule.valid_period);
    });

    it('should validate required fields', async () => {
      const invalidModule = {
        description: 'Missing required name field'
      };

      const response = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(invalidModule)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate training type enum values', async () => {
      const invalidModule = {
        name: 'TEST Invalid Type Module',
        description: 'Test module with invalid type',
        type: 'InvalidType',
        valid_period: 365
      };

      const response = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(invalidModule)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should sanitize input data to prevent XSS', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>TEST Module',
        description: '<img src=x onerror=alert("xss")>Description',
        type: 'Technical',
        valid_period: 365
      };

      const response = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(maliciousData)
        .expect(201);

      expect(response.body.name).not.toContain('<script>');
      expect(response.body.description).not.toContain('<img');
    });
  });

  describe('POST /api/training/assign - Assign Training', () => {
    it('should assign training to user with valid data', async () => {
      // Create test module first
      const moduleResponse = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send({
          name: 'TEST Assignment Module',
          description: 'Test module for assignment validation',
          type: 'Regulatory',
          valid_period: 365
        })
        .expect(201);

      const moduleId = moduleResponse.body.id;

      const assignmentData = {
        moduleId: moduleId,
        userId: 9999,
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        comments: 'TEST training assignment for compliance verification'
      };

      const response = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send(assignmentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.user_id).toBe(assignmentData.userId);
      expect(response.body.module_id).toBe(moduleId);
      expect(response.body.status).toBe('assigned');
    });

    it('should validate required assignment fields', async () => {
      const invalidAssignment = {
        userId: 9999
        // Missing moduleId and dueDate
      };

      const response = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send(invalidAssignment)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate module exists before assignment', async () => {
      const invalidAssignment = {
        moduleId: 99999, // Non-existent module
        userId: 9999,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send(invalidAssignment)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/training/records/:id - Update Training Record', () => {
    it('should update training record status', async () => {
      // Create module and assignment first
      const moduleResponse = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send({
          name: 'TEST Update Module',
          description: 'Test module for update validation',
          type: 'Process',
          valid_period: 365
        })
        .expect(201);

      const assignmentResponse = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send({
          moduleId: moduleResponse.body.id,
          userId: 9999,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      const recordId = assignmentResponse.body.id;

      const updateData = {
        status: 'completed',
        score: 95,
        completed_date: new Date().toISOString(),
        comments: 'TEST training completed successfully'
      };

      const response = await request(app)
        .put(`/api/training/records/${recordId}`)
        .set('X-Auth-Local', 'true')
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.score).toBe(95);
      expect(response.body.completed_date).toBeTruthy();
    });

    it('should return 404 for non-existent record', async () => {
      const updateData = {
        status: 'completed'
      };

      const response = await request(app)
        .put('/api/training/records/99999')
        .set('X-Auth-Local', 'true')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate status transitions', async () => {
      // Create record first
      const moduleResponse = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send({
          name: 'TEST Status Module',
          description: 'Test module for status validation',
          type: 'Compliance',
          valid_period: 365
        })
        .expect(201);

      const assignmentResponse = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send({
          moduleId: moduleResponse.body.id,
          userId: 9999,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      const recordId = assignmentResponse.body.id;

      const invalidUpdate = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .put(`/api/training/records/${recordId}`)
        .set('X-Auth-Local', 'true')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Security and Authorization Tests', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/training/records')
        .expect(401);

      await request(app)
        .post('/api/training/modules')
        .send({})
        .expect(401);

      await request(app)
        .post('/api/training/assign')
        .send({})
        .expect(401);
    });

    it('should prevent unauthorized access to training management', async () => {
      const response = await request(app)
        .post('/api/training/modules')
        .send({
          name: 'Unauthorized Module',
          type: 'Technical'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Audit Trail and Compliance Tests', () => {
    it('should maintain audit trail for training lifecycle', async () => {
      const testModule = {
        name: 'TEST Audit Trail Module',
        description: 'Test module for audit trail validation',
        type: 'Regulatory',
        valid_period: 365
      };

      const moduleResponse = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(testModule)
        .expect(201);

      expect(moduleResponse.body).toHaveProperty('created_at');
      expect(new Date(moduleResponse.body.created_at)).toBeInstanceOf(Date);
      expect(moduleResponse.body).toHaveProperty('created_by');

      const assignmentResponse = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send({
          moduleId: moduleResponse.body.id,
          userId: 9999,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      expect(assignmentResponse.body).toHaveProperty('assigned_date');
      expect(assignmentResponse.body).toHaveProperty('assigned_by');
    });

    it('should enforce ISO 13485:2016 training requirements', async () => {
      const iso13485Module = {
        name: 'TEST ISO 13485:2016 Training Requirements',
        description: 'Training per ISO 13485:2016 clause 6.2 competence requirements',
        type: 'Regulatory',
        valid_period: 365
      };

      const response = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(iso13485Module)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('Regulatory');
      expect(response.body.valid_period).toBe(365);
      expect(response.body.description).toContain('ISO 13485:2016');
    });

    it('should track training effectiveness and competency', async () => {
      // Create module and complete training
      const moduleResponse = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send({
          name: 'TEST Competency Tracking',
          description: 'Test module for competency validation',
          type: 'Technical',
          valid_period: 365
        })
        .expect(201);

      const assignmentResponse = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send({
          moduleId: moduleResponse.body.id,
          userId: 9999,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      const recordId = assignmentResponse.body.id;

      const completionData = {
        status: 'completed',
        score: 85,
        completed_date: new Date().toISOString(),
        comments: 'Demonstrated competency in technical procedures'
      };

      const updateResponse = await request(app)
        .put(`/api/training/records/${recordId}`)
        .set('X-Auth-Local', 'true')
        .send(completionData)
        .expect(200);

      expect(updateResponse.body.status).toBe('completed');
      expect(updateResponse.body.score).toBe(85);
      expect(updateResponse.body.completed_date).toBeTruthy();

      // Verify training effectiveness tracking
      expect(updateResponse.body.score).toBeGreaterThanOrEqual(80); // Competency threshold
    });

    it('should enforce training validity periods', async () => {
      const moduleWithShortValidity = {
        name: 'TEST Short Validity Training',
        description: 'Test module with short validity period',
        type: 'Process',
        valid_period: 30 // 30 days only
      };

      const response = await request(app)
        .post('/api/training/modules')
        .set('X-Auth-Local', 'true')
        .send(moduleWithShortValidity)
        .expect(201);

      expect(response.body.valid_period).toBe(30);

      // Assignment should calculate expiry based on validity period
      const assignmentResponse = await request(app)
        .post('/api/training/assign')
        .set('X-Auth-Local', 'true')
        .send({
          moduleId: response.body.id,
          userId: 9999,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      // Complete the training to set expiry date
      const completionData = {
        status: 'completed',
        score: 90,
        completed_date: new Date().toISOString()
      };

      const updateResponse = await request(app)
        .put(`/api/training/records/${assignmentResponse.body.id}`)
        .set('X-Auth-Local', 'true')
        .send(completionData)
        .expect(200);

      expect(updateResponse.body.expiry_date).toBeTruthy();

      // Verify expiry date is calculated correctly based on validity period
      const expiryDate = new Date(updateResponse.body.expiry_date);
      const completedDate = new Date(updateResponse.body.completed_date);
      const daysDifference = Math.ceil((expiryDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDifference).toBe(30);
    });
  });
});
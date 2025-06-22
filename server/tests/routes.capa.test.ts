import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { capaRouter } from '../routes.capa';
import { pool } from '../db';

const app = express();
app.use(express.json());
app.use('/api/capa', capaRouter);

describe('CAPA Routes - ISO 13485:2016 Compliance Tests', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM capa WHERE title LIKE $1', ['%TEST%']);
  });

  afterEach(async () => {
    await pool.query('DELETE FROM capa WHERE title LIKE $1', ['%TEST%']);
  });

  describe('GET /api/capa - List CAPAs', () => {
    it('should return empty array when no CAPAs exist', async () => {
      const response = await request(app)
        .get('/api/capa')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return CAPAs with proper structure', async () => {
      const testCapa = {
        title: 'TEST CAPA - Compliance Verification',
        description: 'Test CAPA for regulatory compliance validation',
        category: 'audit_finding',
        priority: 'medium',
        source: 'internal_audit',
        assigned_to: 'Quality Team',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await request(app)
        .post('/api/capa')
        .set('X-Auth-Local', 'true')
        .send(testCapa)
        .expect(201);

      const response = await request(app)
        .get('/api/capa')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      const capa = response.body[0];
      expect(capa).toHaveProperty('id');
      expect(capa).toHaveProperty('title');
      expect(capa).toHaveProperty('status');
      expect(capa).toHaveProperty('priority');
      expect(capa).toHaveProperty('created_at');
    });
  });

  describe('POST /api/capa - Create CAPA', () => {
    it('should create new CAPA with valid data', async () => {
      const newCapa = {
        title: 'TEST CAPA - Creation Validation',
        description: 'Test CAPA for creation endpoint validation',
        category: 'customer_complaint',
        priority: 'high',
        source: 'customer_feedback',
        assigned_to: 'Engineering Team',
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/capa')
        .set('X-Auth-Local', 'true')
        .send(newCapa)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newCapa.title);
      expect(response.body.status).toBe('open');
      expect(response.body.priority).toBe(newCapa.priority);
    });

    it('should validate required fields', async () => {
      const invalidCapa = {
        description: 'Missing required title field'
      };

      const response = await request(app)
        .post('/api/capa')
        .set('X-Auth-Local', 'true')
        .send(invalidCapa)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should sanitize input data to prevent XSS', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>TEST CAPA',
        description: '<img src=x onerror=alert("xss")>Description',
        category: 'audit_finding',
        priority: 'medium',
        source: 'internal_audit',
        assigned_to: 'Quality Team',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/capa')
        .set('X-Auth-Local', 'true')
        .send(maliciousData)
        .expect(201);

      expect(response.body.title).not.toContain('<script>');
      expect(response.body.description).not.toContain('<img');
    });
  });

  describe('Security and Authorization Tests', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/capa')
        .expect(401);

      await request(app)
        .post('/api/capa')
        .send({})
        .expect(401);
    });
  });

  describe('Audit Trail and Compliance Tests', () => {
    it('should maintain audit trail for CAPA lifecycle', async () => {
      const testCapa = {
        title: 'TEST CAPA - Audit Trail',
        description: 'Test CAPA for audit trail validation',
        category: 'audit_finding',
        priority: 'high',
        source: 'regulatory_inspection',
        assigned_to: 'Quality Team',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const createResponse = await request(app)
        .post('/api/capa')
        .set('X-Auth-Local', 'true')
        .send(testCapa)
        .expect(201);

      expect(createResponse.body).toHaveProperty('created_at');
      expect(new Date(createResponse.body.created_at)).toBeInstanceOf(Date);
    });

    it('should enforce ISO 13485:2016 CAPA requirements', async () => {
      const iso13485Capa = {
        title: 'TEST CAPA - ISO 13485:2016 Compliance',
        description: 'Root cause analysis required per ISO 13485:2016 clause 8.5.2',
        category: 'nonconformity',
        priority: 'high',
        source: 'quality_review',
        assigned_to: 'Quality Manager',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/capa')
        .set('X-Auth-Local', 'true')
        .send(iso13485Capa)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.category).toBe('nonconformity');
      expect(response.body.priority).toBe('high');
    });
  });
});
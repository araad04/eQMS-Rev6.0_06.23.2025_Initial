import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { managementReviewRouter } from '../routes.management-review';
import { pool } from '../db';

const app = express();
app.use(express.json());
app.use('/api/management-reviews', managementReviewRouter);

describe('Management Review Routes - ISO 13485:2016 Compliance Tests', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM management_reviews WHERE title LIKE $1', ['%TEST%']);
    await pool.query('DELETE FROM management_review_inputs WHERE title LIKE $1', ['%TEST%']);
    await pool.query('DELETE FROM management_review_actions WHERE title LIKE $1', ['%TEST%']);
  });

  afterEach(async () => {
    await pool.query('DELETE FROM management_reviews WHERE title LIKE $1', ['%TEST%']);
    await pool.query('DELETE FROM management_review_inputs WHERE title LIKE $1', ['%TEST%']);
    await pool.query('DELETE FROM management_review_actions WHERE title LIKE $1', ['%TEST%']);
  });

  describe('GET /api/management-reviews - List Management Reviews', () => {
    it('should return empty array when no reviews exist', async () => {
      const response = await request(app)
        .get('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return management reviews with proper structure', async () => {
      const testReview = {
        title: 'TEST Management Review - Q1 2025',
        description: 'Test management review for regulatory compliance validation',
        review_type: 'standard',
        review_date: new Date().toISOString(),
        scope: 'Quality management system effectiveness review',
        purpose: 'Ensure continuing suitability, adequacy, and effectiveness'
      };

      await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(testReview)
        .expect(201);

      const response = await request(app)
        .get('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      const review = response.body[0];
      expect(review).toHaveProperty('id');
      expect(review).toHaveProperty('title');
      expect(review).toHaveProperty('status');
      expect(review).toHaveProperty('review_type');
      expect(review).toHaveProperty('createdAt');
    });

    it('should filter reviews by status parameter', async () => {
      const response = await request(app)
        .get('/api/management-reviews?status=scheduled')
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/management-reviews - Create Management Review', () => {
    it('should create new management review with valid data', async () => {
      const newReview = {
        title: 'TEST Management Review - Creation Validation',
        description: 'Test management review for creation endpoint validation',
        review_type: 'extraordinary',
        review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        scope: 'Emergency review of quality management system',
        purpose: 'Address critical quality issues identified in audit'
      };

      const response = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(newReview)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newReview.title);
      expect(response.body.status).toBe('scheduled');
      expect(response.body.review_type).toBe(newReview.review_type);
    });

    it('should validate required fields', async () => {
      const invalidReview = {
        description: 'Missing required title field'
      };

      const response = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(invalidReview)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate review_type enum values', async () => {
      const invalidReview = {
        title: 'TEST Management Review - Invalid Type',
        description: 'Test review with invalid type',
        review_type: 'invalid_type',
        review_date: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(invalidReview)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should sanitize input data to prevent XSS', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>TEST Review',
        description: '<img src=x onerror=alert("xss")>Description',
        review_type: 'standard',
        review_date: new Date().toISOString(),
        scope: '<script>malicious</script>Scope',
        purpose: 'Test purpose'
      };

      const response = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(maliciousData)
        .expect(201);

      expect(response.body.title).not.toContain('<script>');
      expect(response.body.description).not.toContain('<img');
      expect(response.body.scope).not.toContain('<script>');
    });
  });

  describe('GET /api/management-reviews/:id - Get Management Review by ID', () => {
    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .get('/api/management-reviews/99999')
        .set('X-Auth-Local', 'true')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Management review not found');
    });

    it('should return review details for valid ID', async () => {
      const testReview = {
        title: 'TEST Management Review - Retrieval Test',
        description: 'Test review for ID-based retrieval validation',
        review_type: 'standard',
        review_date: new Date().toISOString(),
        scope: 'Complete QMS review',
        purpose: 'Annual management review per ISO 13485:2016'
      };

      const createResponse = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(testReview)
        .expect(201);

      const reviewId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/management-reviews/${reviewId}`)
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('id', reviewId);
      expect(response.body).toHaveProperty('title', testReview.title);
      expect(response.body).toHaveProperty('scope', testReview.scope);
    });
  });

  describe('POST /api/management-reviews/:id/generate-actions - Generate Action Items', () => {
    it('should generate action items from review inputs', async () => {
      const testReview = {
        title: 'TEST Management Review - Action Generation',
        description: 'Test review for action generation validation',
        review_type: 'standard',
        review_date: new Date().toISOString(),
        scope: 'Quality management system review',
        purpose: 'Generate automated action items'
      };

      const createResponse = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(testReview)
        .expect(201);

      const reviewId = createResponse.body.id;

      // Add test inputs
      const testInput = {
        category: 'audit_results',
        title: 'TEST Audit Finding',
        description: 'Critical nonconformity found in document control process',
        data: JSON.stringify({ severity: 'major', department: 'Quality' }),
        source: 'internal_audit'
      };

      await request(app)
        .post(`/api/management-reviews/${reviewId}/inputs`)
        .set('X-Auth-Local', 'true')
        .send(testInput)
        .expect(201);

      const response = await request(app)
        .post(`/api/management-reviews/${reviewId}/generate-actions`)
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('actions');
      expect(response.body.actions).toBeInstanceOf(Array);
      expect(response.body.actions.length).toBeGreaterThan(0);

      const action = response.body.actions[0];
      expect(action).toHaveProperty('title');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('priority');
      expect(action).toHaveProperty('assignedTo');
      expect(action).toHaveProperty('dueDate');
    });

    it('should handle empty inputs gracefully', async () => {
      const testReview = {
        title: 'TEST Management Review - Empty Inputs',
        description: 'Test review with no inputs',
        review_type: 'standard',
        review_date: new Date().toISOString()
      };

      const createResponse = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(testReview)
        .expect(201);

      const reviewId = createResponse.body.id;

      const response = await request(app)
        .post(`/api/management-reviews/${reviewId}/generate-actions`)
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('actions');
      expect(response.body.actions).toBeInstanceOf(Array);
    });
  });

  describe('Security and Authorization Tests', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/management-reviews')
        .expect(401);

      await request(app)
        .post('/api/management-reviews')
        .send({})
        .expect(401);
    });

    it('should prevent unauthorized access to sensitive operations', async () => {
      const response = await request(app)
        .post('/api/management-reviews/1/generate-actions')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Audit Trail and Compliance Tests', () => {
    it('should maintain audit trail for management review lifecycle', async () => {
      const testReview = {
        title: 'TEST Management Review - Audit Trail',
        description: 'Test review for audit trail validation',
        review_type: 'standard',
        review_date: new Date().toISOString(),
        scope: 'Complete quality management system review',
        purpose: 'ISO 13485:2016 clause 5.6 compliance verification'
      };

      const createResponse = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(testReview)
        .expect(201);

      expect(createResponse.body).toHaveProperty('createdAt');
      expect(new Date(createResponse.body.createdAt)).toBeInstanceOf(Date);
      expect(createResponse.body).toHaveProperty('created_by');
    });

    it('should enforce ISO 13485:2016 management review requirements', async () => {
      const iso13485Review = {
        title: 'TEST Management Review - ISO 13485:2016 Compliance',
        description: 'Management review per ISO 13485:2016 clause 5.6 requirements',
        review_type: 'standard',
        review_date: new Date().toISOString(),
        scope: 'Continuing suitability, adequacy, and effectiveness of QMS',
        purpose: 'Review QMS performance and improvement opportunities'
      };

      const response = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(iso13485Review)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.review_type).toBe('standard');
      expect(response.body.status).toBe('scheduled');
      expect(response.body.scope).toContain('QMS');
    });

    it('should validate intelligent action generation algorithm', async () => {
      const testReview = {
        title: 'TEST Management Review - Intelligence Validation',
        description: 'Validate intelligent action generation capabilities',
        review_type: 'standard',
        review_date: new Date().toISOString()
      };

      const createResponse = await request(app)
        .post('/api/management-reviews')
        .set('X-Auth-Local', 'true')
        .send(testReview)
        .expect(201);

      const reviewId = createResponse.body.id;

      // Add multiple input categories to test cross-category analysis
      const inputs = [
        {
          category: 'audit_results',
          title: 'TEST Major Nonconformity',
          description: 'Critical finding in design control process',
          data: JSON.stringify({ severity: 'major', clause: '7.3' }),
          source: 'external_audit'
        },
        {
          category: 'customer_feedback',
          title: 'TEST Customer Complaint Trend',
          description: 'Increasing complaints about device performance',
          data: JSON.stringify({ trend: 'increasing', impact: 'high' }),
          source: 'complaint_system'
        },
        {
          category: 'process_performance',
          title: 'TEST Process KPI Deviation',
          description: 'Manufacturing yield below target',
          data: JSON.stringify({ metric: 'yield', deviation: '15%' }),
          source: 'manufacturing'
        }
      ];

      for (const input of inputs) {
        await request(app)
          .post(`/api/management-reviews/${reviewId}/inputs`)
          .set('X-Auth-Local', 'true')
          .send(input)
          .expect(201);
      }

      const response = await request(app)
        .post(`/api/management-reviews/${reviewId}/generate-actions`)
        .set('X-Auth-Local', 'true')
        .expect(200);

      expect(response.body.actions.length).toBeGreaterThan(0);
      
      // Verify intelligent prioritization
      const criticalActions = response.body.actions.filter((action: any) => action.priority === 'Critical');
      expect(criticalActions.length).toBeGreaterThan(0);

      // Verify department assignment logic
      const qualityActions = response.body.actions.filter((action: any) => action.assignedTo === 'Quality');
      expect(qualityActions.length).toBeGreaterThan(0);

      // Verify ISO clause mapping
      const actions = response.body.actions;
      const hasISOMapping = actions.some((action: any) => action.description.includes('ISO 13485:2016'));
      expect(hasISOMapping).toBe(true);
    });
  });
});
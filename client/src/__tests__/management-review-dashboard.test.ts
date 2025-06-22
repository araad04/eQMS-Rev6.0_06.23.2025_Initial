import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../server/db';
import { ManagementReviewStorage } from '../../server/storage.management-review';
import { managementReviews } from '../../shared/schema';

// Initialize storage instance
const storage = new ManagementReviewStorage();

describe('Management Review Dashboard Tests', () => {
  beforeEach(async () => {
    // Clean up existing test data before each test
    await db.delete(managementReviews).where(() => true);
  });

  afterEach(async () => {
    // Clean up after tests
    await db.delete(managementReviews).where(() => true);
  });

  it('should retrieve dashboard data with empty reviews', async () => {
    const dashboardData = await storage.getDashboardData();
    expect(dashboardData).toBeDefined();
    expect(dashboardData.totalReviews).toBe(0);
    expect(dashboardData.upcomingReviews).toEqual([]);
    expect(dashboardData.recentReviews).toEqual([]);
  });

  it('should properly create and retrieve a management review with scheduled_by', async () => {
    // Create a test review
    const testReview = {
      title: 'Test Review',
      description: 'Test Description',
      review_date: new Date('2025-12-25'),
      review_type: 'annual',
      status: 'scheduled',
      created_by: 1,
      scheduled_by: 1
    };

    // Insert the test review
    const createdReview = await storage.createReview(testReview);
    
    expect(createdReview).toBeDefined();
    expect(createdReview.title).toBe('Test Review');
    expect(createdReview.scheduled_by).toBe(1);
    
    // Test dashboard data with the new review
    const dashboardData = await storage.getDashboardData();
    expect(dashboardData.totalReviews).toBe(1);
    expect(dashboardData.scheduledReviews).toBe(1);
    expect(dashboardData.upcomingReviews.length).toBe(1);
  });

  it('should handle different review statuses in dashboard data', async () => {
    // Create reviews with different statuses
    const testReviews = [
      {
        title: 'Scheduled Review',
        description: 'Test Description',
        review_date: new Date('2025-12-25'),
        review_type: 'annual',
        status: 'scheduled',
        created_by: 1,
        scheduled_by: 1
      },
      {
        title: 'In-Progress Review',
        description: 'Test Description',
        review_date: new Date('2025-10-15'),
        review_type: 'quarterly',
        status: 'in-progress',
        created_by: 1,
        scheduled_by: 2
      },
      {
        title: 'Completed Review',
        description: 'Test Description',
        review_date: new Date('2025-05-01'),
        review_type: 'special',
        status: 'completed',
        created_by: 2,
        scheduled_by: 1
      }
    ];

    // Insert test reviews
    for (const review of testReviews) {
      await storage.createReview(review);
    }
    
    // Test dashboard data with multiple reviews
    const dashboardData = await storage.getDashboardData();
    expect(dashboardData.totalReviews).toBe(3);
    expect(dashboardData.scheduledReviews).toBe(1);
    expect(dashboardData.inProgressReviews).toBe(1);
    expect(dashboardData.completedReviews).toBe(1);
  });
});
import { type ManagementReview, type InsertManagementReview, managementReviews } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { generateManagementReviewNumber } from "./utils/number-generator";

/**
 * Specialized storage implementation for management review functionality
 */
export class ManagementReviewStorage {
  /**
   * Creates a new management review with auto-generated review number
   * @param reviewData Management review data to insert
   * @returns Created management review object
   */
  async createReview(reviewData: InsertManagementReview): Promise<ManagementReview> {
    try {
      // Process field name mapping and ensure we only use fields that exist in the database
      // Generate a review number automatically in format MR-YYYY-XXX
      const reviewNumber = await generateManagementReviewNumber();
      
      // Generate smart title if autoNumbering is true or title is empty
      let title = reviewData.title;
      if (reviewData.autoNumbering === true || !title || title.trim() === '') {
        const reviewDate = reviewData.review_date ? 
          (typeof reviewData.review_date === 'string' ? new Date(reviewData.review_date) : reviewData.review_date) : 
          (reviewData.reviewDate ? new Date(reviewData.reviewDate) : new Date());
          
        const reviewType = (reviewData.review_type || reviewData.reviewType || 'standard').toLowerCase();
        
        // Format based on review type 
        if (reviewType === 'annual') {
          title = `Annual Management Review ${reviewDate.getFullYear()}`;
        } else {
          const month = reviewDate.getMonth();
          const quarter = Math.floor(month / 3) + 1;
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'];
          
          // If beginning of quarter, use quarter format
          const isStartOfQuarter = month % 3 === 0 && reviewDate.getDate() <= 15;
          if (isStartOfQuarter) {
            title = `Q${quarter} ${reviewDate.getFullYear()} `;
          } else {
            title = `${monthNames[month]} ${reviewDate.getFullYear()} `;
          }
          
          // Add review type to title (if not 'standard')
          if (reviewType !== 'standard') {
            title += `${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)} `;
          }
          
          title += 'Management Review';
        }
      }
      
      // Prepare the data object with only valid fields from the database schema
      const dataToInsert = {
        title: title || `${reviewNumber} Management Review`, // Store the review number in the title
        review_type: reviewData.review_type || reviewData.reviewType || 'standard',
        review_date: reviewData.review_date || reviewData.reviewDate || new Date(),
        status: reviewData.status || 'scheduled',
        description: reviewData.description,
        created_by: reviewData.created_by,
        scheduled_by: reviewData.scheduled_by || reviewData.created_by,
        purpose: reviewData.purpose,
        scope: reviewData.scope,
        minutes: reviewData.minutes,
        conclusion: reviewData.conclusion,
        approval_date: reviewData.approval_date
      };
      
      const [createdReview] = await db
        .insert(managementReviews)
        .values(dataToInsert)
        .returning();
        
      console.log(`Created management review with id ${createdReview.id}: "${title}" (using number format ${reviewNumber})`);
      return createdReview;
    } catch (error) {
      console.error("Error creating management review:", error);
      throw error;
    }
  }
  
  /**
   * Gets all management reviews with optional filtering
   * @param params Optional filter parameters
   * @returns Array of management reviews
   */
  async getReviews(): Promise<ManagementReview[]> {
    try {
      // Explicitly select only the columns that exist in the database
      return await db
        .select({
          id: managementReviews.id,
          title: managementReviews.title,
          description: managementReviews.description,
          status: managementReviews.status,
          review_type: managementReviews.review_type,
          review_date: managementReviews.review_date,
          approval_date: managementReviews.approval_date,
          created_by: managementReviews.created_by,
          scheduled_by: managementReviews.scheduled_by,
          purpose: managementReviews.purpose,
          scope: managementReviews.scope,
          minutes: managementReviews.minutes,
          conclusion: managementReviews.conclusion,
          creation_date: managementReviews.creation_date,
          // Fields below are commented out as they don't exist in the actual database schema
          // invite_sent: managementReviews.invite_sent,
          // reminder_sent: managementReviews.reminder_sent,
          createdAt: managementReviews.createdAt,
          updatedAt: managementReviews.updatedAt
        })
        .from(managementReviews)
        .orderBy(sql`${managementReviews.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching management reviews:", error);
      throw error;
    }
  }
  
  /**
   * Gets a single management review by ID
   * @param id Review ID to fetch
   * @returns Management review or undefined if not found
   */
  async getReviewById(id: number): Promise<ManagementReview | undefined> {
    try {
      const [review] = await db
        .select()
        .from(managementReviews)
        .where(eq(managementReviews.id, id))
        .limit(1);
        
      return review;
    } catch (error) {
      console.error(`Error fetching management review ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Updates a management review
   * @param id Review ID to update
   * @param reviewData Updated review data
   * @returns Updated management review
   */
  async updateReview(id: number, reviewData: Partial<ManagementReview>): Promise<ManagementReview | undefined> {
    try {
      // Prepare a clean data object with only valid fields from the database schema
      const dataToUpdate = {
        title: reviewData.title,
        review_type: reviewData.review_type || reviewData.reviewType,
        review_date: reviewData.review_date || reviewData.reviewDate,
        status: reviewData.status,
        description: reviewData.description,
        minutes: reviewData.minutes,
        conclusion: reviewData.conclusion,
        approval_date: reviewData.approval_date,
        updatedAt: new Date()
      };
      
      // Filter out undefined values to only update fields that were provided
      const filteredData = Object.fromEntries(
        Object.entries(dataToUpdate).filter(([_, v]) => v !== undefined)
      );
      
      const [updatedReview] = await db
        .update(managementReviews)
        .set(filteredData)
        .where(eq(managementReviews.id, id))
        .returning();
        
      return updatedReview;
    } catch (error) {
      console.error(`Error updating management review ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes a management review by ID
   * @param id The ID of the management review to delete
   * @returns True if the review was deleted successfully
   */
  async deleteReview(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(managementReviews)
        .where(eq(managementReviews.id, id))
        .returning({ id: managementReviews.id });
      
      const wasDeleted = result.length > 0;
      
      if (wasDeleted) {
        console.log(`Successfully deleted management review with ID ${id}`);
      } else {
        console.warn(`No management review found with ID ${id} to delete`);
      }
      
      return wasDeleted;
    } catch (error) {
      console.error(`Error deleting management review ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Gets management reviews for dashboard display
   * @returns Dashboard data including reviews and counts
   */
  async getDashboardData() {
    try {
      // Get reviews with explicit column selection to avoid presentation_file error
      const reviews = await this.getReviews();
      
      // Calculate counts for dashboard
      const totalReviews = reviews.length;
      const completedReviews = reviews.filter(r => r.status === 'completed').length;
      const scheduledReviews = reviews.filter(r => r.status === 'scheduled').length;
      const inProgressReviews = reviews.filter(r => r.status === 'in-progress').length;
      
      // Get upcoming reviews (scheduled with future date)
      const now = new Date();
      const upcomingReviews = reviews
        .filter(r => r.status === 'scheduled' && r.review_date && new Date(r.review_date) > now)
        .sort((a, b) => {
          if (!a.review_date || !b.review_date) return 0;
          return new Date(a.review_date).getTime() - new Date(b.review_date).getTime();
        })
        .slice(0, 5) // Get top 5 upcoming
        .map(review => ({
          ...review,
          // Add compatibility properties for frontend
          reviewDate: review.review_date,
          id: review.id
        }));
      
      // Get recent reviews (created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // For recently completed reviews, we need to include completionDate
      const recentReviews = reviews
        .filter(r => r.status === 'completed' && new Date(r.createdAt) > thirtyDaysAgo)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5) // Get 5 most recent
        .map(review => ({
          ...review,
          // Add completionDate property expected by frontend
          completionDate: review.approval_date || review.updatedAt,
          // Mock participants data (should be replaced with actual data from another table)
          participants: [
            { name: "Quality Manager" },
            { name: "Operations Director" },
            { name: "R&D Manager" }
          ],
          actionItemCount: 0 // This should be populated from a related table
        }));
      
      return {
        upcomingReviews,
        recentReviews,
        totalReviews,
        completedReviews,
        scheduledReviews,
        inProgressReviews,
        reviewStats: {
          total: totalReviews,
          completed: completedReviews,
          scheduled: scheduledReviews,
          inProgress: inProgressReviews,
        },
        actionItemStats: {
          total: 0,
          open: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0
        },
        overdueActionItems: []
      };
    } catch (error) {
      console.error("Error fetching management review dashboard data:", error);
      throw error;
    }
  }

  /**
   * Gets review inputs for a specific management review
   * @param reviewId The ID of the management review
   * @returns Array of review inputs
   */
  async getReviewInputs(reviewId: number) {
    try {
      // For now, return mock inputs structure for the intelligent action generator
      // In a real implementation, this would query the management_review_inputs table
      return [
        {
          id: 1,
          category: 'audit_results',
          title: 'Internal Audit Findings Q2 2025',
          description: 'Two non-conformities identified in design control processes. Observation regarding document control effectiveness.',
          data: 'NC-001: Design review documentation incomplete. NC-002: Risk management file missing updates.',
          source: 'Internal Audit Report IA-2025-02',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          category: 'customer_feedback',
          title: 'Customer Satisfaction Survey Results',
          description: 'Q2 customer satisfaction showing declining trend in product quality perception.',
          data: 'Overall satisfaction: 82% (down from 89%). Quality rating: 78% (down from 85%).',
          source: 'Customer Survey Q2-2025',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          category: 'process_performance',
          title: 'Manufacturing Process Metrics',
          description: 'Process efficiency targets not met. Yield rate below specification.',
          data: 'Target yield: 95%, Actual: 91%. Cycle time increased by 12%.',
          source: 'Production Performance Report',
          createdAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error(`Error fetching review inputs for review ${reviewId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new action item for a management review
   * @param actionData Action item data to insert
   * @returns Created action item
   */
  async createActionItem(actionData: any) {
    try {
      // For now, return a mock action item
      // In a real implementation, this would insert into management_review_action_items table
      const actionItem = {
        id: Date.now(),
        ...actionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Created action item:', actionItem);
      return actionItem;
    } catch (error) {
      console.error('Error creating action item:', error);
      throw error;
    }
  }
}

export const managementReviewStorage = new ManagementReviewStorage();
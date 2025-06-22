import { Router, Request, Response, NextFunction } from "express";
import { managementReviewStorage } from "./storage.management-review";
import { insertManagementReviewSchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateActionItemsFromInputs } from "./utils/management-review-action-generator";

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // In development mode, always allow requests to proceed
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Check if user is authenticated through session
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // If not authenticated, return 401
  return res.status(401).json({ error: "Unauthorized" });
}

export const managementReviewRouter = Router();

// Get all management reviews for dashboard display
managementReviewRouter.get("/api/management-review-dashboard", isAuthenticated, async (req, res) => {
  try {
    const data = await managementReviewStorage.getDashboardData();
    res.json(data);
  } catch (error) {
    console.error("Error fetching management review dashboard:", error);
    res.status(500).json({ error: "Failed to fetch management review dashboard" });
  }
});

// Get a specific management review by ID
managementReviewRouter.get("/api/management-reviews/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const review = await managementReviewStorage.getReviewById(id);
    if (!review) {
      return res.status(404).json({ error: "Management review not found" });
    }
    
    res.json(review);
  } catch (error) {
    console.error(`Error fetching management review ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch management review" });
  }
});

// Create a new management review with auto-generated number
managementReviewRouter.post("/api/management-reviews", async (req, res) => {
  try {
    console.log("Received management review data:", req.body);
    
    // Create a normalized version of the data with server-side naming
    let normalizedData = { ...req.body };
    
    // Map client-side field names to server-side field names if needed
    if (normalizedData.reviewDate && !normalizedData.review_date) {
      normalizedData.review_date = new Date(normalizedData.reviewDate);
      delete normalizedData.reviewDate;
    }
    
    if (normalizedData.reviewType && !normalizedData.review_type) {
      normalizedData.review_type = normalizedData.reviewType;
      delete normalizedData.reviewType;
    }
    
    // Set created_by and scheduled_by if they're missing
    if (!normalizedData.created_by && req.user && req.user.id) {
      normalizedData.created_by = req.user.id;
    }
    
    if (!normalizedData.scheduled_by && normalizedData.created_by) {
      normalizedData.scheduled_by = normalizedData.created_by;
    }
    
    // Handle scope and purpose fields by combining them into description if needed
    if ((normalizedData.scope || normalizedData.purpose) && !normalizedData.description) {
      let description = '';
      
      if (normalizedData.scope) {
        description += `Scope: ${normalizedData.scope}\n\n`;
      }
      
      if (normalizedData.purpose) {
        description += `Purpose: ${normalizedData.purpose}\n\n`;
      }
      
      normalizedData.description = description.trim();
    }
    
    console.log("Normalized data for validation:", normalizedData);
    
    // Validate the normalized data
    const validatedData = insertManagementReviewSchema.parse(normalizedData);
    
    // Prepare data for database submission
    const cleanedData = {...validatedData};
    
    // Make sure scope and purpose don't get sent to the database
    if ('scope' in cleanedData) delete cleanedData.scope;
    if ('purpose' in cleanedData) delete cleanedData.purpose;
    
    console.log("Creating management review with cleaned data:", cleanedData);
    
    // Create new review
    const createdReview = await managementReviewStorage.createReview(cleanedData);
    
    res.status(201).json(createdReview);
  } catch (error) {
    console.error("Error creating management review:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Invalid management review data", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Failed to create management review" });
  }
});

// Update an existing management review
managementReviewRouter.patch("/api/management-reviews/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    console.log(`Updating management review ${id} with data:`, req.body);
    
    // Ensure review exists
    const existingReview = await managementReviewStorage.getReviewById(id);
    if (!existingReview) {
      return res.status(404).json({ error: "Management review not found" });
    }
    
    // Create a normalized version of the data with server-side naming
    let normalizedData = { ...req.body };
    
    // Map client-side field names to server-side field names if needed
    if (normalizedData.reviewDate && !normalizedData.review_date) {
      normalizedData.review_date = new Date(normalizedData.reviewDate);
      delete normalizedData.reviewDate;
    }
    
    if (normalizedData.reviewType && !normalizedData.review_type) {
      normalizedData.review_type = normalizedData.reviewType;
      delete normalizedData.reviewType;
    }
    
    // Handle scope and purpose fields by combining them into description if needed
    if ((normalizedData.scope || normalizedData.purpose) && !normalizedData.description) {
      let description = '';
      
      if (normalizedData.scope) {
        description += `Scope: ${normalizedData.scope}\n\n`;
      }
      
      if (normalizedData.purpose) {
        description += `Purpose: ${normalizedData.purpose}\n\n`;
      }
      
      normalizedData.description = description.trim();
    }
    
    // Remove fields that don't exist in the database
    delete normalizedData.scope;
    delete normalizedData.purpose;
    
    console.log("Normalized data for update:", normalizedData);
    
    // Update the review
    const updatedReview = await managementReviewStorage.updateReview(id, normalizedData);
    
    res.json(updatedReview);
  } catch (error) {
    console.error(`Error updating management review ${req.params.id}:`, error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Invalid management review data", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Failed to update management review" });
  }
});

// Get all management reviews
managementReviewRouter.get("/api/management-reviews", async (req, res) => {
  try {
    const reviews = await managementReviewStorage.getReviews();
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching management reviews:", error);
    res.status(500).json({ error: "Failed to fetch management reviews" });
  }
});

// Generate intelligent action items from review inputs
managementReviewRouter.post("/api/management-reviews/:id/generate-actions", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Ensure review exists
    const review = await managementReviewStorage.getReviewById(id);
    if (!review) {
      return res.status(404).json({ error: "Management review not found" });
    }

    // Get review inputs for analysis
    const inputs = await managementReviewStorage.getReviewInputs(id);
    
    if (!inputs || inputs.length === 0) {
      return res.status(400).json({ 
        error: "No review inputs found. Please add review inputs before generating action items." 
      });
    }

    // Generate intelligent action items based on inputs
    const generatedActions = generateActionItemsFromInputs(inputs);

    // Save generated actions to database
    const savedActions = [];
    for (const action of generatedActions) {
      try {
        const actionData = {
          review_id: id,
          title: action.title,
          description: action.description,
          assigned_to: action.assignedDepartment,
          priority: action.priority,
          status: 'Open',
          due_date: action.dueDate,
          category: action.category,
          iso_clause: action.isoClause,
          risk_level: action.riskLevel,
          source_input_ids: action.sourceInputIds
        };

        const savedAction = await managementReviewStorage.createActionItem(actionData);
        savedActions.push(savedAction);
      } catch (actionError) {
        console.error('Error saving generated action:', actionError);
        // Continue with other actions even if one fails
      }
    }

    res.json({
      message: `Generated ${savedActions.length} action items from ${inputs.length} review inputs`,
      generatedCount: savedActions.length,
      totalInputs: inputs.length,
      actions: savedActions
    });

  } catch (error) {
    console.error(`Error generating action items for review ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to generate action items" });
  }
});

// Delete a management review
managementReviewRouter.delete("/api/management-reviews/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    // Ensure review exists
    const existingReview = await managementReviewStorage.getReviewById(id);
    if (!existingReview) {
      return res.status(404).json({ error: "Management review not found" });
    }
    
    // Delete the review
    await managementReviewStorage.deleteReview(id);
    
    // Return success response
    res.json({ success: true, message: "Management review deleted successfully" });
  } catch (error) {
    console.error(`Error deleting management review ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete management review" });
  }
});
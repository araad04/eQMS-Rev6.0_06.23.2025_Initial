import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import {
  InsertProduct,
  InsertProductionBatch,
  InsertQualityCheck,
  InsertBatchProcessStep,
  InsertNonconformingProduct,
  InsertMaterial,
  InsertEquipment,
  InsertBatchDeviation,
  insertProductSchema,
  insertProductionBatchSchema,
  insertQualityCheckSchema,
  insertBatchProcessStepSchema,
  insertNonconformingProductSchema,
  insertMaterialSchema,
  insertEquipmentSchema,
  insertBatchDeviationSchema,
} from "@shared/schema";
import { generateBatchNumber } from "./utils/number-generator";
import { authMiddleware } from "./middleware/auth";

// Use the centralized authentication middleware for consistent role-based access control
const { isAuthenticated, hasRole, isAdmin, auditRequest } = authMiddleware;

export function setupProductionRoutes(app: Express) {
  // Products
  app.get("/api/production/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/production/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(200).json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/production/products", isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/production/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = req.body;
      const updatedProduct = await storage.updateProduct(id, productData);
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  // Production Batches
  app.get("/api/production/batches", isAuthenticated, async (req, res) => {
    try {
      const batches = await storage.getProductionBatches();
      res.status(200).json(batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.get("/api/production/batches/:id", isAuthenticated, async (req, res) => {
    try {
      const batch = await storage.getProductionBatch(parseInt(req.params.id));
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.status(200).json(batch);
    } catch (error) {
      console.error("Error fetching batch:", error);
      res.status(500).json({ error: "Failed to fetch batch" });
    }
  });

  app.post("/api/production/batches", isAuthenticated, async (req, res) => {
    try {
      let batchData = insertProductionBatchSchema.parse(req.body);
      
      // Generate batch number if not provided
      if (!batchData.batchNumber || batchData.batchNumber.trim() === '') {
        batchData.batchNumber = await generateBatchNumber();
      }
      
      // Add user as initiator if not specified
      if (!batchData.initiatedBy && req.user) {
        batchData.initiatedBy = req.user.id;
      }
      
      const newBatch = await storage.createProductionBatch(batchData);
      res.status(201).json(newBatch);
    } catch (error) {
      console.error("Error creating batch:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(400).json({ error: "Failed to create batch", details: errorMessage });
    }
  });

  app.patch("/api/production/batches/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const batchData = req.body;
      const updatedBatch = await storage.updateProductionBatch(id, batchData);
      res.status(200).json(updatedBatch);
    } catch (error) {
      console.error("Error updating batch:", error);
      res.status(400).json({ error: "Failed to update batch" });
    }
  });

  // Process Steps
  app.get("/api/production/batches/:batchId/steps", isAuthenticated, async (req, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      const steps = await storage.getBatchProcessSteps(batchId);
      res.status(200).json(steps);
    } catch (error) {
      console.error("Error fetching process steps:", error);
      res.status(500).json({ error: "Failed to fetch process steps" });
    }
  });

  app.post("/api/production/process-steps", isAuthenticated, async (req, res) => {
    try {
      const stepData = insertBatchProcessStepSchema.parse(req.body);
      const newStep = await storage.createBatchProcessStep(stepData);
      res.status(201).json(newStep);
    } catch (error) {
      console.error("Error creating process step:", error);
      res.status(400).json({ error: "Failed to create process step" });
    }
  });

  app.patch("/api/production/process-steps/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stepData = req.body;
      const updatedStep = await storage.updateBatchProcessStep(id, stepData);
      res.status(200).json(updatedStep);
    } catch (error) {
      console.error("Error updating process step:", error);
      res.status(400).json({ error: "Failed to update process step" });
    }
  });

  // Quality Checks
  app.get("/api/production/batches/:batchId/quality-checks", isAuthenticated, async (req, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      const checks = await storage.getQualityChecks(batchId);
      res.status(200).json(checks);
    } catch (error) {
      console.error("Error fetching quality checks:", error);
      res.status(500).json({ error: "Failed to fetch quality checks" });
    }
  });

  app.post("/api/production/quality-checks", isAuthenticated, async (req, res) => {
    try {
      const checkData = insertQualityCheckSchema.parse(req.body);
      const newCheck = await storage.createQualityCheck(checkData);
      res.status(201).json(newCheck);
    } catch (error) {
      console.error("Error creating quality check:", error);
      res.status(400).json({ error: "Failed to create quality check" });
    }
  });

  app.patch("/api/production/quality-checks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checkData = req.body;
      const updatedCheck = await storage.updateQualityCheck(id, checkData);
      res.status(200).json(updatedCheck);
    } catch (error) {
      console.error("Error updating quality check:", error);
      res.status(400).json({ error: "Failed to update quality check" });
    }
  });

  // Batch Deviations
  app.get("/api/production/batches/:batchId/deviations", isAuthenticated, async (req, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      const deviations = await storage.getBatchDeviations(batchId);
      res.status(200).json(deviations);
    } catch (error) {
      console.error("Error fetching deviations:", error);
      res.status(500).json({ error: "Failed to fetch deviations" });
    }
  });

  app.post("/api/production/deviations", isAuthenticated, async (req, res) => {
    try {
      const deviationData = insertBatchDeviationSchema.parse(req.body);
      const newDeviation = await storage.createBatchDeviation(deviationData);
      res.status(201).json(newDeviation);
    } catch (error) {
      console.error("Error creating deviation:", error);
      res.status(400).json({ error: "Failed to create deviation" });
    }
  });

  app.patch("/api/production/deviations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deviationData = req.body;
      const updatedDeviation = await storage.updateBatchDeviation(id, deviationData);
      res.status(200).json(updatedDeviation);
    } catch (error) {
      console.error("Error updating deviation:", error);
      res.status(400).json({ error: "Failed to update deviation" });
    }
  });

  // Nonconforming Products
  app.get("/api/production/nonconforming", isAuthenticated, async (req, res) => {
    try {
      const nonconformingProducts = await storage.getNonconformingProducts();
      res.status(200).json(nonconformingProducts);
    } catch (error) {
      console.error("Error fetching nonconforming products:", error);
      res.status(500).json({ error: "Failed to fetch nonconforming products" });
    }
  });

  app.get("/api/production/nonconforming/:id", isAuthenticated, async (req, res) => {
    try {
      const nonconformingProduct = await storage.getNonconformingProduct(parseInt(req.params.id));
      if (!nonconformingProduct) {
        return res.status(404).json({ error: "Nonconforming product not found" });
      }
      res.status(200).json(nonconformingProduct);
    } catch (error) {
      console.error("Error fetching nonconforming product:", error);
      res.status(500).json({ error: "Failed to fetch nonconforming product" });
    }
  });

  app.post("/api/production/nonconforming", isAuthenticated, async (req, res) => {
    try {
      const nonconformingData = insertNonconformingProductSchema.parse(req.body);
      const newNonconforming = await storage.createNonconformingProduct(nonconformingData);
      res.status(201).json(newNonconforming);
    } catch (error) {
      console.error("Error creating nonconforming product:", error);
      res.status(400).json({ error: "Failed to create nonconforming product" });
    }
  });

  app.patch("/api/production/nonconforming/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const nonconformingData = req.body;
      const updatedNonconforming = await storage.updateNonconformingProduct(id, nonconformingData);
      res.status(200).json(updatedNonconforming);
    } catch (error) {
      console.error("Error updating nonconforming product:", error);
      res.status(400).json({ error: "Failed to update nonconforming product" });
    }
  });

  app.delete("/api/production/nonconforming/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if the nonconforming product exists first
      const existingProduct = await storage.getNonconformingProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ error: "Nonconforming product not found" });
      }

      // Delete the nonconforming product
      await storage.deleteNonconformingProduct(id);
      
      res.status(200).json({ 
        message: "Nonconforming product deleted successfully",
        deletedId: id 
      });
    } catch (error) {
      console.error("Error deleting nonconforming product:", error);
      res.status(500).json({ error: "Failed to delete nonconforming product" });
    }
  });

  // Materials
  app.get("/api/production/materials", isAuthenticated, async (req, res) => {
    try {
      const materials = await storage.getMaterials();
      res.status(200).json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/production/materials", isAuthenticated, async (req, res) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      const newMaterial = await storage.createMaterial(materialData);
      res.status(201).json(newMaterial);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(400).json({ error: "Failed to create material" });
    }
  });

  // Equipment
  app.get("/api/production/equipment", isAuthenticated, async (req, res) => {
    try {
      const equipment = await storage.getEquipment();
      res.status(200).json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.post("/api/production/equipment", isAuthenticated, async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const newEquipment = await storage.createEquipment(equipmentData);
      res.status(201).json(newEquipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(400).json({ error: "Failed to create equipment" });
    }
  });

  // Reference Data
  app.get("/api/production/nonconforming-statuses", isAuthenticated, async (req, res) => {
    try {
      const statuses = await storage.getNonconformingStatuses();
      res.status(200).json(statuses);
    } catch (error) {
      console.error("Error fetching nonconforming statuses:", error);
      res.status(500).json({ error: "Failed to fetch nonconforming statuses" });
    }
  });

  app.get("/api/production/nonconforming-severity-levels", isAuthenticated, async (req, res) => {
    try {
      const severityLevels = await storage.getNonconformingSeverityLevels();
      res.status(200).json(severityLevels);
    } catch (error) {
      console.error("Error fetching nonconforming severity levels:", error);
      res.status(500).json({ error: "Failed to fetch nonconforming severity levels" });
    }
  });
}
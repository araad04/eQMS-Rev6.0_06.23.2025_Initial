import express, { Request, Response } from "express";
import { db } from "./db";
import { calibrationAssets, calibrationRecords } from "@shared/schema";
import { authMiddleware } from "./middleware/auth";
import { desc, eq } from "drizzle-orm";
import { Logger } from "./utils/logger";

export const calibrationRouter = express.Router();

/**
 * Get all calibration assets
 * GET /api/calibration/assets
 */
calibrationRouter.get("/assets", authMiddleware.isAuthenticated, async (req: Request, res: Response) => {
  try {
    const assets = await db.select().from(calibrationAssets).orderBy(desc(calibrationAssets.id));
    
    // Transform the data for the frontend
    const transformedAssets = assets.map(asset => ({
      id: asset.id,
      assetNumber: asset.assetId,
      assetName: asset.name,
      location: asset.location,
      calibrationDate: asset.lastCalibrationDate ? new Date(asset.lastCalibrationDate).toISOString().split('T')[0] : 'Not calibrated',
      nextCalibrationDate: asset.nextCalibrationDate ? new Date(asset.nextCalibrationDate).toISOString().split('T')[0] : 'Not scheduled',
      status: asset.status,
      accuracy: 'Per specification', // Not in schema, but needed for UI
      assignedTo: asset.department || 'Unassigned', // Using department as assignedTo for now
      department: asset.department || 'N/A'
    }));
    
    res.status(200).json(transformedAssets);
  } catch (error) {
    Logger.error("Error fetching calibration assets:", error);
    res.status(500).json({ error: "Failed to fetch calibration assets" });
  }
});

/**
 * Get a specific calibration asset by ID
 * GET /api/calibration/assets/:id
 */
calibrationRouter.get("/assets/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [asset] = await db.select().from(calibrationAssets).where(eq(calibrationAssets.id, parseInt(id)));
    
    if (!asset) {
      return res.status(404).json({ error: "Calibration asset not found" });
    }
    
    // Get calibration records for this asset
    const records = await db.select()
      .from(calibrationRecords)
      .where(eq(calibrationRecords.assetId, parseInt(id)))
      .orderBy(desc(calibrationRecords.calibrationDate));
    
    res.status(200).json({
      asset,
      calibrationHistory: records
    });
  } catch (error) {
    Logger.error(`Error fetching calibration asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch calibration asset" });
  }
});

/**
 * Create a new calibration asset
 * POST /api/calibration/assets
 */
calibrationRouter.post("/assets", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      assetNumber, 
      assetName, 
      location, 
      manufacturer, 
      model, 
      serialNumber,
      calibrationDate,
      nextCalibrationDate,
      calibrationFrequency,
      status,
      department,
      notes
    } = req.body;
    
    // Get user ID from request
    const userId = req.user?.id || 9999; // Default to dev user if not available
    
    // Insert new asset
    const [newAsset] = await db.insert(calibrationAssets).values({
      assetId: assetNumber,
      name: assetName,
      location: location,
      manufacturer: manufacturer,
      model: model || null,
      serialNumber: serialNumber,
      lastCalibrationDate: calibrationDate ? new Date(calibrationDate) : null,
      nextCalibrationDate: nextCalibrationDate ? new Date(nextCalibrationDate) : null,
      calibrationFrequency: calibrationFrequency || 365, // Default to annual
      status: status,
      department: department || null,
      notes: notes || null,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    res.status(201).json(newAsset);
  } catch (error) {
    Logger.error("Error creating calibration asset:", error);
    res.status(500).json({ error: "Failed to create calibration asset", details: error instanceof Error ? error.message : String(error) });
  }
});

/**
 * Update a calibration asset
 * PUT /api/calibration/assets/:id
 */
calibrationRouter.put("/assets/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      assetNumber, 
      assetName, 
      location, 
      manufacturer, 
      model, 
      serialNumber,
      calibrationDate,
      nextCalibrationDate,
      calibrationFrequency,
      status,
      department,
      notes
    } = req.body;
    
    // Check if asset exists
    const [existingAsset] = await db.select()
      .from(calibrationAssets)
      .where(eq(calibrationAssets.id, parseInt(id)));
    
    if (!existingAsset) {
      return res.status(404).json({ error: "Calibration asset not found" });
    }
    
    // Update asset
    const [updatedAsset] = await db.update(calibrationAssets)
      .set({
        assetId: assetNumber,
        name: assetName,
        location: location,
        manufacturer: manufacturer,
        model: model || null,
        serialNumber: serialNumber,
        lastCalibrationDate: calibrationDate ? new Date(calibrationDate) : null,
        nextCalibrationDate: nextCalibrationDate ? new Date(nextCalibrationDate) : null,
        calibrationFrequency: calibrationFrequency || 365,
        status: status,
        department: department || null,
        notes: notes || null,
        updatedAt: new Date()
      })
      .where(eq(calibrationAssets.id, parseInt(id)))
      .returning();
    
    res.status(200).json(updatedAsset);
  } catch (error) {
    Logger.error(`Error updating calibration asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update calibration asset" });
  }
});

/**
 * Add a new calibration record
 * POST /api/calibration/assets/:id/records
 */
calibrationRouter.post("/assets/:id/records", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      calibrationDate, 
      performedBy, 
      result, 
      certificate, 
      notes,
      nextCalibrationDate 
    } = req.body;
    
    // Get user ID from request
    const userId = req.user?.id || 9999; // Default to dev user if not available
    
    // Check if asset exists
    const [existingAsset] = await db.select()
      .from(calibrationAssets)
      .where(eq(calibrationAssets.id, parseInt(id)));
    
    if (!existingAsset) {
      return res.status(404).json({ error: "Calibration asset not found" });
    }
    
    // Insert calibration record
    const [newRecord] = await db.insert(calibrationRecords).values({
      assetId: parseInt(id),
      calibrationDate: new Date(calibrationDate),
      performedBy: performedBy || userId,
      status: result || 'Completed',
      dueDate: nextCalibrationDate ? new Date(nextCalibrationDate) : null,
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    // Update the asset with the new calibration dates
    await db.update(calibrationAssets)
      .set({
        lastCalibrationDate: new Date(calibrationDate),
        nextCalibrationDate: nextCalibrationDate ? new Date(nextCalibrationDate) : null,
        status: result === 'Pass' ? 'Calibrated' : 'Out of Calibration',
        updatedAt: new Date()
      })
      .where(eq(calibrationAssets.id, parseInt(id)));
    
    res.status(201).json(newRecord);
  } catch (error) {
    Logger.error(`Error adding calibration record for asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to add calibration record" });
  }
});

export default calibrationRouter;
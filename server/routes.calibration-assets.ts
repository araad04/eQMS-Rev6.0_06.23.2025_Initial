import express, { Request, Response } from "express";
import { db } from "./db";
import { calibrationAssets, calibrationRecords } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { Logger } from "./utils/logger";
import { executeQuery } from "./db";

export const calibrationAssetsRouter = express.Router();

// This middleware logs API hits for debugging
calibrationAssetsRouter.use((req, res, next) => {
  console.log(`Calibration assets API hit: ${req.method} ${req.path}`);
  next();
});

// GET all calibration assets
calibrationAssetsRouter.get("/assets", async (req: Request, res: Response) => {
  try {
    const result = await executeQuery('SELECT * FROM calibration_assets ORDER BY id DESC');
    
    // Transform database assets for frontend
    const transformedAssets = result.rows.map(asset => ({
      id: asset.id,
      assetNumber: asset.asset_id || asset.assetId,
      assetName: asset.name,
      location: asset.location,
      calibrationDate: (asset.last_calibration_date || asset.lastCalibrationDate) ? 
        new Date(asset.last_calibration_date || asset.lastCalibrationDate).toISOString().split('T')[0] : 'Not calibrated',
      nextCalibrationDate: (asset.next_calibration_date || asset.nextCalibrationDate) ? 
        new Date(asset.next_calibration_date || asset.nextCalibrationDate).toISOString().split('T')[0] : 'Not scheduled',
      status: asset.status,
      accuracy: 'Per specification',
      assignedTo: asset.department || 'Unassigned',
      department: asset.department || 'N/A',
      manufacturer: asset.manufacturer || 'Unknown',
      serialNumber: asset.serial_number || asset.serialNumber || 'Not provided',
      model: asset.model || 'Standard'
    }));
    
    return res.status(200).json(transformedAssets);
  } catch (error) {
    console.error("Error fetching calibration assets:", error);
    res.status(500).json({ error: "Failed to fetch calibration assets" });
  }
});

// Get a specific calibration asset by ID
calibrationAssetsRouter.get("/assets/:id", async (req: Request, res: Response) => {
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
    console.error("Error fetching calibration asset", error);
    res.status(500).json({ error: "Failed to fetch calibration asset" });
  }
});

// Create a new calibration asset
calibrationAssetsRouter.post("/assets", async (req: Request, res: Response) => {
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
      calibrationFrequency = 365,
      status,
      department,
      notes
    } = req.body;
    
    console.log("Received new calibration asset request:", req.body);
    
    // Default to dev user ID if not available in the request
    const userId = req.user?.id || 9999;
    
    try {
      // Insert using drizzle ORM for better type safety
      const [newAsset] = await db.insert(calibrationAssets).values({
        assetId: assetNumber,
        name: assetName,
        location: location,
        manufacturer: manufacturer || 'Unknown',
        model: model || null,
        serialNumber: serialNumber || 'Not specified',
        lastCalibrationDate: calibrationDate ? new Date(calibrationDate) : null,
        nextCalibrationDate: nextCalibrationDate ? new Date(nextCalibrationDate) : null,
        calibrationFrequency: calibrationFrequency || 365,
        status: status,
        department: department || null,
        notes: notes || null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Transform to match frontend expectations
      const transformedAsset = {
        id: newAsset.id,
        assetNumber: newAsset.assetId,
        assetName: newAsset.name,
        location: newAsset.location,
        calibrationDate: newAsset.lastCalibrationDate ? new Date(newAsset.lastCalibrationDate).toISOString().split('T')[0] : 'Not calibrated',
        nextCalibrationDate: newAsset.nextCalibrationDate ? new Date(newAsset.nextCalibrationDate).toISOString().split('T')[0] : 'Not scheduled',
        status: newAsset.status,
        manufacturer: newAsset.manufacturer,
        model: newAsset.model,
        serialNumber: newAsset.serialNumber,
        accuracy: 'Per specification',
        assignedTo: newAsset.department || 'Unassigned',
        department: newAsset.department || 'N/A'
      };
      
      console.log("Created new calibration asset:", transformedAsset);
      res.status(201).json(transformedAsset);
    } catch (dbError) {
      console.error("Database error creating calibration asset:", dbError);
      res.status(500).json({ error: "Failed to create calibration asset. Please check database configuration." });
    }
  } catch (error) {
    console.error("Error creating calibration asset", error);
    res.status(500).json({ error: "Failed to create calibration asset" });
  }
});

export default calibrationAssetsRouter;
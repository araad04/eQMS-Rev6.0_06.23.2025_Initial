/**
 * 21 CFR Part 11 Compliant Electronic Signature Verification
 * 
 * This middleware validates electronic signatures for document approval workflows
 * to ensure compliance with FDA 21 CFR Part 11 requirements.
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { Logger } from '../utils/logger';

const scryptAsync = promisify(scrypt);

/**
 * Verify electronic signature for document approval
 * 
 * Implementation notes:
 * - Requires password re-entry to verify user identity
 * - Uses cryptographic comparison to prevent timing attacks
 * - Logs all signature verification attempts for audit purposes
 */
export async function verifyElectronicSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Only apply to document approval routes
    if (!req.path.includes('/approvals')) {
      return next();
    }

    // If user not authenticated, skip (auth middleware will handle this)
    if (!req.user) {
      return next();
    }

    const { password, signatureReason } = req.body;

    // Password re-entry is required for electronic signatures (21 CFR Part 11)
    if (!password) {
      Logger.warn(`Electronic signature verification failed: No password provided for user ${req.user.username}`);
      return res.status(400).json({
        message: 'Electronic signature verification failed',
        details: 'Password must be re-entered for electronic signature verification'
      });
    }

    // Signature reason is required for audit trail (21 CFR Part 11)
    if (!signatureReason) {
      Logger.warn(`Electronic signature verification failed: No reason provided for user ${req.user.username}`);
      return res.status(400).json({
        message: 'Electronic signature verification failed',
        details: 'Signature reason must be provided'
      });
    }
    
    // Log full request body for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      const maskValue = process.env.LOG_MASK_VALUE || '******';
      Logger.debug(`Electronic signature request body: ${JSON.stringify({
        ...req.body,
        password: maskValue // Mask password using environment variable
      })}`);
    }
    
    // Get user from storage to access stored password hash
    const user = await storage.getUser(req.user.id);
    if (!user) {
      Logger.error(`Electronic signature verification failed: User ID ${req.user.id} not found`);
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Verify password - must match stored password (using secure comparison)
    const verificationResult = await comparePasswords(password, user.password);
    if (!verificationResult) {
      // Log failed verification attempt for security auditing
      Logger.warn(`Electronic signature verification failed: Password mismatch for user ${user.username}`);
      return res.status(401).json({
        message: 'Electronic signature verification failed',
        details: 'Password verification failed'
      });
    }

    // Log successful verification for audit trail
    Logger.info(`Electronic signature verified for user ${user.username} (ID: ${user.id}) - Reason: ${signatureReason}`);
    
    // Add signature metadata to request for document storage
    req.body.signatureMetadata = {
      verifiedUserId: user.id,
      verifiedUsername: user.username,
      verificationTimestamp: new Date().toISOString(),
      reason: signatureReason,
      ipAddress: req.ip
    };
    
    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    Logger.error(`Electronic signature verification error: ${errorMessage}`);
    return res.status(500).json({
      message: 'Electronic signature verification failed',
      details: errorMessage
    });
  }
}

/**
 * Compare supplied password with stored hash using timing-safe comparison
 * 
 * @param supplied Plain text password provided for verification
 * @param stored Stored password hash
 * @returns Boolean indicating if passwords match
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    Logger.error(`Password comparison error: ${errorMessage}`);
    return false;
  }
}
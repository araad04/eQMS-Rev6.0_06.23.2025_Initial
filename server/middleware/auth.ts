import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

// This centralized authentication middleware addresses DEF-002 
// by consistently enforcing role-based access control
export const authMiddleware = {
  // Basic authentication check - any authenticated user can proceed
  isAuthenticated: (req: Request, res: Response, next: NextFunction) => {
    // Allow development mode authentication via X-Auth-Local header
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    const hasLocalAuth = req.headers['x-auth-local'] === 'true';
    
    // Check if passport is initialized and user is authenticated
    if (req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
      return next();
    }
    
    // Development mode auth fallback with required header
    if (isDevEnvironment && hasLocalAuth) {
      console.log('AUTH: Development mode - bypassing authentication with X-Auth-Local header');
      // Set a development user for testing
      req.user = {
        id: 9999,
        username: 'biomedical78',
        firstName: 'Development',
        lastName: 'User',
        email: 'biomedical78@example.com',
        role: 'user',
        department: 'Testing'
      };
      return next();
    }
    
    Logger.warn(`Unauthorized access attempt to ${req.method} ${req.path}`);
    return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
  },

  // Role-based access control - only users with specified roles can proceed
  hasRole: (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // First check if user is authenticated
      if (!req.isAuthenticated()) {
        Logger.warn(`Unauthorized access attempt to ${req.method} ${req.path}`);
        return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
      }

      // Then check if the user has the required role
      const userRole = req.user?.role;
      if (!userRole || (!roles.includes(userRole) && userRole !== 'admin')) {
        Logger.warn(`Forbidden access attempt to ${req.method} ${req.path} by user ${req.user?.username} with role ${userRole}`);
        return res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
      }

      return next();
    };
  },

  // Special middleware for admin-only routes
  isAdmin: (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      Logger.warn(`Unauthorized access attempt to admin route ${req.method} ${req.path}`);
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    }

    if (req.user?.role !== 'admin') {
      Logger.warn(`Forbidden access attempt to admin route ${req.method} ${req.path} by user ${req.user?.username} with role ${req.user?.role}`);
      return res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    }

    return next();
  },

  // Middleware for audit logging with IEC 62304 compliance
  auditRequest: (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      const userId = req.user?.id;
      const username = req.user?.username;
      const method = req.method;
      const path = req.path;
      const userIp = req.ip;
      
      Logger.info(`[AUDIT] User ${username} (ID: ${userId}) performed ${method} ${path} from ${userIp}`);
    }
    next();
  }
};
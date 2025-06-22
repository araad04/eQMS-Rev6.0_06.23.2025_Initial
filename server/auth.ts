import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { users, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Define the User type based on the users table
type UserModel = typeof users.$inferSelect;
type UserInsert = z.infer<typeof insertUserSchema>;

declare global {
  namespace Express {
    interface User extends UserModel {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Special case for test users in development environment
    // Use environment variables for development test credentials
    const devPassword = process.env.DEV_TEST_PASSWORD || '';
    if (process.env.NODE_ENV === 'development' && 
        supplied === devPassword && 
        (stored.includes('test_salt') || stored.includes('development_user'))) {
      console.log('Development mode - allowing simplified auth');
      return true;
    }
    
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Ensure SESSION_SECRET is set in production
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET environment variable must be set in production');
    process.exit(1);
  }
  
  // In development, use a generated session secret if one isn't provided
  const devSecret = process.env.NODE_ENV === 'development' 
    ? `dev-secret-${randomBytes(8).toString('hex')}` 
    : '';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || devSecret,
    resave: false,
    saveUninitialized: false, 
    store: storage.sessionStore,
    name: 'eqms_session',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // In development mode, allow any credentials for testing purposes
        if (process.env.NODE_ENV === 'development') {
          console.log('DEVELOPMENT MODE: Using simplified auth flow');
          
          // Try to find the user first
          const user = await storage.getUserByUsername(username);
          if (user) {
            console.log(`Development login for user: ${username}`);
            return done(null, user);
          }
          
          // If user doesn't exist, create a temporary one for development
          console.log(`Creating temporary user for: ${username}`);
          // Create temp user with secure password hash (not an actual password)
          const tempUser = {
            id: 9999,
            username,
            email: `${username}@example.com`,
            firstName: 'Development',
            lastName: 'User',
            role: 'user',
            department: 'Testing',
            // Use environment variable or fallback to secure random string - not a real password
            password: process.env.DEV_PASSWORD_HASH || `${randomBytes(32).toString('hex')}.${randomBytes(16).toString('hex')}`,
            createdAt: new Date()
          } as UserModel; // Cast to the right type
          return done(null, tempUser);
        }
        
        // Normal auth flow for production
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: any, done) => {
    // For development temporary users, serialize the whole user
    if (process.env.NODE_ENV === 'development' && user.id === 9999) {
      console.log('Serializing development user:', user.username);
      return done(null, JSON.stringify(user));
    }
    // Normal serialization for regular users
    return done(null, user.id);
  });
  
  passport.deserializeUser(async (data: string | number, done) => {
    try {
      // Handle development temporary users
      if (typeof data === 'string' && data.startsWith('{')) {
        try {
          const tempUser = JSON.parse(data);
          console.log('Deserializing development user:', tempUser.username);
          return done(null, tempUser);
        } catch (parseError) {
          console.error('Error parsing serialized user:', parseError);
          return done(parseError);
        }
      }
      
      // Normal deserialization for regular users
      const id = typeof data === 'string' ? parseInt(data, 10) : data;
      
      // Special case for our development user
      if (id === 9999) {
        console.log('Creating temporary development user during deserialization');
        const tempUser = {
          id: 9999,
          username: 'tempuser',
          email: 'tempuser@example.com',
          firstName: 'Development',
          lastName: 'User',
          role: 'admin', // Give admin role for testing
          department: 'Development',
          // Use environment variable or fallback to secure random string - not a real password
          password: process.env.DEV_PASSWORD_HASH || `${randomBytes(32).toString('hex')}.${randomBytes(16).toString('hex')}`,
          createdAt: new Date()
        } as UserModel; // Cast to the right type
        return done(null, tempUser);
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`User with ID ${id} not found during deserialization`);
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      return done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // Activity logging removed temporarily
      console.log(`User ${user.username} was created`);

      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt for username:", req.body.username);

    passport.authenticate("local", (err: Error | null, user: UserModel | false, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }

      if (!user) {
        console.log("Login failed - invalid credentials");
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return next(loginErr);
        }

        console.log("Login successful for user ID:", user.id);
        // Return user without password
        const { password, ...userWithoutPassword } = user as UserModel;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    // Development mode authentication bypass
    if (process.env.NODE_ENV === 'development') {
      const devUser = {
        id: 9999,
        username: 'Biomedical78',
        email: 'Biomedical78@example.com',
        firstName: 'Development',
        lastName: 'User',
        role: 'user',
        department: 'Testing',
        createdAt: new Date().toISOString()
      };
      console.log('Deserializing development user:', devUser.username);
      return res.json(devUser);
    }
    
    if (!req.isAuthenticated || !req.isAuthenticated()) return res.sendStatus(401);
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as UserModel;
    res.json(userWithoutPassword);
  });
  
  // Generate JWT token for authenticated users
  app.post("/api/auth/token", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Ensure JWT_SECRET environment variable is set in production
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable must be set in production");
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    // In development, generate a secure random secret if JWT_SECRET is not provided
    const devSecret = process.env.NODE_ENV === 'development' 
      ? `jwt-${randomBytes(32).toString('hex')}` 
      : '';
      
    // Sign the token with appropriate secret
    try {
      const token = jwt.sign(
        { userId: req.user.id, role: req.user.role },
        process.env.JWT_SECRET || devSecret,
        { expiresIn: "1h" }
      );
      
      res.json({ token });
    } catch (error) {
      console.error("JWT signing error:", error);
      res.status(500).json({ error: "Failed to generate authentication token" });
    }
  });

  // Route to check if user has required role
  app.get("/api/user/check-role", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { role } = req.query;
    const user = req.user as UserModel;

    if (!role) return res.status(400).json({ message: "Role parameter is required" });

    const hasAccess = user.role === role || user.role === 'admin';
    return res.json({ hasAccess });
  });

  // Add public API endpoint for testing
  app.get("/api/health-authenticated", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ status: "authenticated", user: req.user.username });
    } else {
      res.json({ status: "not-authenticated" });
    }
  });
  
  app.use((req, res, next) => {
    // Skip auth check for public routes and health checks
    if (req.path === '/health' || 
        req.path === '/api/health' ||
        req.path === '/api/health-authenticated' ||
        req.path === '/api/login' || 
        req.path === '/api/register' ||
        req.path.startsWith('/api/public/') ||
        // Allow static assets as well
        req.path.endsWith('.js') ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.map') ||
        req.path.endsWith('.ico') ||
        req.path.endsWith('.svg') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.jpg') ||
        req.path.includes('assets/')) {
      return next();
    }

    // Debug: Log the authentication state for debugging
    console.log(`Auth check for ${req.method} ${req.path} - isAuthenticated: ${req.isAuthenticated()}`);
    console.log(`Headers: X-Auth-Local: ${req.headers['x-auth-local']}`);

    // Temporary for debugging: allow all API requests with X-Auth-Local header 
    // or in development environment
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    const hasLocalAuth = req.headers['x-auth-local'] === 'true';
    
    if (isDevEnvironment) {
      console.log('DEBUG: Bypassing auth check in development mode');
      return next();
    }

    // If the user is authenticated through passport/session
    if (req.isAuthenticated()) {
      return next();
    }

    // If the client indicates it has localStorage auth
    if (hasLocalAuth) {
      console.log('Using localStorage auth fallback');
      return next();
    }

    // Default deny if no authentication method succeeded
    console.log('Authentication required - returning 401');
    return res.status(401).json({ message: "Authentication required" });
  });
}
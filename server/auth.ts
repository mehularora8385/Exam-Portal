import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, sessions, registerSchema, loginSchema, type SafeUser } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

const PgSession = connectPgSimple(session);

export function setupAuth(app: Express) {
  // Trust proxy for Replit deployment
  app.set("trust proxy", 1);
  
  const sessionStore = new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: false,
  });

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "gov-exam-portal-secret-2024",
      resave: false,
      saveUninitialized: false,
      // Use default cookie name for better proxy compatibility
      rolling: true,
      proxy: true,
      cookie: {
        secure: false, // Allow HTTP in production behind proxy
        httpOnly: true,
        maxAge: 1000 * 60 * 30, // 30 minutes session timeout
        sameSite: "lax",
      },
    })
  );
}

export function registerAuthRoutes(app: Express) {
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const input = registerSchema.parse(req.body);

      // Check if user exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Create user
      const [newUser] = await db.insert(users).values({
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "candidate",
      }).returning();

      // Set session and explicitly save it
      req.session.userId = newUser.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Registration failed - session error" });
        }
        // Return safe user (without password)
        const { password: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const input = loginSchema.parse(req.body);

      // Find user
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      // Set session and explicitly save it
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed - session error" });
        }
        // Return safe user
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("govportal.sid"); // Clear with correct session name
      res.json({ message: "Logged out successfully" });
    });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  db.select().from(users).where(eq(users.id, req.session.userId)).limit(1)
    .then(([user]) => {
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      req.user = { ...user, password: undefined } as any;
      next();
    })
    .catch(() => {
      res.status(500).json({ message: "Authorization check failed" });
    });
}

// Helper to get user from session
export async function getUserFromSession(req: Request): Promise<SafeUser | null> {
  if (!req.session.userId) return null;
  
  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
  if (!user) return null;
  
  const { password, ...safeUser } = user;
  return safeUser;
}

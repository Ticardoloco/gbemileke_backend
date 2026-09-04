import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { type IUSER } from "../models/userModel.js";

// 1. Extend the Express Request type globally so TS knows req.user is valid everywhere
declare global {
  namespace Express {
    interface Request {
      user?: IUSER;
    }
  }
}

interface DecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // Check for the token in the Authorization header (Bearer <token>)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const secret = process.env["JWT_SECRET"];
    if (!secret) {
      return res.status(500).json({ message: "JWT secret is not configured on the server" });
    }

    // Verify the token
    const decoded = jwt.verify(token, secret) as DecodedToken;

    // Find the user in the database and exclude the password hash
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user no longer exists" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ 
        message: "Your account has been suspended. Please contact support.",
        reason: user.suspensionReason || undefined
      });
    }

    // Attach the complete Mongoose user document to the request object
    req.user = user;

    // Proceed to the next middleware or controller
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid token", error });
  }
}

/**
 * @desc    Restrict route access to specific user roles
 * @example authorize("admin", "doctor")
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user is populated by the 'protect' middleware
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "User role is missing or not authorized.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route.`,
      });
    }

    next();
  };
}
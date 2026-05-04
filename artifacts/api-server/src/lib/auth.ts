import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SECRET_KEY = new TextEncoder().encode(
  process.env["JWT_SECRET"] ?? "shaadihub-secret-key-minimum-32-chars-long!!"
);

const EXPIRY = process.env["JWT_EXPIRY"] ?? "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: {
  sub: string;
  role: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET_KEY);
}

export async function verifyToken(
  token: string
): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return { sub: payload.sub as string, role: payload["role"] as string };
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: typeof usersTable.$inferSelect;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, Number(payload.sub)));
  if (!user) {
    res.status(401).json({ message: "User not found" });
    return;
  }
  if (user.isBlocked) {
    res.status(401).json({ message: "Account blocked" });
    return;
  }
  req.user = user;
  next();
}

export async function requireVendor(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await authenticate(req, res, async () => {
    if (req.user?.role !== "vendor" && req.user?.role !== "admin") {
      res.status(403).json({ message: "Vendor access required" });
      return;
    }
    next();
  });
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await authenticate(req, res, async () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }
    next();
  });
}

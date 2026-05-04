import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, vendorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken } from "../lib/auth";

const router = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, category, title } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "name, email, password, role required" });
      return;
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === "vendor" ? "vendor" : role === "admin" ? "admin" : "user";

    const [user] = await db
      .insert(usersTable)
      .values({ name, email, passwordHash, role: userRole, phone })
      .returning();

    let vendorId: number | null = null;
    if (userRole === "vendor") {
      const [vendor] = await db
        .insert(vendorsTable)
        .values({
          userId: user.id,
          category: category ?? "Catering",
          title: title ?? name,
        })
        .returning();
      vendorId = vendor.id;
    }

    const token = await signToken({ sub: String(user.id), role: user.role });
    res.status(201).json({ token, user: serializeUser(user), vendorId });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "email and password required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (user.isBlocked) {
      res.status(401).json({ message: "Account blocked" });
      return;
    }

    let vendorId: number | null = null;
    if (user.role === "vendor") {
      const [vendor] = await db
        .select({ id: vendorsTable.id })
        .from(vendorsTable)
        .where(eq(vendorsTable.userId, user.id));
      vendorId = vendor?.id ?? null;
    }

    const token = await signToken({ sub: String(user.id), role: user.role });
    res.json({ token, user: serializeUser(user), vendorId });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

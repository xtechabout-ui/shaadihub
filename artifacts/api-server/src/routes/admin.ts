import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  vendorsTable,
  vendorImagesTable,
  packagesTable,
  bookingsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../lib/auth";

const router = Router();

async function getVendorWithRelations(vendorId: number) {
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
  if (!vendor) return null;
  const images = await db.select().from(vendorImagesTable).where(eq(vendorImagesTable.vendorId, vendorId));
  const packages = await db.select().from(packagesTable).where(eq(packagesTable.vendorId, vendorId));
  return {
    ...vendor,
    images,
    packages: packages.map((p) => ({ ...p, features: JSON.parse(p.features) as string[] })),
  };
}

// GET /admin/stats
router.get("/admin/stats", requireAdmin as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  try {
    const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(usersTable);
    const [{ totalVendors }] = await db.select({ totalVendors: sql<number>`count(*)` }).from(vendorsTable);
    const [{ verifiedVendors }] = await db.select({ verifiedVendors: sql<number>`count(*)` }).from(vendorsTable).where(eq(vendorsTable.verified, true));
    const [{ pendingVendors }] = await db.select({ pendingVendors: sql<number>`count(*)` }).from(vendorsTable).where(eq(vendorsTable.verified, false));
    const [{ totalBookings }] = await db.select({ totalBookings: sql<number>`count(*)` }).from(bookingsTable);
    const [{ totalReviews }] = await db.select({ totalReviews: sql<number>`count(*)` }).from(reviewsTable);

    res.json({
      totalUsers: Number(totalUsers),
      totalVendors: Number(totalVendors),
      verifiedVendors: Number(verifiedVendors),
      pendingVendors: Number(pendingVendors),
      totalBookings: Number(totalBookings),
      totalReviews: Number(totalReviews),
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ message: "Server error" });
  }
});

// GET /admin/vendors
router.get("/admin/vendors", requireAdmin as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  try {
    const vendors = await db.select().from(vendorsTable);
    const enriched = await Promise.all(
      vendors.map(async (v) => {
        const images = await db.select().from(vendorImagesTable).where(eq(vendorImagesTable.vendorId, v.id));
        const packages = await db.select().from(packagesTable).where(eq(packagesTable.vendorId, v.id));
        return {
          ...v,
          images,
          packages: packages.map((p) => ({ ...p, features: JSON.parse(p.features) as string[] })),
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Admin list vendors error");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /admin/vendors/:id/approve
router.put("/admin/vendors/:id/approve", requireAdmin as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.update(vendorsTable).set({ verified: true }).where(eq(vendorsTable.id, id));
    const full = await getVendorWithRelations(id);
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Approve vendor error");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /admin/vendors/:id/suspend
router.put("/admin/vendors/:id/suspend", requireAdmin as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
    await db.update(vendorsTable).set({ isSuspended: !vendor?.isSuspended }).where(eq(vendorsTable.id, id));
    const full = await getVendorWithRelations(id);
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Suspend vendor error");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /admin/vendors/:id/feature
router.put("/admin/vendors/:id/feature", requireAdmin as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
    await db.update(vendorsTable).set({ isFeatured: !vendor?.isFeatured }).where(eq(vendorsTable.id, id));
    const full = await getVendorWithRelations(id);
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Feature vendor error");
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /admin/vendors/:id
router.delete("/admin/vendors/:id", requireAdmin as Parameters<typeof router.delete>[1], async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(vendorsTable).where(eq(vendorsTable.id, id));
    res.json({ message: "Vendor deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete vendor error");
    res.status(500).json({ message: "Server error" });
  }
});

// GET /admin/users
router.get("/admin/users", requireAdmin as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(
      users.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        phone: u.phone, avatarUrl: u.avatarUrl,
        isActive: u.isActive, isBlocked: u.isBlocked, createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Admin list users error");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /admin/users/:id/block
router.put("/admin/users/:id/block", requireAdmin as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    const [updated] = await db
      .update(usersTable)
      .set({ isBlocked: !user?.isBlocked })
      .where(eq(usersTable.id, id))
      .returning();
    res.json({
      id: updated.id, name: updated.name, email: updated.email, role: updated.role,
      phone: updated.phone, avatarUrl: updated.avatarUrl,
      isActive: updated.isActive, isBlocked: updated.isBlocked, createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Block user error");
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

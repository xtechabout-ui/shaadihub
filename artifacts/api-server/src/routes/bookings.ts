import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, vendorsTable, usersTable, packagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireVendor, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /bookings/vendor
router.get("/bookings/vendor", requireVendor as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  try {
    const [vendor] = await db
      .select({ id: vendorsTable.id })
      .from(vendorsTable)
      .where(eq(vendorsTable.userId, req.user!.id));

    if (!vendor) {
      res.status(404).json({ message: "Vendor profile not found" });
      return;
    }

    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.vendorId, vendor.id));

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const [user] = await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, b.userId));
        const [v] = await db
          .select({ title: vendorsTable.title, category: vendorsTable.category, coverImageUrl: vendorsTable.coverImageUrl })
          .from(vendorsTable)
          .where(eq(vendorsTable.id, b.vendorId));
        let packageName: string | null = null;
        if (b.packageId) {
          const [pkg] = await db.select({ name: packagesTable.name }).from(packagesTable).where(eq(packagesTable.id, b.packageId));
          packageName = pkg?.name ?? null;
        }
        return {
          ...b,
          vendorTitle: v?.title ?? null,
          vendorCategory: v?.category ?? null,
          vendorCoverImageUrl: v?.coverImageUrl ?? null,
          packageName,
          userName: user?.name ?? null,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Get vendor bookings error");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /bookings/:id/status
router.put("/bookings/:id/status", requireVendor as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const { status } = req.query as { status: string };

    const validStatuses = ["pending", "approved", "rejected", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const [vendor] = await db
      .select({ id: vendorsTable.id })
      .from(vendorsTable)
      .where(eq(vendorsTable.userId, req.user!.id));

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (!booking || (vendor && booking.vendorId !== vendor.id && req.user!.role !== "admin")) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const [updated] = await db
      .update(bookingsTable)
      .set({ status: status as typeof bookingsTable.$inferSelect["status"] })
      .where(eq(bookingsTable.id, id))
      .returning();

    const [user] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId));
    const [v] = await db
      .select({ title: vendorsTable.title, category: vendorsTable.category, coverImageUrl: vendorsTable.coverImageUrl })
      .from(vendorsTable)
      .where(eq(vendorsTable.id, updated.vendorId));

    res.json({
      ...updated,
      vendorTitle: v?.title ?? null,
      vendorCategory: v?.category ?? null,
      vendorCoverImageUrl: v?.coverImageUrl ?? null,
      packageName: null,
      userName: user?.name ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Update booking status error");
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

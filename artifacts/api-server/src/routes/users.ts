import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  vendorsTable,
  vendorImagesTable,
  packagesTable,
  favoritesTable,
  bookingsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../lib/auth";

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

// GET /users/me
router.get("/users/me", authenticate as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  const u = req.user!;
  res.json({
    id: u.id, name: u.name, email: u.email, role: u.role,
    phone: u.phone, avatarUrl: u.avatarUrl,
    isActive: u.isActive, isBlocked: u.isBlocked, createdAt: u.createdAt,
  });
});

// PUT /users/me
router.put("/users/me", authenticate as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const [user] = await db
      .update(usersTable)
      .set({ ...(name && { name }), phone, avatarUrl })
      .where(eq(usersTable.id, req.user!.id))
      .returning();
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      phone: user.phone, avatarUrl: user.avatarUrl,
      isActive: user.isActive, isBlocked: user.isBlocked, createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ message: "Server error" });
  }
});

// POST /users/favorites/:vendorId
router.post("/users/favorites/:vendorId", authenticate as Parameters<typeof router.post>[1], async (req: AuthRequest, res) => {
  try {
    const vendorId = Number(req.params["vendorId"]);
    const userId = req.user!.id;
    const [existing] = await db
      .select()
      .from(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.vendorId, vendorId)));

    if (existing) {
      await db.delete(favoritesTable).where(eq(favoritesTable.id, existing.id));
      res.json({ favorited: false });
    } else {
      await db.insert(favoritesTable).values({ userId, vendorId });
      res.json({ favorited: true });
    }
  } catch (err) {
    req.log.error({ err }, "Toggle favorite error");
    res.status(500).json({ message: "Server error" });
  }
});

// GET /users/favorites
router.get("/users/favorites", authenticate as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  try {
    const favorites = await db
      .select({ vendorId: favoritesTable.vendorId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, req.user!.id));

    const vendors = await Promise.all(
      favorites.map((f) => getVendorWithRelations(f.vendorId))
    );
    res.json(vendors.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Get favorites error");
    res.status(500).json({ message: "Server error" });
  }
});

// POST /users/bookings
router.post("/users/bookings", authenticate as Parameters<typeof router.post>[1], async (req: AuthRequest, res) => {
  try {
    const { vendorId, packageId, eventDate, guestCount, notes } = req.body;
    if (!vendorId || !eventDate) {
      res.status(400).json({ message: "vendorId and eventDate required" });
      return;
    }
    const [booking] = await db
      .insert(bookingsTable)
      .values({ vendorId, userId: req.user!.id, packageId, eventDate, guestCount, notes })
      .returning();

    const [vendor] = await db.select({ title: vendorsTable.title, category: vendorsTable.category, coverImageUrl: vendorsTable.coverImageUrl }).from(vendorsTable).where(eq(vendorsTable.id, vendorId));
    let packageName: string | null = null;
    if (packageId) {
      const [pkg] = await db.select({ name: packagesTable.name }).from(packagesTable).where(eq(packagesTable.id, packageId));
      packageName = pkg?.name ?? null;
    }

    res.status(201).json({
      ...booking,
      vendorTitle: vendor?.title ?? null,
      vendorCategory: vendor?.category ?? null,
      vendorCoverImageUrl: vendor?.coverImageUrl ?? null,
      packageName,
      userName: req.user!.name,
    });
  } catch (err) {
    req.log.error({ err }, "Create booking error");
    res.status(500).json({ message: "Server error" });
  }
});

// GET /users/bookings
router.get("/users/bookings", authenticate as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  try {
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, req.user!.id));

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const [vendor] = await db
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
          vendorTitle: vendor?.title ?? null,
          vendorCategory: vendor?.category ?? null,
          vendorCoverImageUrl: vendor?.coverImageUrl ?? null,
          packageName,
          userName: req.user!.name,
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Get user bookings error");
    res.status(500).json({ message: "Server error" });
  }
});

// GET /users/reviews/:vendorId
router.get("/users/reviews/:vendorId", async (req, res) => {
  try {
    const vendorId = Number(req.params["vendorId"]);
    const reviews = await db
      .select({
        id: reviewsTable.id,
        vendorId: reviewsTable.vendorId,
        userId: reviewsTable.userId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        userName: usersTable.name,
        userAvatarUrl: usersTable.avatarUrl,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(eq(reviewsTable.vendorId, vendorId));
    res.json(reviews);
  } catch (err) {
    req.log.error({ err }, "Get reviews error");
    res.status(500).json({ message: "Server error" });
  }
});

// POST /users/reviews/:vendorId
router.post("/users/reviews/:vendorId", authenticate as Parameters<typeof router.post>[1], async (req: AuthRequest, res) => {
  try {
    const vendorId = Number(req.params["vendorId"]);
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be 1-5" });
      return;
    }

    const [existing] = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.vendorId, vendorId), eq(reviewsTable.userId, req.user!.id)));
    if (existing) {
      res.status(400).json({ message: "Already reviewed this vendor" });
      return;
    }

    const [review] = await db
      .insert(reviewsTable)
      .values({ vendorId, userId: req.user!.id, rating, comment })
      .returning();

    // Recalculate rating
    const [{ avg, cnt }] = await db
      .select({
        avg: sql<number>`avg(${reviewsTable.rating})`,
        cnt: sql<number>`count(*)`,
      })
      .from(reviewsTable)
      .where(eq(reviewsTable.vendorId, vendorId));

    await db
      .update(vendorsTable)
      .set({ rating: Number(avg) || 0, totalReviews: Number(cnt) })
      .where(eq(vendorsTable.id, vendorId));

    res.status(201).json({
      ...review,
      userName: req.user!.name,
      userAvatarUrl: req.user!.avatarUrl,
    });
  } catch (err) {
    req.log.error({ err }, "Create review error");
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

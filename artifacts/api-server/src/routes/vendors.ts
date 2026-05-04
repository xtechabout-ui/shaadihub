import { Router } from "express";
import { db } from "@workspace/db";
import {
  vendorsTable,
  vendorImagesTable,
  packagesTable,
} from "@workspace/db";
import { eq, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import { authenticate, requireVendor, type AuthRequest } from "../lib/auth";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

if (process.env["CLOUDINARY_CLOUD_NAME"]) {
  cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    api_key: process.env["CLOUDINARY_API_KEY"],
    api_secret: process.env["CLOUDINARY_API_SECRET"],
  });
}

async function getVendorWithRelations(vendorId: number) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId));
  if (!vendor) return null;

  const images = await db
    .select()
    .from(vendorImagesTable)
    .where(eq(vendorImagesTable.vendorId, vendorId));

  const packages = await db
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.vendorId, vendorId));

  return {
    ...vendor,
    images,
    packages: packages.map((p) => ({
      ...p,
      features: JSON.parse(p.features) as string[],
    })),
  };
}

// GET /vendors
router.get("/vendors", async (req, res) => {
  try {
    const {
      category,
      area,
      city,
      minPrice,
      maxPrice,
      minRating,
      capacity,
      search,
      featured,
      page = "1",
      limit = "12",
    } = req.query as Record<string, string>;

    const conditions: ReturnType<typeof eq>[] = [
      eq(vendorsTable.isSuspended, false),
    ];

    if (category) conditions.push(eq(vendorsTable.category, category as typeof vendorsTable.category._.data));
    if (area) conditions.push(eq(vendorsTable.area, area));
    if (city) conditions.push(eq(vendorsTable.city, city));
    if (minPrice) conditions.push(gte(vendorsTable.priceRangeMin, Number(minPrice)));
    if (maxPrice) conditions.push(lte(vendorsTable.priceRangeMax, Number(maxPrice)));
    if (minRating) conditions.push(gte(vendorsTable.rating, Number(minRating)));
    if (capacity) conditions.push(gte(vendorsTable.capacity, Number(capacity)));
    if (featured === "true") conditions.push(eq(vendorsTable.isFeatured, true));
    if (search) {
      conditions.push(
        or(
          ilike(vendorsTable.title, `%${search}%`),
          ilike(vendorsTable.description, `%${search}%`),
          ilike(vendorsTable.location, `%${search}%`)
        ) as ReturnType<typeof eq>
      );
    }

    const whereClause = and(...conditions);
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vendorsTable)
      .where(whereClause);

    const total = Number(count);
    const vendors = await db
      .select()
      .from(vendorsTable)
      .where(whereClause)
      .limit(limitNum)
      .offset(offset);

    const vendorIds = vendors.map((v) => v.id);
    const images =
      vendorIds.length > 0
        ? await db
            .select()
            .from(vendorImagesTable)
            .where(
              sql`${vendorImagesTable.vendorId} = ANY(${sql.raw(`ARRAY[${vendorIds.join(",")}]`)})` as ReturnType<typeof eq>
            )
        : [];

    const pkgs =
      vendorIds.length > 0
        ? await db
            .select()
            .from(packagesTable)
            .where(
              sql`${packagesTable.vendorId} = ANY(${sql.raw(`ARRAY[${vendorIds.join(",")}]`)})` as ReturnType<typeof eq>
            )
        : [];

    const result = vendors.map((v) => ({
      ...v,
      images: images.filter((i) => i.vendorId === v.id),
      packages: pkgs
        .filter((p) => p.vendorId === v.id)
        .map((p) => ({ ...p, features: JSON.parse(p.features) as string[] })),
    }));

    res.json({
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      vendors: result,
    });
  } catch (err) {
    req.log.error({ err }, "List vendors error");
    res.status(500).json({ message: "Server error" });
  }
});

// GET /vendors/me/profile
router.get("/vendors/me/profile", requireVendor as Parameters<typeof router.get>[1], async (req: AuthRequest, res) => {
  try {
    const [vendor] = await db
      .select()
      .from(vendorsTable)
      .where(eq(vendorsTable.userId, req.user!.id));
    if (!vendor) {
      res.status(404).json({ message: "Vendor not found" });
      return;
    }
    const full = await getVendorWithRelations(vendor.id);
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Get my vendor profile error");
    res.status(500).json({ message: "Server error" });
  }
});

// GET /vendors/:id
router.get("/vendors/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const vendor = await getVendorWithRelations(id);
    if (!vendor) {
      res.status(404).json({ message: "Vendor not found" });
      return;
    }
    await db
      .update(vendorsTable)
      .set({ profileViews: vendor.profileViews + 1 })
      .where(eq(vendorsTable.id, id));
    res.json(vendor);
  } catch (err) {
    req.log.error({ err }, "Get vendor error");
    res.status(500).json({ message: "Server error" });
  }
});

// POST /vendors
router.post("/vendors", requireVendor as Parameters<typeof router.post>[1], async (req: AuthRequest, res) => {
  try {
    const { category, title, description, location, area, city, latitude, longitude, priceRangeMin, priceRangeMax, capacity, whatsapp } = req.body;
    const [vendor] = await db
      .insert(vendorsTable)
      .values({
        userId: req.user!.id,
        category,
        title,
        description,
        location,
        area,
        city: city ?? "Karachi",
        latitude,
        longitude,
        priceRangeMin,
        priceRangeMax,
        capacity,
        whatsapp,
      })
      .returning();
    const full = await getVendorWithRelations(vendor.id);
    res.status(201).json(full);
  } catch (err) {
    req.log.error({ err }, "Create vendor error");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /vendors/:id
router.put("/vendors/:id", requireVendor as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params["id"]);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
    if (!vendor || (vendor.userId !== req.user!.id && req.user!.role !== "admin")) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const { category, title, description, location, area, city, latitude, longitude, priceRangeMin, priceRangeMax, capacity, whatsapp } = req.body;
    await db.update(vendorsTable).set({
      ...(category && { category }),
      ...(title && { title }),
      description,
      location,
      area,
      ...(city && { city }),
      latitude,
      longitude,
      priceRangeMin,
      priceRangeMax,
      ...(capacity !== undefined && { capacity }),
      whatsapp,
    }).where(eq(vendorsTable.id, id));
    const full = await getVendorWithRelations(id);
    res.json(full);
  } catch (err) {
    req.log.error({ err }, "Update vendor error");
    res.status(500).json({ message: "Server error" });
  }
});

// POST /vendors/:id/images
router.post(
  "/vendors/:id/images",
  requireVendor as Parameters<typeof router.post>[1],
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params["id"]);
      const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
      if (!vendor || (vendor.userId !== req.user!.id && req.user!.role !== "admin")) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      let imageUrl = "";
      let publicId = "";

      if (req.file && process.env["CLOUDINARY_CLOUD_NAME"]) {
        const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "shaadihub" },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file!.buffer);
        });
        imageUrl = result.secure_url;
        publicId = result.public_id;
      } else if (req.file) {
        publicId = `local-${Date.now()}`;
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      } else {
        res.status(400).json({ message: "No file provided" });
        return;
      }

      const [image] = await db
        .insert(vendorImagesTable)
        .values({ vendorId: id, imageUrl, publicId })
        .returning();

      if (!vendor.coverImageUrl) {
        await db.update(vendorsTable).set({ coverImageUrl: imageUrl }).where(eq(vendorsTable.id, id));
      }

      res.status(201).json(image);
    } catch (err) {
      req.log.error({ err }, "Upload image error");
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /vendors/:id/images/:imageId
router.delete("/vendors/:id/images/:imageId", requireVendor as Parameters<typeof router.delete>[1], async (req: AuthRequest, res) => {
  try {
    const vendorId = Number(req.params["id"]);
    const imageId = Number(req.params["imageId"]);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
    if (!vendor || (vendor.userId !== req.user!.id && req.user!.role !== "admin")) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const [image] = await db.select().from(vendorImagesTable).where(eq(vendorImagesTable.id, imageId));
    if (image && process.env["CLOUDINARY_CLOUD_NAME"]) {
      await cloudinary.uploader.destroy(image.publicId).catch(() => null);
    }
    await db.delete(vendorImagesTable).where(eq(vendorImagesTable.id, imageId));
    res.json({ message: "Image deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete image error");
    res.status(500).json({ message: "Server error" });
  }
});

// POST /vendors/:id/packages
router.post("/vendors/:id/packages", requireVendor as Parameters<typeof router.post>[1], async (req: AuthRequest, res) => {
  try {
    const vendorId = Number(req.params["id"]);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
    if (!vendor || (vendor.userId !== req.user!.id && req.user!.role !== "admin")) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const { name, description, price, features, isPopular } = req.body;
    const [pkg] = await db
      .insert(packagesTable)
      .values({
        vendorId,
        name,
        description,
        price,
        features: JSON.stringify(features ?? []),
        isPopular: isPopular ?? false,
      })
      .returning();
    res.status(201).json({ ...pkg, features: JSON.parse(pkg.features) as string[] });
  } catch (err) {
    req.log.error({ err }, "Create package error");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /vendors/:id/packages/:pkgId
router.put("/vendors/:id/packages/:pkgId", requireVendor as Parameters<typeof router.put>[1], async (req: AuthRequest, res) => {
  try {
    const vendorId = Number(req.params["id"]);
    const pkgId = Number(req.params["pkgId"]);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
    if (!vendor || (vendor.userId !== req.user!.id && req.user!.role !== "admin")) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const { name, description, price, features, isPopular } = req.body;
    const [pkg] = await db
      .update(packagesTable)
      .set({
        ...(name && { name }),
        description,
        ...(price !== undefined && { price }),
        ...(features !== undefined && { features: JSON.stringify(features) }),
        ...(isPopular !== undefined && { isPopular }),
      })
      .where(eq(packagesTable.id, pkgId))
      .returning();
    res.json({ ...pkg, features: JSON.parse(pkg.features) as string[] });
  } catch (err) {
    req.log.error({ err }, "Update package error");
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /vendors/:id/packages/:pkgId
router.delete("/vendors/:id/packages/:pkgId", requireVendor as Parameters<typeof router.delete>[1], async (req: AuthRequest, res) => {
  try {
    const vendorId = Number(req.params["id"]);
    const pkgId = Number(req.params["pkgId"]);
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
    if (!vendor || (vendor.userId !== req.user!.id && req.user!.role !== "admin")) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    await db.delete(packagesTable).where(eq(packagesTable.id, pkgId));
    res.json({ message: "Package deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete package error");
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const vendorCategoryEnum = pgEnum("vendor_category", [
  "Marriage Hall",
  "Catering",
  "Photography",
  "Videography",
  "Decoration",
  "Car Rental",
  "Event Planner",
  "Makeup & Beauty",
]);

export const vendorsTable = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  category: vendorCategoryEnum("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  area: text("area"),
  city: text("city").notNull().default("Karachi"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  priceRangeMin: doublePrecision("price_range_min"),
  priceRangeMax: doublePrecision("price_range_max"),
  capacity: integer("capacity"),
  whatsapp: text("whatsapp"),
  coverImageUrl: text("cover_image_url"),
  verified: boolean("verified").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  rating: doublePrecision("rating").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  profileViews: integer("profile_views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vendorImagesTable = pgTable("vendor_images", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendorsTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  publicId: text("public_id").notNull(),
});

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendorsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  features: text("features").notNull().default("[]"),
  isPopular: boolean("is_popular").notNull().default(false),
});

export const insertVendorSchema = createInsertSchema(vendorsTable).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalReviews: true,
  profileViews: true,
  verified: true,
  isFeatured: true,
  isSuspended: true,
});

export const insertVendorImageSchema = createInsertSchema(vendorImagesTable).omit({ id: true });
export const insertPackageSchema = createInsertSchema(packagesTable).omit({ id: true });

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendorsTable.$inferSelect;
export type VendorImage = typeof vendorImagesTable.$inferSelect;
export type Package = typeof packagesTable.$inferSelect;

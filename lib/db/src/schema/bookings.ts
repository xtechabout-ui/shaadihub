import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { vendorsTable } from "./vendors";
import { packagesTable } from "./vendors";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendorsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  packageId: integer("package_id").references(() => packagesTable.id, {
    onDelete: "set null",
  }),
  eventDate: text("event_date").notNull(),
  guestCount: integer("guest_count"),
  notes: text("notes"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

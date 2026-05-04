import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { vendorsTable } from "./vendors";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "premium"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .unique()
    .references(() => vendorsTable.id, { onDelete: "cascade" }),
  plan: subscriptionPlanEnum("plan").notNull().default("free"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;

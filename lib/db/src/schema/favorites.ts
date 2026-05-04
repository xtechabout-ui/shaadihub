import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { vendorsTable } from "./vendors";

export const favoritesTable = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendorsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.vendorId)]
);

export type Favorite = typeof favoritesTable.$inferSelect;

import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { journeys } from "./journeys";

// Append-only snapshots retain earlier summaries when a discovery changes.
export const discoveryRevisions = pgTable("discovery_revisions", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  snapshot: jsonb("snapshot").$type<unknown>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

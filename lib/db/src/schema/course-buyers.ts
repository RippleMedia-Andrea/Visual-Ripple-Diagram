import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const courseBuyers = pgTable("course_buyers", {
  email: text("email").primaryKey(),
  source: text("source").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
});
export const insertCourseBuyerSchema = createInsertSchema(courseBuyers);
export type CourseBuyer = typeof courseBuyers.$inferSelect;

export const courseWebhookSettings = pgTable("course_webhook_settings", {
  id: integer("id").primaryKey().default(1),
  ownerId: text("owner_id").notNull(),
  courseId: text("course_id").notNull().default(""),
  offerPricePlanId: text("offer_price_plan_id").notNull().default(""),
  tokenHash: text("token_hash"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const courseWebhookEvents = pgTable("course_webhook_events", {
  id: serial("id").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  eventKey: text("event_key"),
  outcome: text("outcome").notNull(),
});

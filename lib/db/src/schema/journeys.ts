import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const journeyStatus = pgEnum("journey_status", ["in_progress", "complete"]);
export const journeyStage = pgEnum("journey_stage", [
  "reveal",
  "identify",
  "pinpoint",
  "personalize",
  "live",
  "expand",
]);
export const messageRole = pgEnum("journey_message_role", ["user", "assistant"]);

export const journeys = pgTable(
  "journeys",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: journeyStatus("status").default("in_progress").notNull(),
    currentStageIdx: integer("current_stage_idx").default(0).notNull(),
    selectedPrompts: jsonb("selected_prompts").$type<string[]>().default([]).notNull(),
    purposeOptions: jsonb("purpose_options").$type<string[]>().default([]).notNull(),
    purposeStatement: text("purpose_statement"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("journeys_user_id_idx").on(table.userId),
    index("journeys_user_status_idx").on(table.userId, table.status),
  ],
);

export const journeyMessages = pgTable(
  "journey_messages",
  {
    id: serial("id").primaryKey(),
    journeyId: integer("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "cascade" }),
    stage: journeyStage("stage").notNull(),
    role: messageRole("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("journey_messages_journey_id_idx").on(table.journeyId),
    index("journey_messages_created_at_idx").on(table.createdAt),
  ],
);

export type Journey = typeof journeys.$inferSelect;
export type JourneyMessage = typeof journeyMessages.$inferSelect;
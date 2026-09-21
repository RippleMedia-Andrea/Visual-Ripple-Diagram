import {
  boolean,
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

export type Season = {
  summary: string;
  roles: string[];
  capacity: string;
  constraints: string[];
  opportunities: string[];
  expressions: string[];
};
export type ActionPlan = {
  start: string[];
  stop: string[];
  continue: string[];
  oneStepThisWeek: string;
};
export type Evidence = { storyTitle: string; detail: string };

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
    season: jsonb("season").$type<Season | null>(),
    actionPlan: jsonb("action_plan").$type<ActionPlan | null>(),
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

export const storyCards = pgTable("story_cards", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  promptId: text("prompt_id"),
  isDifficultExperience: boolean("is_difficult_experience").default(false).notNull(),
  actions: jsonb("actions").$type<string[]>().default([]).notNull(),
  feelings: jsonb("feelings").$type<string[]>().default([]).notNull(),
  people: jsonb("people").$type<string[]>().default([]).notNull(),
  impact: jsonb("impact").$type<string[]>().default([]).notNull(),
  userEdited: boolean("user_edited").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const purposeThemes = pgTable("purpose_themes", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  evidence: jsonb("evidence").$type<Evidence[]>().default([]).notNull(),
  userEdited: boolean("user_edited").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Journey = typeof journeys.$inferSelect;
export type JourneyMessage = typeof journeyMessages.$inferSelect;
export type StoryCard = typeof storyCards.$inferSelect;
export type PurposeTheme = typeof purposeThemes.$inferSelect;
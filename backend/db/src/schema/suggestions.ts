import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { reviewsTable } from "./reviews";

export const suggestionsTable = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviewsTable.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // security | performance | style | logic | best-practice
  severity: text("severity").notNull(), // critical | warning | info
  lineStart: integer("line_start"),
  lineEnd: integer("line_end"),
  message: text("message").notNull(),
  suggestedCode: text("suggested_code"),
  explanation: text("explanation").notNull(),
  feedback: text("feedback"), // accepted | rejected | null
  feedbackNote: text("feedback_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSuggestionSchema = createInsertSchema(suggestionsTable).omit({ id: true, createdAt: true });
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestionsTable.$inferSelect;

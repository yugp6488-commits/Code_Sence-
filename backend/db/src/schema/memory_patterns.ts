import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memoryPatternsTable = pgTable("memory_patterns", {
  id: serial("id").primaryKey(),
  pattern: text("pattern").notNull(),
  category: text("category").notNull(),
  language: text("language"),
  projectId: integer("project_id"),
  confidence: real("confidence").notNull().default(0.5),
  occurrences: integer("occurrences").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMemoryPatternSchema = createInsertSchema(memoryPatternsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMemoryPattern = z.infer<typeof insertMemoryPatternSchema>;
export type MemoryPattern = typeof memoryPatternsTable.$inferSelect;

import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, reviewsTable, suggestionsTable, memoryPatternsTable } from "@workspace/db";
import { GetMemoryStatsQueryParams, ListMemoryPatternsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/memory/stats", async (req, res): Promise<void> => {
  const query = GetMemoryStatsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const [totalReviewsRow] = await db.select({ count: count() }).from(reviewsTable);
  const [totalSuggestionsRow] = await db.select({ count: count() }).from(suggestionsTable);
  const [acceptedRow] = await db
    .select({ count: count() })
    .from(suggestionsTable)
    .where(eq(suggestionsTable.feedback, "accepted"));
  const [feedbackTotalRow] = await db
    .select({ count: count() })
    .from(suggestionsTable)
    .where(sql`${suggestionsTable.feedback} IS NOT NULL`);

  const totalFeedback = feedbackTotalRow?.count ?? 0;
  const accepted = acceptedRow?.count ?? 0;
  const acceptanceRate = totalFeedback > 0 ? Math.round((accepted / totalFeedback) * 100) : 0;

  // Top issues by category
  const categoryStats = await db
    .select({
      category: suggestionsTable.category,
      total: count(),
      accepted: sql<number>`COUNT(CASE WHEN feedback = 'accepted' THEN 1 END)`,
      feedbackTotal: sql<number>`COUNT(CASE WHEN feedback IS NOT NULL THEN 1 END)`,
    })
    .from(suggestionsTable)
    .groupBy(suggestionsTable.category)
    .orderBy(sql`COUNT(*) DESC`);

  const topIssues = categoryStats.map((c) => ({
    category: c.category,
    count: c.total,
    acceptanceRate:
      Number(c.feedbackTotal) > 0 ? Math.round((Number(c.accepted) / Number(c.feedbackTotal)) * 100) : 0,
  }));

  // Language breakdown
  const langStats = await db
    .select({ language: reviewsTable.language, count: count() })
    .from(reviewsTable)
    .groupBy(reviewsTable.language)
    .orderBy(sql`COUNT(*) DESC`);

  const languageBreakdown = langStats.map((l) => ({ language: l.language, count: l.count }));

  // Patterns learned
  const [patternsRow] = await db.select({ count: count() }).from(memoryPatternsTable);
  const patternsLearned = patternsRow?.count ?? 0;

  // Learning progress: 0-100 based on acceptance rate and pattern count
  const learningProgress = Math.min(
    100,
    Math.round(acceptanceRate * 0.6 + Math.min(40, patternsLearned * 2))
  );

  res.json({
    totalReviews: totalReviewsRow?.count ?? 0,
    totalSuggestions: totalSuggestionsRow?.count ?? 0,
    acceptanceRate,
    topIssues,
    languageBreakdown,
    learningProgress,
    patternsLearned,
  });
});

router.get("/memory/patterns", async (req, res): Promise<void> => {
  const query = ListMemoryPatternsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(memoryPatternsTable).$dynamic();
  if (query.data.projectId != null) {
    q = q.where(eq(memoryPatternsTable.projectId, query.data.projectId));
  }
  if (query.data.language) {
    q = q.where(eq(memoryPatternsTable.language, query.data.language));
  }

  const patterns = await q.orderBy(sql`${memoryPatternsTable.confidence} DESC`);
  res.json(patterns);
});

export default router;

import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, reviewsTable, suggestionsTable, projectsTable, teamsTable } from "@workspace/db";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  const [totalReviewsRow] = await db.select({ count: count() }).from(reviewsTable);
  const [totalProjectsRow] = await db.select({ count: count() }).from(projectsTable);
  const [totalTeamsRow] = await db.select({ count: count() }).from(teamsTable);
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

  // Reviews this week
  const [weekRow] = await db
    .select({ count: count() })
    .from(reviewsTable)
    .where(sql`${reviewsTable.createdAt} >= NOW() - INTERVAL '7 days'`);

  // Language breakdown
  const langStats = await db
    .select({ language: reviewsTable.language, count: count() })
    .from(reviewsTable)
    .groupBy(reviewsTable.language)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  const topLanguages = langStats.map((l) => ({ language: l.language, count: l.count }));

  // Severity breakdown
  const severityStats = await db
    .select({ severity: suggestionsTable.severity, count: count() })
    .from(suggestionsTable)
    .groupBy(suggestionsTable.severity)
    .orderBy(sql`COUNT(*) DESC`);

  const severityBreakdown = severityStats.map((s) => ({ severity: s.severity, count: s.count }));

  res.json({
    totalReviews: totalReviewsRow?.count ?? 0,
    totalProjects: totalProjectsRow?.count ?? 0,
    totalTeams: totalTeamsRow?.count ?? 0,
    totalSuggestions: totalSuggestionsRow?.count ?? 0,
    acceptanceRate,
    reviewsThisWeek: weekRow?.count ?? 0,
    topLanguages,
    severityBreakdown,
  });
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 20;

  // Recent reviews as activity items
  const recentReviews = await db
    .select({
      id: reviewsTable.id,
      title: reviewsTable.title,
      language: reviewsTable.language,
      projectId: reviewsTable.projectId,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .orderBy(sql`${reviewsTable.createdAt} DESC`)
    .limit(limit);

  const activity = await Promise.all(
    recentReviews.map(async (review) => {
      const projectRow = review.projectId
        ? await db.select().from(projectsTable).where(eq(projectsTable.id, review.projectId)).limit(1)
        : [];

      const [countRow] = await db
        .select({ count: count() })
        .from(suggestionsTable)
        .where(eq(suggestionsTable.reviewId, review.id));

      const suggestionCount = countRow?.count ?? 0;

      return {
        id: review.id,
        type: "review_completed",
        reviewId: review.id,
        reviewTitle: review.title,
        language: review.language,
        projectName: projectRow[0]?.name ?? null,
        details: `${suggestionCount} suggestion${suggestionCount !== 1 ? "s" : ""} generated`,
        createdAt: review.createdAt,
      };
    })
  );

  res.json(activity);
});

export default router;

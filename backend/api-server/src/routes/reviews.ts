import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, reviewsTable, suggestionsTable, projectsTable, memoryPatternsTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  CreateReviewBody,
  GetReviewParams,
  DeleteReviewParams,
  SubmitFeedbackParams,
  SubmitFeedbackBody,
} from "@workspace/api-zod";
import { generateMockSuggestions, extractPatternsFromFeedback, generateCodeExplanation } from "../lib/mock-ai";

const router: IRouter = Router();

async function enrichReview(review: typeof reviewsTable.$inferSelect) {
  const projectRow = review.projectId
    ? await db.select().from(projectsTable).where(eq(projectsTable.id, review.projectId)).limit(1)
    : [];

  const [counts] = await db
    .select({
      total: count(),
      accepted: sql<number>`COUNT(CASE WHEN feedback = 'accepted' THEN 1 END)`,
      rejected: sql<number>`COUNT(CASE WHEN feedback = 'rejected' THEN 1 END)`,
    })
    .from(suggestionsTable)
    .where(eq(suggestionsTable.reviewId, review.id));

  return {
    ...review,
    projectName: projectRow[0]?.name ?? null,
    suggestionCount: counts?.total ?? 0,
    acceptedCount: Number(counts?.accepted ?? 0),
    rejectedCount: Number(counts?.rejected ?? 0),
  };
}

router.get("/reviews", async (req, res): Promise<void> => {
  const query = ListReviewsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(reviewsTable).$dynamic();
  if (query.data.projectId != null) {
    q = q.where(eq(reviewsTable.projectId, query.data.projectId));
  }
  if (query.data.language) {
    q = q.where(eq(reviewsTable.language, query.data.language));
  }
  if (query.data.status) {
    q = q.where(eq(reviewsTable.status, query.data.status));
  }

  const reviews = await q.orderBy(sql`${reviewsTable.createdAt} DESC`);
  const enriched = await Promise.all(reviews.map(enrichReview));
  res.json(enriched);
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      title: parsed.data.title,
      code: parsed.data.code,
      language: parsed.data.language,
      projectId: parsed.data.projectId ?? null,
      context: parsed.data.context ?? null,
      status: "completed",
    })
    .returning();

  // Generate AI suggestions via Gemini
  const mockSuggestions = await generateMockSuggestions(parsed.data.code, parsed.data.language, parsed.data.context);

  const insertedSuggestions = await Promise.all(
    mockSuggestions.map((s) =>
      db
        .insert(suggestionsTable)
        .values({
          reviewId: review.id,
          category: s.category,
          severity: s.severity,
          lineStart: s.lineStart ?? null,
          lineEnd: s.lineEnd ?? null,
          message: s.message,
          suggestedCode: s.suggestedCode ?? null,
          explanation: s.explanation,
          feedback: null,
          feedbackNote: null,
        })
        .returning()
    )
  );

  const suggestions = insertedSuggestions.map((r) => r[0]);

  res.status(201).json({
    ...review,
    projectName: null,
    suggestions,
  });
});

router.get("/reviews/:id", async (req, res): Promise<void> => {
  const params = GetReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, params.data.id));
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const suggestions = await db
    .select()
    .from(suggestionsTable)
    .where(eq(suggestionsTable.reviewId, review.id))
    .orderBy(sql`${suggestionsTable.lineStart} ASC NULLS LAST`);

  const projectRow = review.projectId
    ? await db.select().from(projectsTable).where(eq(projectsTable.id, review.projectId)).limit(1)
    : [];

  res.json({
    ...review,
    projectName: projectRow[0]?.name ?? null,
    suggestions,
  });
});

router.post("/reviews/:id/explain", async (req, res): Promise<void> => {
  const params = GetReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, params.data.id));
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const explanation = await generateCodeExplanation(review.code, review.language, review.context);
  res.json(explanation);
});

router.delete("/reviews/:id", async (req, res): Promise<void> => {
  const params = DeleteReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(reviewsTable)
    .where(eq(reviewsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/reviews/:id/feedback", async (req, res): Promise<void> => {
  const params = SubmitFeedbackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [suggestion] = await db
    .update(suggestionsTable)
    .set({
      feedback: parsed.data.feedback,
      feedbackNote: parsed.data.note ?? null,
    })
    .where(
      sql`${suggestionsTable.id} = ${parsed.data.suggestionId} AND ${suggestionsTable.reviewId} = ${params.data.id}`
    )
    .returning();

  if (!suggestion) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }

  // After feedback, update or create memory patterns
  const review = await db.select().from(reviewsTable).where(eq(reviewsTable.id, params.data.id)).limit(1);
  if (review[0]) {
    const allSuggestions = await db
      .select()
      .from(suggestionsTable)
      .where(eq(suggestionsTable.reviewId, params.data.id));

    const patterns = extractPatternsFromFeedback(
      allSuggestions.map((s) => ({
        category: s.category,
        severity: s.severity,
        feedback: s.feedback,
        message: s.message,
      })),
      review[0].language
    );

    // Upsert patterns into memory
    for (const p of patterns) {
      const [existing] = await db
        .select()
        .from(memoryPatternsTable)
        .where(
          sql`${memoryPatternsTable.pattern} = ${p.pattern} AND ${memoryPatternsTable.language} = ${review[0].language}`
        )
        .limit(1);

      if (existing) {
        await db
          .update(memoryPatternsTable)
          .set({
            occurrences: existing.occurrences + 1,
            confidence: Math.min(0.99, (existing.confidence + p.confidence) / 2 + 0.05),
          })
          .where(eq(memoryPatternsTable.id, existing.id));
      } else {
        await db.insert(memoryPatternsTable).values({
          pattern: p.pattern,
          category: p.category,
          language: review[0].language,
          projectId: review[0].projectId ?? null,
          confidence: p.confidence,
          occurrences: 1,
        });
      }
    }
  }

  res.json(suggestion);
});

export default router;

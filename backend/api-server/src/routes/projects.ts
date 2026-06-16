import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, projectsTable, teamsTable, reviewsTable, suggestionsTable } from "@workspace/db";
import {
  ListProjectsQueryParams,
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichProject(project: typeof projectsTable.$inferSelect) {
  const teamRow = project.teamId
    ? await db.select().from(teamsTable).where(eq(teamsTable.id, project.teamId)).limit(1)
    : [];

  const [reviewCountRow] = await db
    .select({ count: count() })
    .from(reviewsTable)
    .where(eq(reviewsTable.projectId, project.id));

  const totalReviews = reviewCountRow?.count ?? 0;

  let acceptanceRate = 0;
  if (totalReviews > 0) {
    const [acceptedRow] = await db
      .select({ count: count() })
      .from(suggestionsTable)
      .innerJoin(reviewsTable, eq(suggestionsTable.reviewId, reviewsTable.id))
      .where(
        sql`${reviewsTable.projectId} = ${project.id} AND ${suggestionsTable.feedback} = 'accepted'`
      );

    const [totalSugRow] = await db
      .select({ count: count() })
      .from(suggestionsTable)
      .innerJoin(reviewsTable, eq(suggestionsTable.reviewId, reviewsTable.id))
      .where(sql`${reviewsTable.projectId} = ${project.id} AND ${suggestionsTable.feedback} IS NOT NULL`);

    const total = totalSugRow?.count ?? 0;
    acceptanceRate = total > 0 ? Math.round(((acceptedRow?.count ?? 0) / total) * 100) : 0;
  }

  return {
    ...project,
    teamName: teamRow[0]?.name ?? null,
    reviewCount: totalReviews,
    acceptanceRate,
  };
}

router.get("/projects", async (req, res): Promise<void> => {
  const query = ListProjectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db.select().from(projectsTable).$dynamic();
  if (query.data.teamId != null) {
    q = q.where(eq(projectsTable.teamId, query.data.teamId));
  }

  const projects = await q.orderBy(projectsTable.createdAt);
  const enriched = await Promise.all(projects.map(enrichProject));
  res.json(enriched);
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.insert(projectsTable).values(parsed.data).returning();
  const enriched = await enrichProject(project);
  res.status(201).json(enriched);
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const enriched = await enrichProject(project);
  res.json(enriched);
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const enriched = await enrichProject(project);
  res.json(enriched);
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

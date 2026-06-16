import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, teamsTable, projectsTable, reviewsTable } from "@workspace/db";
import {
  CreateTeamBody,
  GetTeamParams,
  DeleteTeamParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/teams", async (req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.createdAt);

  const results = await Promise.all(
    teams.map(async (team) => {
      const [projectCountRow] = await db
        .select({ count: count() })
        .from(projectsTable)
        .where(eq(projectsTable.teamId, team.id));

      const [reviewCountRow] = await db
        .select({ count: count() })
        .from(reviewsTable)
        .innerJoin(projectsTable, eq(reviewsTable.projectId, projectsTable.id))
        .where(eq(projectsTable.teamId, team.id));

      return {
        ...team,
        projectCount: projectCountRow?.count ?? 0,
        reviewCount: reviewCountRow?.count ?? 0,
      };
    })
  );

  res.json(results);
});

router.post("/teams", async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db.insert(teamsTable).values(parsed.data).returning();
  res.status(201).json({ ...team, projectCount: 0, reviewCount: 0 });
});

router.get("/teams/:id", async (req, res): Promise<void> => {
  const params = GetTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const [projectCountRow] = await db
    .select({ count: count() })
    .from(projectsTable)
    .where(eq(projectsTable.teamId, team.id));

  const [reviewCountRow] = await db
    .select({ count: count() })
    .from(reviewsTable)
    .innerJoin(projectsTable, eq(reviewsTable.projectId, projectsTable.id))
    .where(eq(projectsTable.teamId, team.id));

  res.json({
    ...team,
    projectCount: projectCountRow?.count ?? 0,
    reviewCount: reviewCountRow?.count ?? 0,
  });
});

router.delete("/teams/:id", async (req, res): Promise<void> => {
  const params = DeleteTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(teamsTable).where(eq(teamsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

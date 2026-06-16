import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import projectsRouter from "./projects";
import reviewsRouter from "./reviews";
import memoryRouter from "./memory";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(projectsRouter);
router.use(reviewsRouter);
router.use(memoryRouter);
router.use(dashboardRouter);

export default router;

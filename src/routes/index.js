import { Router } from "express";
import authRouter from "./auth.routes.js";
import adminRouter from "./admin.routes.js";
import dashboardRouter from "./dashboard.routes.js";
import auditRouter from "./audit.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/admin/dashboard", dashboardRouter);
router.use("/audit", auditRouter);

export default router;
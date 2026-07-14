import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getMyAuditLogs } from "../controllers/audit.controller.js";
import { getAllAuditLogs } from "../controllers/audit.controller.js";
import {getAuditStatistics} from "../controllers/audit.controller.js";
import verifyRole from "../middlewares/role.middleware.js";


const router = Router();

router.get(
    "/my-logs",
    verifyJWT,
    getMyAuditLogs
);

router.get(
    "/audit-logs",
    verifyJWT,
    verifyRole("ADMIN"),
    getAllAuditLogs
);

router.get(
    "/audit-logs/stats",
    verifyJWT,
    verifyRole("ADMIN"),
    getAuditStatistics
);
export default router;
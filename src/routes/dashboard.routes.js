import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import verifyRole from "../middlewares/role.middleware.js";
import { getDashboardOverview } from "../controllers/dashboard.controller.js";
import { getUserAnalytics } from "../controllers/dashboard.controller.js";
import {getRegistrationAnalytics} from "../controllers/dashboard.controller.js";
import {getRecentUsers} from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
    "/",
    verifyJWT,
    verifyRole("ADMIN"),
    getDashboardOverview
);

router.get(
    "/user-analytics",
    verifyJWT,
    verifyRole("ADMIN"),
    getUserAnalytics
);

router.get(
    "/registration-analytics",
    verifyJWT,
    verifyRole("ADMIN"),
    getRegistrationAnalytics
);

router.get(
    "/recent-users",
    verifyJWT,
    verifyRole("ADMIN"),
    getRecentUsers
);

export default router;
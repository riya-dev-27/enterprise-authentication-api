import { Router } from "express";
import { getAllUsers } from "../controllers/admin.controller.js";
import { getUserById } from "../controllers/admin.controller.js";
import { updateUserRole } from "../controllers/admin.controller.js";
import { updateUserStatus } from "../controllers/admin.controller.js";
import { deleteUser } from "../controllers/admin.controller.js";
import { restoreUser } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import verifyRole from "../middlewares/role.middleware.js";

const router = Router();

router.route("/users").get(
    verifyJWT,
    verifyRole("ADMIN"),
    getAllUsers
);

router.get(
    "/users/:userId",
    verifyJWT,
    verifyRole("ADMIN"),
    getUserById
);

router.patch(
    "/users/:userId/role",
    verifyJWT,
    verifyRole("ADMIN"),
    updateUserRole
);

router.patch(
    "/users/:userId/status",
    verifyJWT,
    verifyRole("ADMIN"),
    updateUserStatus
);

router.delete(
    "/users/:userId",
    verifyJWT,
    verifyRole("ADMIN"),
    deleteUser
);

router.patch(
    "/restore-user/:userId",
    verifyJWT,
    verifyRole("admin"),
    restoreUser
);
export default router;
import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { loginUser } from "../controllers/auth.controller.js";
import {getCurrentUser } from "../controllers/auth.controller.js";
import {logoutUser } from "../controllers/auth.controller.js";
import {refreshAccessToken } from "../controllers/auth.controller.js";
import {changeCurrentPassword } from "../controllers/auth.controller.js";
import {updateAccountDetails } from "../controllers/auth.controller.js";
import {updateUserAvatar } from "../controllers/auth.controller.js";
import {deleteUserAvatar } from "../controllers/auth.controller.js";
import {deleteAccount} from "../controllers/auth.controller.js";
import { sendVerificationEmail } from "../controllers/auth.controller.js";
import { verifyEmail } from "../controllers/auth.controller.js";
import { resendVerificationEmail } from "../controllers/auth.controller.js";
import { forgotPassword } from "../controllers/auth.controller.js";
import { resendResetPasswordOTP } from "../controllers/auth.controller.js";
import { resetPassword} from "../controllers/auth.controller.js";


import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";



const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post( verifyJWT,changeCurrentPassword);
router
.route("/update-account")
.patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
);
router.route("/delete-avatar").delete(
    verifyJWT,
    deleteUserAvatar
);

router.route("/delete-account").delete(
    verifyJWT, 
    deleteAccount
);

router.route("/send-verification-email").post(
    verifyJWT,
    sendVerificationEmail
);
router.route("/verify-email").post(
    verifyJWT, 
    verifyEmail
);
router.route("/resend-verification-email").post(
    verifyJWT,
    resendVerificationEmail
);

router.route("/forgot-password").post(forgotPassword);
router.route("/resend-reset-password-otp").post(resendResetPasswordOTP);
router.route("/reset-password").post(resetPassword);



export default router;
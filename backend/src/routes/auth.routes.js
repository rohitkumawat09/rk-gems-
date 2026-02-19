import express from "express";
import { register, login, refresh, logout, requestOtp, verifyOtp, forgotPassword, verifyResetOtp, resetPassword, me } from "../controllers/auth.controller.js";
import { loginLimiter, otpLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/request-otp", otpLimiter, requestOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-reset-otp", otpLimiter, verifyResetOtp);
router.post("/reset-password", otpLimiter, resetPassword);
router.post("/refresh", refresh);
router.get("/me", me);
router.post("/logout", logout);

export default router;

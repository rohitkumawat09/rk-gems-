import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3,
  message: "Too many attempts. Try after 1 minute"
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // allow 10 requests per IP per window
  message: "Too many OTP requests from this IP, please try later"
});
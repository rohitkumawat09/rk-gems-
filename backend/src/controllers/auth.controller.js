import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { validateLogin, validateRegister, validateForgotPassword, validateResetPassword, validateVerifyResetOtp } from "../validations/auth.validation.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken
} from "../utils/jwt.js";
import { hashRefreshToken, compareRefreshToken } from "../utils/hash.js";
import { MAX_LOGIN_ATTEMPTS } from "../utils/constants.js";
import { requestOtp as requestOtpService, verifyOtp as verifyOtpService, forgotPassword as forgotPasswordService, verifyResetOtp as verifyResetOtpService, resetPassword as resetPasswordService } from "../services/auth.service.js";

// Helper to create and store refresh token document (hashed)
const createRefreshTokenDocument = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const tokenHash = await hashRefreshToken(token); // Hash before storing
  await RefreshToken.create({ user: userId, tokenHash, expiresAt });
};

// Register only VENDOR and CUSTOMER
export const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!validateRegister(req.body))
      return res.status(400).json({ message: "Invalid data" });

    // If role provided it must be valid; if absent, default to CUSTOMER below
    if (role && !["VENDOR", "CUSTOMER"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "User exists" });

    // Default to CUSTOMER if no role provided, otherwise use VENDOR
    const userRole = role || "CUSTOMER";

    await User.create({ email, password, role: userRole });
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    next(err);
  }
};

// Login: check lock, increment attempts, issue tokens and store refresh token
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 LOGIN ATTEMPT:", { email, password });

    if (!validateLogin(req.body)) {
      console.log("❌ VALIDATION FAILED - email or password empty");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = await User.findOne({ email });
    console.log("👤 USER FOUND IN DB:", user ? `${user.email} (${user.role})` : "NOT FOUND");

    if (!user) {
      console.log("❌ USER NOT FOUND in database");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("🔒 CHECKING IF ACCOUNT LOCKED:", user.isLocked ? "YES (LOCKED)" : "NO (UNLOCKED)");

    if (user.isLocked) {
      console.log("❌ ACCOUNT IS LOCKED");
      return res.status(423).json({ message: "Account locked for 1 hour" });
    }

    console.log("🔑 COMPARING PASSWORD...");
    const match = await user.comparePassword(password);
    console.log("✅ PASSWORD MATCH:", match ? "YES" : "NO");

    if (!match) {
      console.log("❌ PASSWORD INCORRECT - incrementing login attempts");
      await user.incLoginAttempts();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // successful login - reset attempts
    console.log("✅ LOGIN SUCCESSFUL - resetting login attempts");
    await user.resetLoginAttempts();
    // Instead of issuing tokens immediately, send OTP for 2FA
    try {
      await requestOtpService(email);
      return res.json({ success: true, message: "OTP sent to email for verification" });
    } catch (err) {
      return next(err);
    }
  } catch (err) {
    console.error("💥 LOGIN ERROR:", err.message);
    next(err);
  }
};

// Request OTP (email) endpoint
export const requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    await requestOtpService(email);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    next(err);
  }
};

// Verify OTP endpoint - on success issue tokens
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await verifyOtpService(email, otp);

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createRefreshTokenDocument(user._id, refreshToken);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, accessToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

// Me: return current user based on access token in HttpOnly cookie
export const me = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    console.log(`🔍 ME: accessToken present? ${!!accessToken}`);
    if (!accessToken) {
      console.log("🔒 ME: No access token in cookies -> 401");
      return res.status(401).json({ message: "No access token" });
    }

    let payload;
    try {
      console.log("🔐 ME: Verifying access token...");
      payload = verifyAccessToken(accessToken);
      console.log(`🔐 ME: Access token valid for user ${payload.id}`);
    } catch (err) {
      console.log("❌ ME: Access token verification failed:", err.message);
      return res.status(401).json({ message: "Invalid access token" });
    }

    const user = await User.findById(payload.id).select("_id email role");
    if (!user) {
      console.log(`❌ ME: User not found for id ${payload.id}`);
      return res.status(401).json({ message: "User not found" });
    }

    console.log(`✅ ME: Returning user ${user.email} (${user._id})`);
    res.json({ success: true, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

// Refresh: implement rotation and reuse detection with hashed tokens
export const refresh = async (req, res, next) => {
  try {
    // Get refresh token from HttpOnly cookie
    const refreshToken = req.cookies.refreshToken;
    console.log(`🔁 REFRESH: refreshToken present? ${!!refreshToken}`);
    if (!refreshToken) {
      console.log("🔒 REFRESH: No refresh token in cookies -> 401");
      return res.status(401).json({ message: "No refresh token" });
    }

    let payload;
    try {
      console.log("🔐 REFRESH: Verifying refresh token...");
      payload = verifyRefreshToken(refreshToken);
      console.log(`🔐 REFRESH: Refresh token valid for user ${payload.id}`);
    } catch (err) {
      // token invalid or expired - try decode to detect potential reuse
      console.log("❌ REFRESH: Refresh token verification failed:", err.message);
      const decoded = jwt.decode(refreshToken);
      console.log("🔎 REFRESH: Decoded payload (for reuse detection):", decoded);
      if (decoded?.id) {
        console.log(`⚠️ REFRESH: Possible reuse detected for user ${decoded.id} - revoking all tokens`);
        await RefreshToken.updateMany(
          { user: decoded.id },
          { isRevoked: true }
        );
      }
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Find all valid tokens for this user and check hash match
    const tokenDocs = await RefreshToken.find({
      user: payload.id,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });

    console.log(`🔎 REFRESH: found ${tokenDocs.length} non-revoked refresh token docs for user ${payload.id}`);

    let tokenDoc = null;
    for (const doc of tokenDocs) {
      const isMatch = await compareRefreshToken(refreshToken, doc.tokenHash);
      if (isMatch) {
        tokenDoc = doc;
        break;
      }
    }

    if (!tokenDoc) {
      // token not found or hash mismatch - possible reuse attack
      console.warn(`⚠️ POSSIBLE TOKEN REUSE: User ${payload.id}`);
      await RefreshToken.updateMany(
        { user: payload.id },
        { isRevoked: true }
      );
      console.log(`🔒 REFRESH: All tokens revoked for user ${payload.id} due to reuse detection`);
      return res.status(401).json({ message: "Refresh token reuse detected" });
    }

    // Valid token found - rotate: revoke old token, issue new tokens
    console.log(`🔁 REFRESH: Valid token document found ${tokenDoc._id} - revoking and rotating`);
    await RefreshToken.updateOne({ _id: tokenDoc._id }, { isRevoked: true });

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await createRefreshTokenDocument(user._id, newRefreshToken);

    // Set new access token as HttpOnly cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Set new refresh token as HttpOnly cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log(`✅ TOKEN ROTATION: New tokens issued for user ${user._id}`);
    console.log(`🔁 REFRESH: Rotation complete for user ${user._id}`);
    res.json({ 
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Logout: Revoke all refresh tokens for user (role-independent, production-ready)
export const logout = async (req, res, next) => {
  try {
    // Get refresh token from HttpOnly cookie
    const refreshToken = req.cookies.refreshToken;
    
    console.log(`🔐 LOGOUT: refreshToken present? ${!!refreshToken}`);
    console.log("🔐 LOGOUT: Clearing accessToken and refreshToken cookies (if present)");

    // Always clear both cookies regardless of token validity
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      path: "/"
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      path: "/"
    });

    // If no token in cookie, still return success (idempotent)
    if (!refreshToken) {
      console.log("⚠️ LOGOUT: No refresh token in cookie");
      return res.json({ 
        success: true,
        message: "Logged out successfully" 
      });
    }

    // Decode token to extract userId (without verification)
    let userId;
    try {
      const decoded = jwt.decode(refreshToken);
      console.log("🔎 LOGOUT: Decoded refresh token payload:", decoded);
      userId = decoded?.id;
      
      if (!userId) {
        console.log("⚠️ LOGOUT: Invalid token format - no user id");
        return res.json({ 
          success: true,
          message: "Logged out successfully" 
        });
      }
    } catch (err) {
      console.log("⚠️ LOGOUT: Token decode failed", err.message);
      return res.json({ 
        success: true,
        message: "Logged out successfully" 
      });
    }

    // Revoke ALL refresh tokens for this user
    const result = await RefreshToken.updateMany(
      { user: userId },
      { isRevoked: true },
      { new: true }
    );

    console.log(`✅ LOGOUT SUCCESS: User ${userId} - ${result.modifiedCount} tokens revoked`);
    
    res.json({ 
      success: true,
      message: "Logged out successfully",
      tokensRevoked: result.modifiedCount
    });

  } catch (err) {
    console.error("💥 LOGOUT ERROR:", err.message);
    // Always return success for logout (idempotent)
    res.json({ 
      success: true,
      message: "Logged out successfully" 
    });
  }
};

// Forgot Password: Send reset OTP to email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!validateForgotPassword(req.body)) {
      return res.status(400).json({ message: "Valid email required" });
    }
    
    await forgotPasswordService(email);
    res.json({ success: true, message: "Password reset OTP sent to email" });
  } catch (err) {
    next(err);
  }
};

// Verify Reset OTP: Validate the OTP for password reset
export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!validateVerifyResetOtp(req.body)) {
      return res.status(400).json({ message: "Valid email and 6-digit OTP required" });
    }

    const user = await verifyResetOtpService(email, otp);
    
    res.json({ success: true, message: "OTP verified successfully", userId: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
};

// Reset Password: Update password after OTP verification
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!validateResetPassword(req.body)) {
      return res.status(400).json({ message: "Valid email and password (min 8 chars) required" });
    }

    const user = await resetPasswordService(email, newPassword);

    res.json({ success: true, message: "Password reset successfully. Please login with your new password." });
  } catch (err) {
    next(err);
  }
};

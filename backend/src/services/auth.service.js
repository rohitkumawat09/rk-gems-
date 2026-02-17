import User from "../models/user.model.js";
import { generateNumericOtp, hashOtp, compareOtp } from "../utils/otp.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../utils/email.js";
import { OTP_EXPIRY_MS, MAX_OTP_ATTEMPTS, RESET_OTP_EXPIRY_MS, MAX_RESET_OTP_ATTEMPTS } from "../utils/constants.js";
import RefreshToken from "../models/refreshToken.model.js";
import bcrypt from "bcryptjs";

export const requestOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // If too many OTP attempts, block
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    const err = new Error("Too many OTP attempts. Try later.");
    err.status = 429;
    throw err;
  }

  const otp = generateNumericOtp(6);
  const otpHash = await hashOtp(otp);
  user.otpHash = otpHash;
  user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  // reset attempts when new OTP requested
  user.otpAttempts = 0;
  await user.save();

  // Send email (plain OTP in email body)
  await sendOtpEmail(email, otp);

  return { success: true, message: "OTP sent" };
};

export const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (!user.otpHash || !user.otpExpiry) {
    const err = new Error("No OTP requested");
    err.status = 400;
    throw err;
  }

  if (user.otpExpiry < new Date()) {
    // clear expired OTP
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();
    const err = new Error("OTP expired");
    err.status = 410;
    throw err;
  }

  const match = await compareOtp(otp, user.otpHash);
  if (!match) {
    // increment attempts
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      const err = new Error("Too many OTP attempts");
      err.status = 429;
      throw err;
    }
    const err = new Error("Invalid OTP");
    err.status = 401;
    throw err;
  }

  // Successful verification - clear otp fields
  user.otpHash = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  await user.save();

  return user;
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // If too many reset OTP attempts, block
  if (user.resetOtpAttempts >= MAX_RESET_OTP_ATTEMPTS) {
    const err = new Error("Too many reset attempts. Try later.");
    err.status = 429;
    throw err;
  }

  const otp = generateNumericOtp(6);
  const otpHash = await hashOtp(otp);
  user.resetOtpHash = otpHash;
  user.resetOtpExpiry = new Date(Date.now() + RESET_OTP_EXPIRY_MS);
  // reset attempts when new reset OTP requested
  user.resetOtpAttempts = 0;
  await user.save();

  // Send password reset email with OTP
  await sendPasswordResetEmail(email, otp);

  return { success: true, message: "Password reset OTP sent to email" };
};

export const verifyResetOtp = async (email, otp) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (!user.resetOtpHash || !user.resetOtpExpiry) {
    const err = new Error("No password reset OTP requested");
    err.status = 400;
    throw err;
  }

  if (user.resetOtpExpiry < new Date()) {
    // clear expired reset OTP
    await user.clearResetOtp();
    const err = new Error("OTP expired");
    err.status = 410;
    throw err;
  }

  const match = await compareOtp(otp, user.resetOtpHash);
  if (!match) {
    // increment reset OTP attempts
    await user.incResetOtpAttempts();
    if (user.resetOtpAttempts >= MAX_RESET_OTP_ATTEMPTS) {
      const err = new Error("Too many OTP attempts");
      err.status = 429;
      throw err;
    }
    const err = new Error("Invalid OTP");
    err.status = 401;
    throw err;
  }

  // At this point, OTP is valid but we don't clear yet
  // We'll clear it after password is successfully reset
  return user;
};

export const resetPassword = async (email, newPassword) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // Verify that user has a valid reset OTP before allowing password change
  if (!user.resetOtpHash || !user.resetOtpExpiry) {
    const err = new Error("No password reset OTP verified");
    err.status = 400;
    throw err;
  }

  if (user.resetOtpExpiry < new Date()) {
    // clear expired reset OTP
    await user.clearResetOtp();
    const err = new Error("OTP expired");
    err.status = 410;
    throw err;
  }

  // Hash the new password via the pre-save hook
  user.password = newPassword;
  
  // Clear all reset OTP fields
  await user.clearResetOtp();
  
  // Save the new password (will be hashed by pre-save hook)
  await user.save();

  // Delete all refresh tokens for this user (force logout from all devices)
  await RefreshToken.deleteMany({ user: user._id });

  return user;
};


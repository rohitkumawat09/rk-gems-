import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MAX_LOGIN_ATTEMPTS, LOCK_TIME, MAX_OTP_ATTEMPTS } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "VENDOR", "CUSTOMER"],
      default: "CUSTOMER"
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    }
    ,
    // OTP fields for email verification login
    otpHash: {
      type: String
    },
    otpExpiry: {
      type: Date
    },
    otpAttempts: {
      type: Number,
      default: 0
    },
    // Reset OTP fields for password reset
    resetOtpHash: {
      type: String
    },
    resetOtpExpiry: {
      type: Date
    },
    resetOtpAttempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Hash password before saving when modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare given password with stored hash
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incLoginAttempts = async function () {
  // If previously locked and lockUntil has passed, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    await this.save();
    return;
  }

  this.loginAttempts += 1;
  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = Date.now() + LOCK_TIME;
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// OTP attempt helpers
userSchema.methods.incOtpAttempts = async function () {
  this.otpAttempts = (this.otpAttempts || 0) + 1;
  await this.save();
};

userSchema.methods.clearOtpAttempts = async function () {
  this.otpAttempts = 0;
  await this.save();
};

userSchema.methods.clearOtp = async function () {
  this.otpHash = undefined;
  this.otpExpiry = undefined;
  this.otpAttempts = 0;
  await this.save();
};

// Reset OTP attempt helpers
userSchema.methods.incResetOtpAttempts = async function () {
  this.resetOtpAttempts = (this.resetOtpAttempts || 0) + 1;
  await this.save();
};

userSchema.methods.resetResetOtpAttempts = async function () {
  this.resetOtpAttempts = 0;
  await this.save();
};

userSchema.methods.clearResetOtp = async function () {
  this.resetOtpHash = undefined;
  this.resetOtpExpiry = undefined;
  this.resetOtpAttempts = 0;
  await this.save();
};

export default mongoose.model("User", userSchema);

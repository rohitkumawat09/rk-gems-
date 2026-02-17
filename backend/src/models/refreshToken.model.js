import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true }, // Hashed token for security
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false } // Track revoked tokens
  },
  { timestamps: true }
);

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", refreshTokenSchema);

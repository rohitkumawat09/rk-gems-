import bcrypt from "bcryptjs";

export const hashPassword = (password) => bcrypt.hash(password, 12);
export const comparePassword = (password, hash) =>
  bcrypt.compare(password, hash);

// Refresh token hashing (uses lower salt rounds for faster token operations)
export const hashRefreshToken = (token) => bcrypt.hash(token, 8);
export const compareRefreshToken = (token, hash) =>
  bcrypt.compare(token, hash);

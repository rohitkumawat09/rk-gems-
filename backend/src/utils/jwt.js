import jwt from "jsonwebtoken";

export const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

export const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

export const requiredEnv = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "SUPER_ADMIN_EMAIL",
  "SUPER_ADMIN_PASSWORD",
  "FRONTEND_URL"
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing ENV: ${key}`);
  }
});

// Validate FRONTEND_URL format
if (process.env.FRONTEND_URL) {
  const urls = process.env.FRONTEND_URL.split(",").map(s => s.trim());
  urls.forEach((url) => {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid FRONTEND_URL format: ${url}. Must be a valid URL.`);
    }
  });
}

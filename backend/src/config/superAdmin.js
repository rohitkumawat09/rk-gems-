import User from "../models/user.model.js";

const createSuperAdmin = async () => {
  const exists = await User.findOne({ role: "SUPER_ADMIN" });
  if (exists) return;

  // Don't hash here - let the pre-save hook in User model handle it
  await User.create({
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
    role: "SUPER_ADMIN"
  });

  console.log("✅ SUPER_ADMIN created");
};

export default createSuperAdmin;

export const validateRegister = ({ email, password }) =>
  email && password && password.length >= 6;

export const validateLogin = ({ email, password }) =>
  email && password;

export const validateForgotPassword = ({ email }) =>
  email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateResetPassword = ({ email, newPassword }) =>
  email && newPassword && newPassword.length >= 8;

export const validateVerifyResetOtp = ({ email, otp }) =>
  email && otp && /^\d{6}$/.test(otp);

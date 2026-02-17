import sgMail from "@sendgrid/mail";

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "no-reply@example.com";

// Diagnostic: show whether SendGrid env vars are loaded
console.log('[EMAIL] SENDGRID_API_KEY present?', !!API_KEY, 'FROM_EMAIL:', FROM_EMAIL);

if (API_KEY) sgMail.setApiKey(API_KEY);

export const sendOtpEmail = async (to, otp) => {
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: "Your login OTP",
    text: `Your OTP is ${otp}. It is valid for 5 minutes. If you did not request this, ignore.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`
  };

  if (!API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SendGrid API key not configured");
    }
    // Development fallback: log OTP to console so local testing works
    // without exposing credentials.
    // eslint-disable-next-line no-console
    console.warn("[DEV] SendGrid not configured — OTP for", to, "is", otp);
    return Promise.resolve({ success: true, message: "OTP logged to console (dev)" });
  }

  try {
    const res = await sgMail.send(msg);
    // Log SendGrid response for debugging (status, headers)
    // eslint-disable-next-line no-console
    console.info("[SendGrid] Sent OTP to", to, "status:", res[0]?.statusCode || res.statusCode, res[0]?.headers || res.headers);
    return res;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[SendGrid] Error sending OTP to", to, err?.response?.body || err.message || err);
    // Surface a helpful error for controller to return
    const error = new Error("Failed to send OTP email");
    error.cause = err;
    error.status = 502;
    throw error;
  }
};

export const sendPasswordResetEmail = async (to, otp) => {
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: "Password Reset Request",
    text: `Your password reset OTP is ${otp}. It is valid for 10 minutes. If you did not request this, please ignore.`,
    html: `<p>Your password reset OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p><p>If you did not request this, please ignore.</p>`
  };

  if (!API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SendGrid API key not configured");
    }
    // Development fallback: log OTP to console so local testing works
    // eslint-disable-next-line no-console
    console.warn("[DEV] SendGrid not configured — Password reset OTP for", to, "is", otp);
    return Promise.resolve({ success: true, message: "Password reset OTP logged to console (dev)" });
  }

  try {
    const res = await sgMail.send(msg);
    // eslint-disable-next-line no-console
    console.info("[SendGrid] Sent password reset OTP to", to, "status:", res[0]?.statusCode || res.statusCode);
    return res;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[SendGrid] Error sending password reset OTP to", to, err?.response?.body || err.message || err);
    const error = new Error("Failed to send password reset email");
    error.cause = err;
    error.status = 502;
    throw error;
  }
};

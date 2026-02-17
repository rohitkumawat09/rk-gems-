import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Parse allowed frontend URLs from environment
const FRONTEND_URLS = (process.env.FRONTEND_URL || "").split(",").map(s => s.trim()).filter(Boolean);

if (FRONTEND_URLS.length === 0) {
  console.warn("Warning: No FRONTEND_URL configured. CORS will be very restrictive.");
}

// Security: Helmet should be first
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...FRONTEND_URLS]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration: Must be before routes
app.use(cors({
  origin: (origin, callback) => {
    // Log for debugging - remove in production if verbose
    if (process.env.NODE_ENV !== "production") {
      console.log("Incoming request Origin:", origin || "(no origin)");
    }

    // Allow requests with no origin (mobile apps, curl requests, same-origin)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (FRONTEND_URLS.includes(origin)) {
      return callback(null, true);
    }

    // Reject disallowed origins
    console.error(`CORS rejected - Origin: ${origin}, Allowed: ${FRONTEND_URLS.join(", ")}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true, // Allow cookies/auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400 // 24 hours
}));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Cookie parser middleware
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;

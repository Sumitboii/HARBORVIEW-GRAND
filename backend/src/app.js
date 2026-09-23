const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRouter = require("./routes/chat");

// ── App factory ───────────────────────────────────────────────────────────────
function createApp() {
  const app = express();

  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,        // https://harborview-grand.onrender.com (production)
    "http://localhost:3000",            // local dev
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Render health checks, same-origin)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }));
  app.use(express.json());

  // Public health check
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Chat routes
  app.use("/api", chatRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found." } });
  });

  // Central error handler
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
    }
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } });
  });

  return app;
}

module.exports = { createApp };

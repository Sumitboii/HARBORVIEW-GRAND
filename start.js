const http = require("http");
const { fork } = require("child_process");
const path = require("path");

const PUBLIC_PORT = parseInt(process.env.PORT, 10) || 10000;
const BACKEND_PORT = parseInt(process.env.INTERNAL_BACKEND_PORT, 10) || 4000;
const FRONTEND_PORT = parseInt(process.env.INTERNAL_FRONTEND_PORT, 10) || 3000;

console.log(`[Supervisor] Initializing Harborview Grand Hotel service on port ${PUBLIC_PORT}...`);

// 1. Launch Backend API
const backendProcess = fork(path.join(__dirname, "backend/src/server.js"), [], {
  env: {
    ...process.env,
    PORT: BACKEND_PORT,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "https://harborview-grand.onrender.com",
    NODE_ENV: "production",
  },
  stdio: "inherit"
});

// 2. Launch Next.js Frontend
const nextBin = path.join(__dirname, "frontend/node_modules/next/dist/bin/next");
const frontendProcess = fork(nextBin, ["start", path.join(__dirname, "frontend"), "-p", String(FRONTEND_PORT)], {
  env: {
    ...process.env,
    PORT: FRONTEND_PORT,
    NODE_ENV: "production",
  },
  stdio: "inherit"
});

function forwardRequest(targetPort, req, res) {
  const options = {
    hostname: "127.0.0.1",
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: req.headers.host || `localhost:${PUBLIC_PORT}`,
      "x-forwarded-host": req.headers.host || `localhost:${PUBLIC_PORT}`,
      "x-forwarded-proto": req.headers["x-forwarded-proto"] || "https",
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`[Proxy Error] -> ${targetPort}${req.url}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { code: "BAD_GATEWAY", message: "Service is starting up or unavailable." } }));
    }
  });

  req.pipe(proxyReq, { end: true });
}

// 3. Reverse Proxy Gateway
const proxyServer = http.createServer((req, res) => {
  // Route /api/* requests to Express backend
  if (req.url.startsWith("/api/") || req.url === "/api") {
    forwardRequest(BACKEND_PORT, req, res);
  } else {
    // Route all other requests (UI pages, _next static assets) to Next.js
    forwardRequest(FRONTEND_PORT, req, res);
  }
});

proxyServer.listen(PUBLIC_PORT, () => {
  console.log(`[Supervisor] Harborview Grand is live and listening on port ${PUBLIC_PORT}`);
});

// Handle termination signals gracefully
function cleanup() {
  console.log("[Supervisor] Shutting down child processes...");
  backendProcess.kill("SIGTERM");
  frontendProcess.kill("SIGTERM");
  proxyServer.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

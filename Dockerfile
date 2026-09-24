# Multi-stage Dockerfile for root-level Docker build on Render / Cloud
# ----------------------------------------------------------------------

# Stage 1: Install frontend deps
FROM node:20-alpine AS frontend-deps
WORKDIR /app/frontend
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
ARG NEXT_PUBLIC_BACKEND_URL=https://harborview-grand.onrender.com/api
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./
RUN npm run build

# Stage 3: Install backend production deps
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

# Stage 4: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy backend files
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/package.json
COPY backend/src ./backend/src

# Copy frontend build output
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json
COPY --from=frontend-builder /app/frontend/next.config.js ./frontend/next.config.js
RUN mkdir -p ./frontend/public

# Copy root runner package / scripts
COPY package.json ./
COPY start.js ./

RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production \
    PORT=10000 \
    INTERNAL_BACKEND_PORT=4000 \
    INTERNAL_FRONTEND_PORT=3000

EXPOSE 10000

CMD ["node", "start.js"]

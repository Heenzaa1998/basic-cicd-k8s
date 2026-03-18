# ── Build stage ──────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy root tsconfig and service files
COPY tsconfig.base.json ./
COPY services/worker/package.json services/worker/tsconfig.json ./services/worker/
WORKDIR /app/services/worker
RUN npm install

COPY services/worker/src/ ./src/
RUN npm run build

# ── Production stage ─────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY services/worker/package.json ./
RUN npm install --omit=dev

COPY --from=build /app/services/worker/dist ./dist

USER node

EXPOSE 9090

CMD ["node", "dist/index.js"]

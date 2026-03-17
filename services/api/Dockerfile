# ── Build stage ──────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy root tsconfig and service files
COPY tsconfig.base.json ./
COPY services/api/package.json services/api/tsconfig.json ./services/api/
WORKDIR /app/services/api
RUN npm install

COPY services/api/src/ ./src/
RUN npm run build

# ── Production stage ─────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY services/api/package.json ./
RUN npm install --omit=dev

COPY --from=build /app/services/api/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]

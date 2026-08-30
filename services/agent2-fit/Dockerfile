# Production Dockerfile for Agent 2 (Fit-Confidence Match)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace configurations
COPY package*.json tsconfig.json ./
COPY shared ./shared
COPY frontend ./frontend
COPY services/agent2-fit ./services/agent2-fit

# Install dependencies and build shared + agent2
RUN npm ci
RUN npm run build --workspace=shared
RUN npm run build --workspace=services/agent2-fit

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/services/agent2-fit/dist ./services/agent2-fit/dist

EXPOSE 3002
CMD ["node", "services/agent2-fit/dist/index.js"]

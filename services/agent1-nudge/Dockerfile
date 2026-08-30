# Production Dockerfile for Agent 1 (Smart Nudge)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace configurations
COPY package*.json tsconfig.json ./
COPY shared ./shared
COPY services/agent1-nudge ./services/agent1-nudge

# Install dependencies and build shared + agent1
RUN npm ci
RUN npm run build --workspace=shared
RUN npm run build --workspace=services/agent1-nudge

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/agent1-nudge/dist ./services/agent1-nudge/dist

EXPOSE 3001
CMD ["node", "services/agent1-nudge/dist/index.js"]

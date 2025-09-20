# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 cryptochap

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=cryptochap:nodejs /app/.next/standalone ./
COPY --from=builder --chown=cryptochap:nodejs /app/.next/static ./.next/static

USER cryptochap

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
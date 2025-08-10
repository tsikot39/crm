# Multi-stage build for Contacts Service
FROM node:18-alpine AS builder

WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY services/contacts-service/package*.json ./services/contacts-service/
COPY shared/types/package*.json ./shared/types/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY shared/ ./shared/
COPY services/contacts-service/ ./services/contacts-service/

# Build shared types first
WORKDIR /app/shared/types
RUN npm run build

# Build Contacts Service
WORKDIR /app/services/contacts-service
RUN npm run build

# Production stage
FROM node:18-alpine AS production

RUN apk update && apk upgrade && apk add --no-cache dumb-init curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies
COPY services/contacts-service/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/contacts-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/shared/types/dist ./shared/types/dist

USER nodejs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

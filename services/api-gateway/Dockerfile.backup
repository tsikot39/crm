# Multi-stage build for Node.js API Gateway
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
COPY shared/types/package*.json ./shared/types/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY shared/ ./shared/
COPY services/api-gateway/ ./services/api-gateway/

# Build shared types first
WORKDIR /app/shared/types
RUN npm run build

# Build API Gateway
WORKDIR /app/services/api-gateway
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk update && apk upgrade && apk add --no-cache dumb-init curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY services/api-gateway/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/services/api-gateway/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/shared/types/dist ./shared/types/dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

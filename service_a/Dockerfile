
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY .env ./

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Start the application
CMD ["node", "dist/src/server.js"]


# ----------------------------------------------


# FROM node:22-alpine

# WORKDIR /app

# # Copy package files first for better caching
# COPY package*.json ./
# COPY tsconfig.json ./

# # Install ALL dependencies (including dev dependencies for build)
# RUN npm ci

# # Copy source code
# COPY src/ ./src/
# COPY .env ./

# # Build the TypeScript application
# RUN npm run build

# # Remove dev dependencies and keep only production
# RUN npm prune --production

# # Create non-root user
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001 && \
#     chown -R nodejs:nodejs /app

# USER nodejs

# # Expose the correct port
# EXPOSE 5001

# # Health check (using curl since we're in Alpine)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
#     CMD curl -f http://localhost:5001/health || exit 1

# # Start the application
# CMD ["npm", "start"]
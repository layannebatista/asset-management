# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy files
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Install dependencies and build
RUN npm ci && npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist
COPY public ./public

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3200/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 3200

# Start application
CMD ["npm", "start"]

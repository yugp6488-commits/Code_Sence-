# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration from root
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
# Copy api-server specific files from new layout
COPY backend/api-server/package.json backend/api-server/tsconfig.json backend/api-server/build.mjs ./backend/api-server/
COPY backend/api-server/src ./backend/api-server/src

# Copy backend shared packages
COPY backend/db ./backend/db
COPY backend/api-zod ./backend/api-zod
COPY backend/api-spec ./backend/api-spec

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Build the api-server
WORKDIR /app/backend/api-server
RUN pnpm run build

# Runtime stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration from root
# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy backend shared packages required at runtime
COPY backend/db ./backend/db
COPY backend/api-zod ./backend/api-zod

# Copy api-server package files
COPY backend/api-server/package.json backend/api-server/tsconfig.json ./backend/api-server/

# Copy built application from builder
COPY --from=builder /app/backend/api-server/dist ./backend/api-server/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Start the application
WORKDIR /app/backend/api-server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]

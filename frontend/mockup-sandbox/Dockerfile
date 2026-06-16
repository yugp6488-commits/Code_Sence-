# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration from root
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy frontend lib packages
COPY frontend/lib ./frontend/lib

# Copy mockup-sandbox specific files from new layout
COPY frontend/mockup-sandbox/package.json frontend/mockup-sandbox/tsconfig.json frontend/mockup-sandbox/vite.config.ts frontend/mockup-sandbox/index.html frontend/mockup-sandbox/components.json ./frontend/mockup-sandbox/
COPY frontend/mockup-sandbox/src ./frontend/mockup-sandbox/src
COPY frontend/mockup-sandbox/public ./frontend/mockup-sandbox/public

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Build the frontend
WORKDIR /app/frontend/mockup-sandbox
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build

# Runtime stage - use nginx for serving static files

FROM node:20-alpine

# Install simple-http-server or use node's built-in capabilities
RUN npm install -g http-server

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/frontend/mockup-sandbox/dist ./dist

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application (serve the dist folder as static files)
CMD ["http-server", "./dist", "-p", "3000", "--gzip"]

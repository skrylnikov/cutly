FROM oven/bun:1.3.3-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Copy Prisma schema and migrations
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy source code (including generated Prisma client)
COPY src ./src
COPY public ./public
COPY tsconfig.json vite.config.ts ./
COPY biome.json ./

# Build application
RUN bun run build

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]


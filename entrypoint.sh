#!/bin/sh
set -e

# Ensure data directory exists and has correct permissions
# This is needed when volume is mounted from compose.yml
# Note: Dockerfile uses /usr/src/app as WORKDIR, but volumes mount to /app/data
DATA_DIR="/app/data"
if [ ! -d "$DATA_DIR" ]; then
    mkdir -p "$DATA_DIR"
fi
chown -R bun:bun "$DATA_DIR"

# Switch to bun user for running the application
echo "Running database migrations..."
sudo -u bun bunx prisma migrate deploy

# Set Vite additional server allowed hosts from APP_URL
if [ -n "$APP_URL" ]; then
    # Extract host from APP_URL (remove protocol and path) for Vite only
    VITE_HOST=$(echo "$APP_URL" | sed -E 's|^https?://||' | sed 's|/.*||')
    export __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="$VITE_HOST"
fi

echo "Migrations completed successfully. Starting application..."

# Set port and host for Nitro server
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}
export NITRO_PORT=${PORT}
export NITRO_HOST=${HOST}
export NODE_ENV=production

echo "Starting Nitro server with PORT=$PORT, HOST=$HOST"

# Change to app directory and run Nitro server
cd /usr/src/app
exec sudo -u bun bun .output/server/index.mjs


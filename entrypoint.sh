#!/bin/sh
set -e

# Ensure data directory exists and has correct permissions
# This is needed when volume is mounted from compose.yml
if [ ! -d "/app/data" ]; then
    mkdir -p /app/data
fi
chown -R bun:bun /app/data

# Switch to bun user for running the application
echo "Running database migrations..."
su-exec bun bunx prisma migrate deploy

echo "Migrations completed successfully. Starting application..."
exec su-exec bun bun run serve --port 3000 --host 0.0.0.0


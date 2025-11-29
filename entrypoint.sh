#!/bin/sh
set -e

echo "Running database migrations..."
bunx prisma migrate deploy

echo "Migrations completed successfully. Starting application..."
exec bun run serve --port 3000


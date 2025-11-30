# use the official Bun image
FROM oven/bun:1.3.3-alpine AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
# RUN bun test
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
# Install curl for healthcheck and su-exec for user switching
RUN apk add --no-cache curl su-exec

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/.output ./.output
COPY --from=prerelease /usr/src/app/package.json ./package.json
COPY --from=prerelease /usr/src/app/prisma ./prisma
COPY --from=prerelease /usr/src/app/prisma.config.ts ./prisma.config.ts
COPY --from=prerelease /usr/src/app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# run the app
# Note: entrypoint.sh runs as root to fix volume permissions, then switches to bun user
EXPOSE 3000/tcp
ENTRYPOINT ["/entrypoint.sh"]

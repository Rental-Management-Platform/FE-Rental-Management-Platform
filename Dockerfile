# syntax=docker/dockerfile:1
#
# The frontend image (docs/guild/huong-dan-docker-cho-fe.md). Use it through compose.yaml, which
# passes the build arguments below.
#
# `next build` reads the ward catalog from the API (spec 0016, AC-10) and fails when it cannot, so
# the API must answer at API_URL while this file builds. compose.yaml reaches it on the host
# network (the backend publishes 127.0.0.1:3000 on the server).

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: `prepare` runs husky, which needs a .git folder that the image does not have.
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

# Written into the browser code, so they belong to the build. The browser calls the API by a path
# on its own origin, which keeps one image valid on any domain.
ARG NEXT_PUBLIC_API_URL=/api/v1
# The public address of the site. It goes into canonical links, share cards and the sitemap, so a
# new domain needs a new build.
ARG NEXT_PUBLIC_SITE_URL
# Only for `next build`, to read the ward catalog. The running server gets its own API_URL.
ARG API_URL
# Where the image optimizer fetches photos from (next.config.ts). Baked into the build.
ARG MEDIA_ORIGIN=http://api:3000

RUN test -n "$NEXT_PUBLIC_SITE_URL" || { echo "NEXT_PUBLIC_SITE_URL is required: the public address of the site, such as https://example.com" >&2; exit 1; }
RUN test -n "$API_URL" || { echo "API_URL is required while building: an address of the running API that this build can reach, such as http://127.0.0.1:3000/api/v1" >&2; exit 1; }

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    API_URL=$API_URL \
    MEDIA_ORIGIN=$MEDIA_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

# NODE_ENV is set here and not in the build stage: `next build` sets its own and fails on a
# value it did not expect. API_URL is not set here: the server reads it at run time from compose.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# The `node` user of the base image (uid 1000), not root. The image holds no .env and no secret.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]

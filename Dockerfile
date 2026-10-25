# Keep in step with the Bun version used locally and in CI.
ARG BUN_VERSION=1.3

FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

FROM oven/bun:${BUN_VERSION}
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts
COPY tsconfig.json ./
COPY public ./public
COPY src ./src
COPY --from=build /app/dist ./dist
USER bun
EXPOSE 3000
CMD ["bun", "run", "start"]

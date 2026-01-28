# Dockerfile
# syntax=docker/dockerfile:1

# --- Stage 1: Build (Native AMD64) ---
FROM --platform=$BUILDPLATFORM oven/bun:latest AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN chmod +x build.sh
RUN ./build.sh

# --- Stage 2: Runtime (Target ARM64) ---
FROM oven/bun:latest
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/db ./db
COPY --from=builder /app/start.sh ./

RUN chmod +x start.sh

ENV PORT=3000
EXPOSE $PORT

ENV PORT=3000
EXPOSE $PORT

# Command to start the application
CMD ["./start.sh"]
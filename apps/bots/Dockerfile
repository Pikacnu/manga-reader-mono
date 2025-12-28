# Dockerfile using oven/bun
FROM oven/bun:latest
WORKDIR /app

# Copy source
COPY . .

# If you have a package.json, uncomment the install step:
# RUN bun install --production

# Run the TypeScript entry directly with Bun (Bun supports TS natively)
CMD ["bun", "src/index.ts"]

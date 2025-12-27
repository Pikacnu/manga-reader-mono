# Dockerfile
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and bun.lockb
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application code
COPY . .

# Copy build and start scripts
COPY build.sh start.sh ./

# Make scripts executable
RUN chmod +x build.sh start.sh

# Run build script
RUN ./build.sh

# Expose the port specified in the environment variable or default to 3000
ENV PORT=3000
EXPOSE $PORT

# Command to start the application
CMD ["./start.sh"]
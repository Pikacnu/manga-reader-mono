# Manga Reader Mono

Manga Reader Mono is a monorepo project designed to manage a web-based manga reader application and its associated image processing service. This project is built using modern web technologies and is containerized for easy deployment.

## Project Structure

```
.
├── apps/
│   ├── web/                # Next.js-based web application
│   └── image-processer/    # Image processing service
├── k8s.yaml                # Kubernetes deployment configuration
├── build-and-push.sh       # Script to build and push Docker images
└── README.md               # Project documentation
```

## Prerequisites

- **Docker**: Ensure Docker is installed and running.
- **Kubernetes**: A Kubernetes cluster for deployment.
- **bun**: For managing dependencies.

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd manga-reader-mono
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   - Copy the example environment file:
     ```bash
     cp apps/web/env.example apps/web/.env.local
     ```
   - Update the `.env.local` file with your configuration.

## Build and Push Docker Images

Use the provided script to build and push Docker images:
```bash
bash build-and-push.sh
```

## Deployment

1. Apply the Kubernetes configuration:
   ```bash
   kubectl apply -f k8s.yaml
   ```

2. Verify the deployment:
   ```bash
   kubectl get pods -n manga-reader
   ```

## Services

### Web Application
- **Path**: `apps/web`
- **Tech Stack**: Next.js, TypeScript
- **Port**: 3000 (default)

### Image Processor
- **Path**: `apps/image-processer`
- **Tech Stack**: Bun.serve, TypeScript
- **Port**: 3001 (default)

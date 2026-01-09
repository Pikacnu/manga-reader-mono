# Manga Reader Mono

Manga Reader Mono is a monorepo project designed to manage a web-based manga reader application and its associated image processing service. This project is built using modern web technologies and is containerized for easy deployment.

## Project Structure

```
.
├── apps/
│   ├── bots/               # Any bot services(use to automatic book creation)
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
   git clone <your-repository-url>
   cd manga-reader-mono
   ```
   *(Note: Remember to update the repository URL above when you move the project.)*

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

### 1. Secrets Management (SOPS)

Sensitive data is moved to [secrets.yaml](secrets.yaml) and should be encrypted using [Mozilla SOPS](https://github.com/getsops/sops).

**How to use SOPS:**
1. **Initialize a key**: Use GPG or [Age](https://github.com/FiloSottile/age). 
   - Age example: `age-keygen -o key.txt`
2. **Encrypt**: 
   ```bash
   sops --encrypt --age $(cat key.txt | grep -oP "public key: \K.*") --inplace secrets.yaml
   ```
3. **Decrypt/Edit**:
   ```bash
   sops secrets.yaml
   ```

### 2. Helm Deployment

The [helm/manga-reader](helm/manga-reader) directory contains the templates for the entire stack.

To deploy using the separate secrets file:
```bash
# Ensure you have helm installed
# You may need to decrypt secrets.yaml first or use helm-secrets plugin
helm upgrade --install manga-reader ./helm/manga-reader -f ./helm/manga-reader/values.yaml -f secrets.yaml -n manga-reader --create-namespace
```

### 3. Classic Deployment (Monolithic)

The [k8s.yaml](k8s.yaml) is provided as a static reference. However, it is recommended to use the Helm chart for better configuration management.

## Services

### Web Application
- **Path**: `apps/web`
- **Tech Stack**: Next.js, TypeScript
- **Port**: 3000 (default)

### Image Processor
- **Path**: `apps/image-processer`
- **Tech Stack**: Bun.serve, TypeScript
- **Port**: 3001 (default)

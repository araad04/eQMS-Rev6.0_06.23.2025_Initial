# Deployment Strategy
## eQMS DevOps Pipeline and Infrastructure

**Document Control Information**
- Document ID: DS-eQMS-2025-001
- Version: 1.0
- Date: June 4, 2025
- Author: DevOps Engineering Team
- Classification: Controlled Document

---

## 1. Deployment Overview

### 1.1 Deployment Philosophy
The eQMS deployment strategy follows modern DevOps principles with emphasis on:
- **Infrastructure as Code (IaC)**: All infrastructure defined in version-controlled code
- **Continuous Integration/Continuous Deployment (CI/CD)**: Automated testing and deployment pipelines
- **Blue-Green Deployments**: Zero-downtime deployments with instant rollback capability
- **Container-First Approach**: Consistent deployment across all environments
- **Security by Design**: Security controls integrated throughout the deployment pipeline

### 1.2 Deployment Environments

| Environment | Purpose | Infrastructure | Data Source | Access Control |
|-------------|---------|----------------|-------------|----------------|
| **Development** | Feature development and testing | Local/Shared containers | Synthetic test data | Developer access |
| **Staging** | Pre-production validation | Kubernetes cluster | Anonymized production data | QA team access |
| **Production** | Live system operations | Highly available Kubernetes | Live production data | Restricted access |
| **Disaster Recovery** | Business continuity | Geographically distributed | Production backup data | Emergency access |

---

## 2. Container Strategy

### 2.1 Docker Configuration

#### 2.1.1 Frontend Dockerfile
```dockerfile
# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Security headers and configuration
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2.1.2 Backend Dockerfile
```dockerfile
# Backend API Dockerfile
FROM node:18-alpine AS base

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S eqms -u 1001

WORKDIR /app
COPY package*.json ./

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
COPY . .
RUN npm ci && npm run build

# Production stage
FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Switch to non-root user
USER eqms

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"]
```

#### 2.1.3 Docker Compose for Development
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=development
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/eqms_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=eqms_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 2.2 Container Security

#### 2.2.1 Security Best Practices
```dockerfile
# Security-hardened base configuration
FROM node:18-alpine

# Install security scanner
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set up secure directories
RUN mkdir -p /app/logs /app/temp && \
    chown -R appuser:appgroup /app && \
    chmod -R 750 /app

# Copy application with proper ownership
COPY --chown=appuser:appgroup . /app/

WORKDIR /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

#### 2.2.2 Image Scanning Pipeline
```yaml
# .github/workflows/security-scan.yml
name: Container Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker Image
      run: docker build -t eqms:${{ github.sha }} .
    
    - name: Run Trivy Vulnerability Scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'eqms:${{ github.sha }}'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy Results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run Snyk Container Test
      uses: snyk/actions/docker@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        image: eqms:${{ github.sha }}
```

---

## 3. Kubernetes Deployment

### 3.1 Cluster Architecture

#### 3.1.1 Production Cluster Configuration
```yaml
# cluster-config.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: eqms-production
  labels:
    name: eqms-production
    environment: production

---
# Resource Quotas
apiVersion: v1
kind: ResourceQuota
metadata:
  name: eqms-quota
  namespace: eqms-production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"
    services: "5"
    secrets: "10"
    configmaps: "10"

---
# Network Policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: eqms-network-policy
  namespace: eqms-production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: eqms-frontend
    - podSelector:
        matchLabels:
          app: eqms-backend
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    - podSelector:
        matchLabels:
          app: redis
```

#### 3.1.2 Application Deployments
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eqms-backend
  namespace: eqms-production
  labels:
    app: eqms-backend
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: eqms-backend
  template:
    metadata:
      labels:
        app: eqms-backend
        version: v1.0.0
    spec:
      serviceAccountName: eqms-backend
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: backend
        image: registry.company.com/eqms/backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: eqms-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: eqms-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: eqms-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /app/logs
        - name: temp
          mountPath: /app/temp
      volumes:
      - name: logs
        persistentVolumeClaim:
          claimName: eqms-logs-pvc
      - name: temp
        emptyDir: {}
      imagePullSecrets:
      - name: registry-secret

---
# Frontend Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eqms-frontend
  namespace: eqms-production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: eqms-frontend
  template:
    metadata:
      labels:
        app: eqms-frontend
    spec:
      containers:
      - name: frontend
        image: registry.company.com/eqms/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
```

#### 3.1.3 Database StatefulSet
```yaml
# postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: eqms-production
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      securityContext:
        runAsUser: 999
        runAsGroup: 999
        fsGroup: 999
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: eqms
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: POSTGRES_REPLICATION_MODE
          value: master
        - name: POSTGRES_REPLICATION_USER
          value: replicator
        - name: POSTGRES_REPLICATION_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: replication-password
        ports:
        - containerPort: 5432
          name: postgres
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: postgres-config
          mountPath: /etc/postgresql/postgresql.conf
          subPath: postgresql.conf
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: postgres-config
        configMap:
          name: postgres-config
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 100Gi
```

### 3.2 Service Configurations
```yaml
# services.yaml
apiVersion: v1
kind: Service
metadata:
  name: eqms-backend-service
  namespace: eqms-production
spec:
  selector:
    app: eqms-backend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: eqms-frontend-service
  namespace: eqms-production
spec:
  selector:
    app: eqms-frontend
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: eqms-production
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
    protocol: TCP
  type: ClusterIP
  clusterIP: None  # Headless service for StatefulSet
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions Workflow

#### 4.1.1 Main Pipeline
```yaml
# .github/workflows/main.yml
name: eQMS CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: eqms_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/eqms_test
        REDIS_URL: redis://localhost:6379

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/eqms_test
        REDIS_URL: redis://localhost:6379

    - name: Run security audit
      run: npm audit --audit-level moderate

    - name: Generate test coverage
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push backend image
      id: build
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile.backend
        push: true
        tags: ${{ steps.meta.outputs.tags }}-backend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build and push frontend image
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile.frontend
        push: true
        tags: ${{ steps.meta.outputs.tags }}-frontend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  security-scan:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ needs.build.outputs.image-tag }}-backend
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [build, security-scan]
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'

    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBECONFIG_STAGING }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

    - name: Deploy to staging
      run: |
        envsubst < k8s/staging/deployment.yaml | kubectl apply -f -
        kubectl rollout status deployment/eqms-backend -n eqms-staging
        kubectl rollout status deployment/eqms-frontend -n eqms-staging
      env:
        IMAGE_TAG: ${{ needs.build.outputs.image-tag }}

    - name: Run smoke tests
      run: npm run test:smoke
      env:
        TEST_URL: https://staging.eqms.company.com

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [build, security-scan]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3

    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBECONFIG_PRODUCTION }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

    - name: Blue-Green Deployment
      run: |
        chmod +x scripts/blue-green-deploy.sh
        ./scripts/blue-green-deploy.sh ${{ needs.build.outputs.image-tag }}
      env:
        KUBECONFIG: kubeconfig

    - name: Post-deployment validation
      run: npm run test:e2e:production
      env:
        TEST_URL: https://eqms.company.com
```

#### 4.1.2 Blue-Green Deployment Script
```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -euo pipefail

IMAGE_TAG=${1:-latest}
NAMESPACE="eqms-production"
TIMEOUT=300

echo "Starting blue-green deployment with image tag: $IMAGE_TAG"

# Determine current active environment
CURRENT_ENV=$(kubectl get service eqms-active -n $NAMESPACE -o jsonpath='{.spec.selector.environment}' 2>/dev/null || echo "blue")
if [ "$CURRENT_ENV" = "blue" ]; then
    NEXT_ENV="green"
else
    NEXT_ENV="blue"
fi

echo "Current environment: $CURRENT_ENV"
echo "Deploying to: $NEXT_ENV"

# Update deployment with new image
kubectl set image deployment/eqms-backend-$NEXT_ENV backend=registry.company.com/eqms/backend:$IMAGE_TAG -n $NAMESPACE
kubectl set image deployment/eqms-frontend-$NEXT_ENV frontend=registry.company.com/eqms/frontend:$IMAGE_TAG -n $NAMESPACE

# Wait for rollout to complete
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/eqms-backend-$NEXT_ENV -n $NAMESPACE --timeout=${TIMEOUT}s
kubectl rollout status deployment/eqms-frontend-$NEXT_ENV -n $NAMESPACE --timeout=${TIMEOUT}s

# Health check on new environment
echo "Performing health checks..."
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=eqms-backend,environment=$NEXT_ENV -o jsonpath='{.items[0].metadata.name}')
FRONTEND_POD=$(kubectl get pods -n $NAMESPACE -l app=eqms-frontend,environment=$NEXT_ENV -o jsonpath='{.items[0].metadata.name}')

# Test backend health
kubectl exec $BACKEND_POD -n $NAMESPACE -- curl -f http://localhost:3000/health || {
    echo "Backend health check failed"
    exit 1
}

# Test frontend availability
kubectl exec $FRONTEND_POD -n $NAMESPACE -- curl -f http://localhost:80/ || {
    echo "Frontend health check failed"
    exit 1
}

# Switch traffic to new environment
echo "Switching traffic to $NEXT_ENV environment..."
kubectl patch service eqms-active -n $NAMESPACE -p '{"spec":{"selector":{"environment":"'$NEXT_ENV'"}}}'

# Verify switch was successful
sleep 10
NEW_ACTIVE=$(kubectl get service eqms-active -n $NAMESPACE -o jsonpath='{.spec.selector.environment}')
if [ "$NEW_ACTIVE" != "$NEXT_ENV" ]; then
    echo "Failed to switch traffic"
    exit 1
fi

echo "Blue-green deployment completed successfully"
echo "Active environment: $NEW_ACTIVE"

# Scale down old environment after successful deployment
echo "Scaling down old environment..."
kubectl scale deployment eqms-backend-$CURRENT_ENV --replicas=0 -n $NAMESPACE
kubectl scale deployment eqms-frontend-$CURRENT_ENV --replicas=0 -n $NAMESPACE

echo "Deployment complete!"
```

---

## 5. Infrastructure as Code

### 5.1 Terraform Configuration

#### 5.1.1 Main Infrastructure
```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket = "eqms-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
  default     = "eqms-cluster"
}

variable "namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "eqms-production"
}

# Namespace
resource "kubernetes_namespace" "eqms" {
  metadata {
    name = var.namespace
    labels = {
      environment = var.environment
      managed-by  = "terraform"
    }
  }
}

# ConfigMaps
resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "eqms-config"
    namespace = kubernetes_namespace.eqms.metadata[0].name
  }

  data = {
    NODE_ENV    = var.environment
    LOG_LEVEL   = "info"
    PORT        = "3000"
    CORS_ORIGIN = "https://eqms.company.com"
  }
}

# Secrets (managed externally for security)
resource "kubernetes_secret" "eqms_secrets" {
  metadata {
    name      = "eqms-secrets"
    namespace = kubernetes_namespace.eqms.metadata[0].name
  }

  type = "Opaque"

  # Note: In production, these would be injected from external secret management
  data = {
    database-url = base64encode("postgresql://user:pass@postgres:5432/eqms")
    redis-url    = base64encode("redis://redis:6379")
    jwt-secret   = base64encode("your-jwt-secret-here")
  }
}

# Persistent Volume Claims
resource "kubernetes_persistent_volume_claim" "logs_pvc" {
  metadata {
    name      = "eqms-logs-pvc"
    namespace = kubernetes_namespace.eqms.metadata[0].name
  }

  spec {
    access_modes = ["ReadWriteMany"]
    resources {
      requests = {
        storage = "10Gi"
      }
    }
    storage_class_name = "nfs-storage"
  }
}

# Monitoring
resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = "monitoring"
  create_namespace = true

  set {
    name  = "grafana.enabled"
    value = "true"
  }

  set {
    name  = "grafana.adminPassword"
    value = "admin123"  # Use proper secret management
  }
}

# Ingress Controller
resource "helm_release" "nginx_ingress" {
  name       = "nginx-ingress"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  namespace  = "ingress-system"
  create_namespace = true

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }
}
```

#### 5.1.2 Security Policies
```hcl
# security.tf
# Pod Security Policy
resource "kubernetes_pod_security_policy" "eqms_psp" {
  metadata {
    name = "eqms-psp"
  }

  spec {
    privileged                 = false
    allow_privilege_escalation = false
    required_drop_capabilities = ["ALL"]
    allowed_capabilities       = []
    volumes = [
      "configMap",
      "emptyDir",
      "projected",
      "secret",
      "downwardAPI",
      "persistentVolumeClaim"
    ]
    run_as_user {
      rule = "MustRunAsNonRoot"
    }
    se_linux {
      rule = "RunAsAny"
    }
    fs_group {
      rule = "RunAsAny"
    }
  }
}

# Network Policies
resource "kubernetes_network_policy" "eqms_network_policy" {
  metadata {
    name      = "eqms-network-policy"
    namespace = kubernetes_namespace.eqms.metadata[0].name
  }

  spec {
    pod_selector {
      match_labels = {
        app = "eqms"
      }
    }

    policy_types = ["Ingress", "Egress"]

    ingress {
      from {
        pod_selector {
          match_labels = {
            app = "eqms-frontend"
          }
        }
      }
      ports {
        port     = "3000"
        protocol = "TCP"
      }
    }

    egress {
      to {
        pod_selector {
          match_labels = {
            app = "postgres"
          }
        }
      }
      ports {
        port     = "5432"
        protocol = "TCP"
      }
    }
  }
}

# RBAC
resource "kubernetes_service_account" "eqms_backend" {
  metadata {
    name      = "eqms-backend"
    namespace = kubernetes_namespace.eqms.metadata[0].name
  }
}

resource "kubernetes_role" "eqms_role" {
  metadata {
    namespace = kubernetes_namespace.eqms.metadata[0].name
    name      = "eqms-role"
  }

  rule {
    api_groups = [""]
    resources  = ["pods", "services"]
    verbs      = ["get", "list"]
  }
}

resource "kubernetes_role_binding" "eqms_role_binding" {
  metadata {
    name      = "eqms-role-binding"
    namespace = kubernetes_namespace.eqms.metadata[0].name
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.eqms_role.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.eqms_backend.metadata[0].name
    namespace = kubernetes_namespace.eqms.metadata[0].name
  }
}
```

---

## 6. Monitoring and Observability

### 6.1 Prometheus Configuration
```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: 'eqms-backend'
    kubernetes_sd_configs:
    - role: pod
      namespaces:
        names:
        - eqms-production
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_label_app]
      action: keep
      regex: eqms-backend
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)

  - job_name: 'postgres-exporter'
    static_configs:
    - targets: ['postgres-exporter:9187']

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093
```

### 6.2 Grafana Dashboards
```json
{
  "dashboard": {
    "title": "eQMS Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"eqms-backend\"}[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"eqms-backend\"}[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=\"eqms-backend\"}[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"eqms-backend\",status=~\"5..\"}[5m]) / rate(http_requests_total{job=\"eqms-backend\"}[5m]) * 100"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"eqms\"}"
          }
        ]
      }
    ]
  }
}
```

---

## 7. Rollback Strategy

### 7.1 Automated Rollback
```bash
#!/bin/bash
# scripts/rollback.sh

set -euo pipefail

NAMESPACE=${1:-eqms-production}
REASON=${2:-"Manual rollback"}

echo "Initiating rollback for namespace: $NAMESPACE"
echo "Reason: $REASON"

# Get current active environment
CURRENT_ENV=$(kubectl get service eqms-active -n $NAMESPACE -o jsonpath='{.spec.selector.environment}')
if [ "$CURRENT_ENV" = "blue" ]; then
    ROLLBACK_ENV="green"
else
    ROLLBACK_ENV="blue"
fi

echo "Current environment: $CURRENT_ENV"
echo "Rolling back to: $ROLLBACK_ENV"

# Check if rollback environment is available
ROLLBACK_READY=$(kubectl get deployment eqms-backend-$ROLLBACK_ENV -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
if [ "$ROLLBACK_READY" = "0" ]; then
    echo "Rollback environment is not ready. Starting previous version..."
    
    # Scale up rollback environment
    kubectl scale deployment eqms-backend-$ROLLBACK_ENV --replicas=3 -n $NAMESPACE
    kubectl scale deployment eqms-frontend-$ROLLBACK_ENV --replicas=2 -n $NAMESPACE
    
    # Wait for rollback environment to be ready
    kubectl rollout status deployment/eqms-backend-$ROLLBACK_ENV -n $NAMESPACE --timeout=300s
    kubectl rollout status deployment/eqms-frontend-$ROLLBACK_ENV -n $NAMESPACE --timeout=300s
fi

# Switch traffic to rollback environment
echo "Switching traffic to rollback environment..."
kubectl patch service eqms-active -n $NAMESPACE -p '{"spec":{"selector":{"environment":"'$ROLLBACK_ENV'"}}}'

# Verify rollback
sleep 10
NEW_ACTIVE=$(kubectl get service eqms-active -n $NAMESPACE -o jsonpath='{.spec.selector.environment}')
if [ "$NEW_ACTIVE" = "$ROLLBACK_ENV" ]; then
    echo "Rollback completed successfully"
    echo "Active environment: $NEW_ACTIVE"
    
    # Log rollback event
    kubectl annotate deployment eqms-backend-$NEW_ACTIVE rollback.timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -n $NAMESPACE
    kubectl annotate deployment eqms-backend-$NEW_ACTIVE rollback.reason="$REASON" -n $NAMESPACE
    
    # Scale down failed environment
    kubectl scale deployment eqms-backend-$CURRENT_ENV --replicas=0 -n $NAMESPACE
    kubectl scale deployment eqms-frontend-$CURRENT_ENV --replicas=0 -n $NAMESPACE
else
    echo "Rollback failed"
    exit 1
fi
```

### 7.2 Canary Deployment
```yaml
# canary-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: eqms-backend-canary
  namespace: eqms-production
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {duration: 2m}
      - setWeight: 40
      - pause: {duration: 2m}
      - setWeight: 60
      - pause: {duration: 2m}
      - setWeight: 80
      - pause: {duration: 2m}
      analysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: eqms-backend-canary
      trafficRouting:
        nginx:
          stableService: eqms-backend-stable
          canaryService: eqms-backend-canary
          annotationPrefix: nginx.ingress.kubernetes.io
  selector:
    matchLabels:
      app: eqms-backend
  template:
    metadata:
      labels:
        app: eqms-backend
    spec:
      containers:
      - name: backend
        image: registry.company.com/eqms/backend:latest
        ports:
        - containerPort: 3000
```

This comprehensive deployment strategy provides a robust, secure, and scalable approach to deploying the eQMS system with industry best practices for DevOps and infrastructure management.
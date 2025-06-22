# Architectural Diagrams
## eQMS System Architecture

**Document Control Information**
- Document ID: ARCH-eQMS-2025-001
- Version: 1.0
- Date: June 4, 2025
- Author: Senior Software Development Team
- Classification: Controlled Document

---

## 1. System Context Diagram

```mermaid
graph TB
    subgraph "External Systems"
        ERP[ERP System<br/>SAP/Oracle]
        LIMS[Laboratory Information<br/>Management System]
        DOC[Document Management<br/>System]
        REG[Regulatory Submission<br/>Platforms]
        EMAIL[Email/Notification<br/>Services]
    end
    
    subgraph "eQMS Core System"
        API[API Gateway<br/>Express.js]
        AUTH[Authentication<br/>Service]
        QMS[QMS Core<br/>Services]
        WF[Workflow<br/>Engine]
        AUDIT[Audit Trail<br/>Service]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Database)]
        REDIS[(Redis<br/>Cache)]
        FILES[File Storage<br/>S3 Compatible]
    end
    
    subgraph "Users"
        QM[Quality Manager]
        QE[Quality Engineer]
        ADMIN[System Admin]
        AUDITOR[External Auditor]
    end
    
    QM --> API
    QE --> API
    ADMIN --> API
    AUDITOR --> API
    
    API --> AUTH
    API --> QMS
    API --> WF
    API --> AUDIT
    
    AUTH --> PG
    QMS --> PG
    QMS --> REDIS
    WF --> PG
    AUDIT --> PG
    
    QMS --> FILES
    
    API <--> ERP
    API <--> LIMS
    API <--> DOC
    API <--> REG
    API --> EMAIL
```

---

## 2. Application Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        REACT[React Application<br/>TypeScript + Vite]
        MOBILE[Mobile App<br/>React Native]
        SWAGGER[API Documentation<br/>Swagger UI]
    end
    
    subgraph "API Gateway Layer"
        LB[Load Balancer<br/>Nginx/HAProxy]
        GW[API Gateway<br/>Express.js]
        MW[Middleware Stack<br/>Auth, CORS, Rate Limit]
    end
    
    subgraph "Business Logic Layer"
        subgraph "Core Services"
            MR[Management Review<br/>Service]
            CAPA[CAPA<br/>Service]
            AUDIT_SVC[Audit<br/>Service]
            DOC_SVC[Document Control<br/>Service]
            SUPPLIER[Supplier Management<br/>Service]
        end
        
        subgraph "Cross-Cutting Services"
            AUTH_SVC[Authentication<br/>Service]
            AUTHZ[Authorization<br/>Service]
            WF_ENGINE[Workflow<br/>Engine]
            NOTIF[Notification<br/>Service]
            AUDIT_TRAIL[Audit Trail<br/>Service]
        end
    end
    
    subgraph "Data Access Layer"
        ORM[Drizzle ORM<br/>Query Builder]
        CACHE[Cache Manager<br/>Redis Client]
        FILE_MGR[File Manager<br/>S3 Client]
    end
    
    subgraph "Infrastructure Layer"
        DB[(PostgreSQL<br/>Primary Database)]
        CACHE_DB[(Redis<br/>Cache & Sessions)]
        STORAGE[(Object Storage<br/>Files & Documents)]
        LOGS[(Log Storage<br/>Elasticsearch)]
    end
    
    REACT --> LB
    MOBILE --> LB
    SWAGGER --> LB
    
    LB --> GW
    GW --> MW
    MW --> MR
    MW --> CAPA
    MW --> AUDIT_SVC
    MW --> DOC_SVC
    MW --> SUPPLIER
    
    MR --> AUTH_SVC
    CAPA --> AUTHZ
    AUDIT_SVC --> WF_ENGINE
    DOC_SVC --> NOTIF
    SUPPLIER --> AUDIT_TRAIL
    
    AUTH_SVC --> ORM
    AUTHZ --> CACHE
    WF_ENGINE --> ORM
    NOTIF --> CACHE
    AUDIT_TRAIL --> ORM
    
    ORM --> DB
    CACHE --> CACHE_DB
    FILE_MGR --> STORAGE
    
    GW --> LOGS
    AUTH_SVC --> LOGS
    AUDIT_TRAIL --> LOGS
```

---

## 3. Database Architecture Diagram

```mermaid
erDiagram
    users {
        int id PK
        string username UK
        string email_encrypted
        string email_hash UK
        string password_hash
        string first_name
        string last_name
        string role
        string department
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    management_reviews {
        int id PK
        string title
        date review_date
        string review_type
        int status_id FK
        int created_by FK
        int scheduled_by FK
        timestamp created_at
        timestamp updated_at
        date approval_date
        boolean auto_numbering
    }
    
    management_review_inputs {
        int id PK
        int review_id FK
        int category_id FK
        text input_data
        text analysis
        text recommendations
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    management_review_action_items {
        int id PK
        int review_id FK
        string title
        text description
        int assigned_to FK
        date due_date
        int status_id FK
        date completion_date
        timestamp created_at
        timestamp updated_at
    }
    
    capas {
        int id PK
        string capa_id UK
        string title
        text description
        int type_id FK
        int status_id FK
        int initiated_by FK
        int assigned_to FK
        date due_date
        date closed_date
        timestamp created_at
        timestamp updated_at
    }
    
    audits {
        int id PK
        string audit_id UK
        string title
        text description
        int type_id FK
        int status_id FK
        text scope
        date scheduled_date
        date completion_date
        string lead_auditor_name
        string audit_location
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    audit_findings {
        int id PK
        int audit_id FK
        string finding_id
        text description
        string severity
        int status_id FK
        int capa_id FK
        text corrective_action
        date due_date
        int assigned_to FK
        timestamp created_at
        timestamp updated_at
    }
    
    audit_log {
        int id PK
        string table_name
        int record_id
        string action
        jsonb old_values
        jsonb new_values
        int user_id FK
        timestamp timestamp
        inet ip_address
        text user_agent
    }
    
    electronic_signatures {
        int id PK
        string entity_type
        int entity_id
        int user_id FK
        text signature_meaning
        timestamp signed_at
        inet ip_address
        text user_agent
        boolean is_valid
    }
    
    workflow_instances {
        int id PK
        string definition_id
        string entity_type
        int entity_id
        string status
        string current_step
        jsonb variables
        timestamp created_at
        timestamp updated_at
    }
    
    workflow_history {
        int id PK
        int instance_id FK
        string step_id
        string action
        int performed_by FK
        jsonb step_data
        timestamp performed_at
    }
    
    users ||--o{ management_reviews : "created_by"
    users ||--o{ management_reviews : "scheduled_by"
    management_reviews ||--o{ management_review_inputs : "review_id"
    management_reviews ||--o{ management_review_action_items : "review_id"
    users ||--o{ management_review_inputs : "created_by"
    users ||--o{ management_review_action_items : "assigned_to"
    
    users ||--o{ capas : "initiated_by"
    users ||--o{ capas : "assigned_to"
    
    users ||--o{ audits : "created_by"
    audits ||--o{ audit_findings : "audit_id"
    capas ||--o{ audit_findings : "capa_id"
    users ||--o{ audit_findings : "assigned_to"
    
    users ||--o{ audit_log : "user_id"
    users ||--o{ electronic_signatures : "user_id"
    
    workflow_instances ||--o{ workflow_history : "instance_id"
    users ||--o{ workflow_history : "performed_by"
```

---

## 4. Security Architecture Diagram

```mermaid
graph TB
    subgraph "External Access"
        INTERNET[Internet]
        VPN[Corporate VPN]
        MOBILE_NET[Mobile Networks]
    end
    
    subgraph "Edge Security"
        WAF[Web Application<br/>Firewall]
        DDoS[DDoS Protection<br/>CloudFlare/AWS Shield]
        CDN[Content Delivery<br/>Network]
    end
    
    subgraph "Application Security"
        LB[Load Balancer<br/>SSL Termination]
        API_GW[API Gateway<br/>Rate Limiting]
        
        subgraph "Authentication Layer"
            OAUTH[OAuth 2.0/<br/>OpenID Connect]
            MFA[Multi-Factor<br/>Authentication]
            JWT[JWT Token<br/>Management]
        end
        
        subgraph "Authorization Layer"
            RBAC[Role-Based<br/>Access Control]
            ABAC[Attribute-Based<br/>Access Control]
            PERM[Permission<br/>Engine]
        end
    end
    
    subgraph "Data Security"
        ENCRYPT[Application-Level<br/>Encryption]
        HASH[Password<br/>Hashing]
        SALT[Salt Generation<br/>& Management]
    end
    
    subgraph "Infrastructure Security"
        FIREWALL[Network<br/>Firewall]
        IDS[Intrusion Detection<br/>System]
        VAULT[Secret<br/>Management]
        MONITOR[Security<br/>Monitoring]
    end
    
    subgraph "Data Storage"
        DB_ENCRYPT[(Database<br/>Encryption at Rest)]
        FILE_ENCRYPT[(File Storage<br/>Encryption)]
        BACKUP_ENCRYPT[(Backup<br/>Encryption)]
    end
    
    INTERNET --> WAF
    VPN --> WAF
    MOBILE_NET --> WAF
    
    WAF --> DDoS
    DDoS --> CDN
    CDN --> LB
    
    LB --> API_GW
    API_GW --> OAUTH
    OAUTH --> MFA
    MFA --> JWT
    
    JWT --> RBAC
    RBAC --> ABAC
    ABAC --> PERM
    
    PERM --> ENCRYPT
    ENCRYPT --> HASH
    HASH --> SALT
    
    FIREWALL --> IDS
    IDS --> VAULT
    VAULT --> MONITOR
    
    ENCRYPT --> DB_ENCRYPT
    ENCRYPT --> FILE_ENCRYPT
    ENCRYPT --> BACKUP_ENCRYPT
```

---

## 5. Deployment Architecture Diagram

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_IDE[Developer IDE<br/>VS Code/IntelliJ]
        DEV_LOCAL[Local Development<br/>Docker Compose]
        GIT[Git Repository<br/>GitHub/GitLab]
    end
    
    subgraph "CI/CD Pipeline"
        TRIGGER[Git Push/PR<br/>Trigger]
        BUILD[Build Stage<br/>GitHub Actions]
        TEST[Test Stage<br/>Unit/Integration]
        SECURITY[Security Scan<br/>SAST/DAST]
        DOCKER[Docker Build<br/>& Registry Push]
    end
    
    subgraph "Staging Environment"
        STAGING_K8S[Kubernetes Cluster<br/>Staging]
        STAGING_DB[(Staging Database<br/>PostgreSQL)]
        STAGING_CACHE[(Staging Cache<br/>Redis)]
        STAGING_STORAGE[(Staging Storage<br/>S3 Compatible)]
    end
    
    subgraph "Production Environment"
        subgraph "Blue-Green Deployment"
            BLUE[Blue Environment<br/>Current Production]
            GREEN[Green Environment<br/>New Deployment]
            LB_PROD[Production Load<br/>Balancer]
        end
        
        subgraph "Production Infrastructure"
            PROD_K8S[Kubernetes Cluster<br/>Production]
            PROD_DB[(Production Database<br/>PostgreSQL HA)]
            PROD_CACHE[(Production Cache<br/>Redis Cluster)]
            PROD_STORAGE[(Production Storage<br/>S3 Compatible)]
        end
        
        subgraph "Monitoring & Observability"
            PROMETHEUS[Prometheus<br/>Metrics]
            GRAFANA[Grafana<br/>Dashboards]
            ELASTICSEARCH[Elasticsearch<br/>Logs]
            KIBANA[Kibana<br/>Log Analysis]
            SENTRY[Sentry<br/>Error Tracking]
            ALERTMANAGER[AlertManager<br/>Notifications]
        end
    end
    
    DEV_IDE --> DEV_LOCAL
    DEV_LOCAL --> GIT
    GIT --> TRIGGER
    
    TRIGGER --> BUILD
    BUILD --> TEST
    TEST --> SECURITY
    SECURITY --> DOCKER
    
    DOCKER --> STAGING_K8S
    STAGING_K8S --> STAGING_DB
    STAGING_K8S --> STAGING_CACHE
    STAGING_K8S --> STAGING_STORAGE
    
    STAGING_K8S --> GREEN
    GREEN --> LB_PROD
    LB_PROD --> BLUE
    
    BLUE --> PROD_K8S
    GREEN --> PROD_K8S
    PROD_K8S --> PROD_DB
    PROD_K8S --> PROD_CACHE
    PROD_K8S --> PROD_STORAGE
    
    PROD_K8S --> PROMETHEUS
    PROMETHEUS --> GRAFANA
    PROD_K8S --> ELASTICSEARCH
    ELASTICSEARCH --> KIBANA
    PROD_K8S --> SENTRY
    PROMETHEUS --> ALERTMANAGER
```

---

## 6. Data Flow Diagram

```mermaid
graph TB
    subgraph "User Actions"
        USER[User]
        BROWSER[Web Browser]
        MOBILE[Mobile App]
    end
    
    subgraph "API Layer"
        AUTH_MW[Authentication<br/>Middleware]
        AUTHZ_MW[Authorization<br/>Middleware]
        VALIDATE[Request<br/>Validation]
        RATE_LIMIT[Rate<br/>Limiting]
    end
    
    subgraph "Business Logic"
        CONTROLLER[API Controller]
        SERVICE[Business Service]
        WORKFLOW[Workflow Engine]
        NOTIFICATION[Notification Service]
    end
    
    subgraph "Data Layer"
        CACHE_CHECK{Cache<br/>Check}
        DB_QUERY[Database<br/>Query]
        AUDIT_LOG[Audit<br/>Logging]
        FILE_OPS[File<br/>Operations]
    end
    
    subgraph "External Systems"
        EMAIL_SVC[Email Service]
        SMS_SVC[SMS Service]
        ERP_SYS[ERP System]
        DOC_SYS[Document System]
    end
    
    USER --> BROWSER
    USER --> MOBILE
    
    BROWSER --> AUTH_MW
    MOBILE --> AUTH_MW
    
    AUTH_MW --> AUTHZ_MW
    AUTHZ_MW --> VALIDATE
    VALIDATE --> RATE_LIMIT
    
    RATE_LIMIT --> CONTROLLER
    CONTROLLER --> SERVICE
    SERVICE --> WORKFLOW
    SERVICE --> NOTIFICATION
    
    SERVICE --> CACHE_CHECK
    CACHE_CHECK -->|Hit| SERVICE
    CACHE_CHECK -->|Miss| DB_QUERY
    DB_QUERY --> AUDIT_LOG
    DB_QUERY --> FILE_OPS
    
    NOTIFICATION --> EMAIL_SVC
    NOTIFICATION --> SMS_SVC
    SERVICE --> ERP_SYS
    SERVICE --> DOC_SYS
    
    SERVICE --> CONTROLLER
    CONTROLLER --> AUTH_MW
    AUTH_MW --> BROWSER
    AUTH_MW --> MOBILE
```

---

## 7. Microservices Architecture (Future State)

```mermaid
graph TB
    subgraph "API Gateway"
        GATEWAY[Kong/Istio<br/>API Gateway]
        SERVICE_MESH[Service Mesh<br/>Istio/Linkerd]
    end
    
    subgraph "Core QMS Services"
        MR_SVC[Management Review<br/>Service]
        CAPA_SVC[CAPA<br/>Service]
        AUDIT_SVC[Audit<br/>Service]
        DOC_SVC[Document Control<br/>Service]
        SUPPLIER_SVC[Supplier Management<br/>Service]
    end
    
    subgraph "Platform Services"
        AUTH_SVC[Authentication<br/>Service]
        USER_SVC[User Management<br/>Service]
        NOTIF_SVC[Notification<br/>Service]
        WORKFLOW_SVC[Workflow<br/>Service]
        AUDIT_TRAIL_SVC[Audit Trail<br/>Service]
    end
    
    subgraph "Infrastructure Services"
        CONFIG_SVC[Configuration<br/>Service]
        HEALTH_SVC[Health Check<br/>Service]
        METRICS_SVC[Metrics<br/>Service]
        LOG_SVC[Logging<br/>Service]
    end
    
    subgraph "Data Stores"
        MR_DB[(Management Review<br/>Database)]
        CAPA_DB[(CAPA<br/>Database)]
        AUDIT_DB[(Audit<br/>Database)]
        USER_DB[(User<br/>Database)]
        CACHE_CLUSTER[(Redis<br/>Cluster)]
        FILE_STORE[(Distributed<br/>File Storage)]
    end
    
    subgraph "Message Queue"
        KAFKA[Apache Kafka<br/>Event Streaming]
        RABBITMQ[RabbitMQ<br/>Message Queue]
    end
    
    GATEWAY --> SERVICE_MESH
    SERVICE_MESH --> MR_SVC
    SERVICE_MESH --> CAPA_SVC
    SERVICE_MESH --> AUDIT_SVC
    SERVICE_MESH --> DOC_SVC
    SERVICE_MESH --> SUPPLIER_SVC
    
    MR_SVC --> AUTH_SVC
    CAPA_SVC --> USER_SVC
    AUDIT_SVC --> NOTIF_SVC
    DOC_SVC --> WORKFLOW_SVC
    SUPPLIER_SVC --> AUDIT_TRAIL_SVC
    
    AUTH_SVC --> CONFIG_SVC
    USER_SVC --> HEALTH_SVC
    NOTIF_SVC --> METRICS_SVC
    WORKFLOW_SVC --> LOG_SVC
    
    MR_SVC --> MR_DB
    CAPA_SVC --> CAPA_DB
    AUDIT_SVC --> AUDIT_DB
    AUTH_SVC --> USER_DB
    
    MR_SVC --> CACHE_CLUSTER
    CAPA_SVC --> CACHE_CLUSTER
    AUDIT_SVC --> FILE_STORE
    
    NOTIF_SVC --> KAFKA
    WORKFLOW_SVC --> RABBITMQ
    AUDIT_TRAIL_SVC --> KAFKA
```

---

## 8. Container Architecture Diagram

```mermaid
graph TB
    subgraph "Container Registry"
        REGISTRY[Docker Registry<br/>Harbor/ECR]
    end
    
    subgraph "Kubernetes Cluster"
        subgraph "Namespace: eqms-prod"
            subgraph "Frontend Pods"
                NGINX_POD[Nginx Pod<br/>Static Files]
                REACT_POD[React App Pod<br/>SSR Optional]
            end
            
            subgraph "Backend Pods"
                API_POD1[API Pod 1<br/>Node.js]
                API_POD2[API Pod 2<br/>Node.js]
                API_POD3[API Pod 3<br/>Node.js]
            end
            
            subgraph "Background Services"
                WORKER_POD[Worker Pod<br/>Background Jobs]
                CRON_POD[Cron Pod<br/>Scheduled Tasks]
            end
            
            subgraph "Data Services"
                POSTGRES_STS[PostgreSQL<br/>StatefulSet]
                REDIS_STS[Redis<br/>StatefulSet]
            end
            
            subgraph "Storage"
                PVC_DB[Persistent Volume<br/>Database]
                PVC_FILES[Persistent Volume<br/>File Storage]
            end
            
            subgraph "Networking"
                INGRESS[Ingress Controller<br/>nginx/traefik]
                SVC_API[API Service<br/>LoadBalancer]
                SVC_DB[Database Service<br/>ClusterIP]
                SVC_REDIS[Redis Service<br/>ClusterIP]
            end
        end
        
        subgraph "System Services"
            PROMETHEUS_POD[Prometheus Pod<br/>Metrics]
            GRAFANA_POD[Grafana Pod<br/>Dashboards]
            FLUENTD_POD[Fluentd Pod<br/>Log Shipping]
        end
    end
    
    REGISTRY --> API_POD1
    REGISTRY --> API_POD2
    REGISTRY --> API_POD3
    REGISTRY --> NGINX_POD
    REGISTRY --> WORKER_POD
    
    INGRESS --> SVC_API
    SVC_API --> API_POD1
    SVC_API --> API_POD2
    SVC_API --> API_POD3
    
    API_POD1 --> SVC_DB
    API_POD2 --> SVC_DB
    API_POD3 --> SVC_DB
    
    API_POD1 --> SVC_REDIS
    API_POD2 --> SVC_REDIS
    API_POD3 --> SVC_REDIS
    
    SVC_DB --> POSTGRES_STS
    SVC_REDIS --> REDIS_STS
    
    POSTGRES_STS --> PVC_DB
    API_POD1 --> PVC_FILES
    
    API_POD1 -.-> PROMETHEUS_POD
    API_POD2 -.-> PROMETHEUS_POD
    API_POD3 -.-> PROMETHEUS_POD
    
    FLUENTD_POD -.-> API_POD1
    FLUENTD_POD -.-> API_POD2
    FLUENTD_POD -.-> API_POD3
```

This comprehensive architectural documentation provides detailed visual representations of the eQMS system architecture from multiple perspectives, supporting the design and implementation of a robust, scalable, and compliant quality management system.
# SLA and Monitoring Strategy
## System Monitoring, Error Reporting, and Uptime Management for eQMS

**Document Control Information**
- Document ID: SMS-eQMS-2025-001
- Version: 1.0
- Date: June 4, 2025
- Author: Platform Engineering Team
- Classification: Controlled Document

---

## 1. Service Level Agreement (SLA) Framework

### 1.1 SLA Objectives and Commitments

| Service Component | Availability Target | Performance Target | Recovery Time Objective | Recovery Point Objective |
|-------------------|-------------------|-------------------|------------------------|-------------------------|
| **Core Application** | 99.9% uptime | <2s response time (95th percentile) | <1 hour | <15 minutes |
| **Database Services** | 99.95% uptime | <500ms query response | <30 minutes | <5 minutes |
| **Authentication** | 99.99% uptime | <1s login response | <15 minutes | <1 minute |
| **API Services** | 99.9% uptime | <1.5s API response | <45 minutes | <10 minutes |
| **File Storage** | 99.95% uptime | <3s upload/download | <2 hours | <30 minutes |
| **Backup Systems** | 99.5% uptime | Daily backup completion | <4 hours | <1 hour |

### 1.2 SLA Measurement Methodology

#### 1.2.1 Availability Calculation
```typescript
interface AvailabilityMetrics {
  totalTimeMs: number;
  downtimeMs: number;
  plannedMaintenanceMs: number;
  availability: number;
  uptime: number;
}

class SLACalculator {
  calculateAvailability(timeframe: TimeFrame): AvailabilityMetrics {
    const totalTime = timeframe.endTime - timeframe.startTime;
    const incidents = this.getIncidents(timeframe);
    const maintenance = this.getPlannedMaintenance(timeframe);
    
    const downtimeMs = incidents.reduce((total, incident) => 
      total + incident.durationMs, 0
    );
    
    const plannedMaintenanceMs = maintenance.reduce((total, window) => 
      total + window.durationMs, 0
    );
    
    // Planned maintenance doesn't count against SLA
    const adjustedTotalTime = totalTime - plannedMaintenanceMs;
    const availability = ((adjustedTotalTime - downtimeMs) / adjustedTotalTime) * 100;
    
    return {
      totalTimeMs: totalTime,
      downtimeMs,
      plannedMaintenanceMs,
      availability,
      uptime: adjustedTotalTime - downtimeMs
    };
  }
  
  calculatePerformanceCompliance(metrics: PerformanceMetric[]): PerformanceCompliance {
    const responseTime95th = this.calculatePercentile(metrics.map(m => m.responseTime), 95);
    const target = 2000; // 2 seconds
    
    const compliantRequests = metrics.filter(m => m.responseTime <= target).length;
    const compliancePercentage = (compliantRequests / metrics.length) * 100;
    
    return {
      target95thPercentile: target,
      actual95thPercentile: responseTime95th,
      compliancePercentage,
      isCompliant: compliancePercentage >= 95,
      totalRequests: metrics.length,
      compliantRequests
    };
  }
}
```

### 1.3 SLA Penalties and Credits

#### 1.3.1 Service Credit Framework
```typescript
interface ServiceCredit {
  availabilityRange: AvailabilityRange;
  creditPercentage: number;
  maxCreditPerMonth: number;
}

const SERVICE_CREDIT_SCHEDULE: ServiceCredit[] = [
  {
    availabilityRange: { min: 99.0, max: 99.9 },
    creditPercentage: 10,
    maxCreditPerMonth: 25
  },
  {
    availabilityRange: { min: 95.0, max: 99.0 },
    creditPercentage: 25,
    maxCreditPerMonth: 50
  },
  {
    availabilityRange: { min: 0, max: 95.0 },
    creditPercentage: 50,
    maxCreditPerMonth: 100
  }
];

class SLACreditCalculator {
  calculateServiceCredit(actualAvailability: number, monthlyFee: number): ServiceCredit {
    const applicableCredit = SERVICE_CREDIT_SCHEDULE.find(credit => 
      actualAvailability >= credit.availabilityRange.min && 
      actualAvailability < credit.availabilityRange.max
    );
    
    if (!applicableCredit) return { creditAmount: 0, creditPercentage: 0 };
    
    const creditAmount = Math.min(
      (monthlyFee * applicableCredit.creditPercentage) / 100,
      (monthlyFee * applicableCredit.maxCreditPerMonth) / 100
    );
    
    return {
      creditAmount,
      creditPercentage: applicableCredit.creditPercentage,
      availabilityAchieved: actualAvailability,
      qualifiesForCredit: true
    };
  }
}
```

---

## 2. Monitoring Architecture

### 2.1 Monitoring Stack Components

#### 2.1.1 Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'eqms-production'
    environment: 'production'

rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

scrape_configs:
  # Application metrics
  - job_name: 'eqms-backend'
    static_configs:
      - targets: ['eqms-backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s
    
  # Database metrics
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s
    
  # Redis metrics
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 30s
    
  # Node metrics
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: '(.*):(.*)'
        target_label: __address__
        replacement: '${1}:9100'
        
  # Kubernetes metrics
  - job_name: 'kube-state-metrics'
    static_configs:
      - targets: ['kube-state-metrics:8080']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### 2.1.2 Custom Metrics Implementation
```typescript
// Application Metrics Collection
import { register, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsCollector {
  private readonly httpRequestsTotal = new Counter({
    name: 'eqms_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'user_role']
  });
  
  private readonly httpRequestDuration = new Histogram({
    name: 'eqms_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });
  
  private readonly databaseConnections = new Gauge({
    name: 'eqms_database_connections_active',
    help: 'Number of active database connections'
  });
  
  private readonly businessMetrics = {
    managementReviewsCreated: new Counter({
      name: 'eqms_management_reviews_created_total',
      help: 'Total number of management reviews created',
      labelNames: ['department', 'review_type']
    }),
    
    capaProcessingTime: new Histogram({
      name: 'eqms_capa_processing_time_days',
      help: 'Time taken to complete CAPA process in days',
      labelNames: ['capa_type', 'priority'],
      buckets: [1, 3, 7, 14, 30, 60, 90]
    }),
    
    auditFindings: new Counter({
      name: 'eqms_audit_findings_total',
      help: 'Total number of audit findings',
      labelNames: ['audit_type', 'severity', 'department']
    })
  };
  
  recordHttpRequest(method: string, route: string, statusCode: number, userRole: string): void {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      user_role: userRole
    });
  }
  
  recordHttpDuration(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }
  
  recordBusinessEvent(eventType: string, labels: Record<string, string>, value?: number): void {
    const metric = this.businessMetrics[eventType];
    if (metric) {
      if (metric instanceof Counter) {
        metric.inc(labels, value || 1);
      } else if (metric instanceof Histogram) {
        metric.observe(labels, value || 0);
      }
    }
  }
}

// Middleware for automatic metrics collection
export function metricsMiddleware(metricsCollector: MetricsCollector) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const userRole = req.user?.role || 'anonymous';
      
      metricsCollector.recordHttpRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        userRole
      );
      
      metricsCollector.recordHttpDuration(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration
      );
    });
    
    next();
  };
}
```

### 2.2 Grafana Dashboard Configuration

#### 2.2.1 SLA Dashboard
```json
{
  "dashboard": {
    "title": "eQMS SLA Dashboard",
    "tags": ["eqms", "sla", "monitoring"],
    "panels": [
      {
        "title": "System Availability (Current Month)",
        "type": "stat",
        "targets": [
          {
            "expr": "100 - (increase(eqms_downtime_seconds_total[30d]) / (30 * 24 * 3600) * 100)",
            "legendFormat": "Availability %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 99.5},
                {"color": "green", "value": 99.9}
              ]
            },
            "unit": "percent"
          }
        }
      },
      {
        "title": "Response Time SLA Compliance",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(eqms_http_request_duration_seconds_bucket[5m])) * 1000",
            "legendFormat": "95th Percentile (ms)"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 1500},
                {"color": "red", "value": 2000}
              ]
            },
            "unit": "ms"
          }
        }
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(eqms_http_requests_total{status_code=~\"5..\"}[5m]) / rate(eqms_http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ],
        "yAxes": [
          {
            "max": 5,
            "min": 0,
            "unit": "percent"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_tup_fetched{datname=\"eqms\"}",
            "legendFormat": "Rows Fetched"
          },
          {
            "expr": "pg_stat_database_tup_inserted{datname=\"eqms\"}",
            "legendFormat": "Rows Inserted"
          }
        ]
      }
    ]
  }
}
```

#### 2.2.2 Business Metrics Dashboard
```json
{
  "dashboard": {
    "title": "eQMS Business Metrics",
    "panels": [
      {
        "title": "Management Reviews Created (Daily)",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(eqms_management_reviews_created_total[1d])",
            "legendFormat": "Reviews Created"
          }
        ]
      },
      {
        "title": "CAPA Processing Time Distribution",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(eqms_capa_processing_time_days_bucket[1h])",
            "legendFormat": "{{le}}"
          }
        ]
      },
      {
        "title": "Audit Findings by Severity",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (severity) (eqms_audit_findings_total)",
            "legendFormat": "{{severity}}"
          }
        ]
      },
      {
        "title": "System Usage by Department",
        "type": "bargauge",
        "targets": [
          {
            "expr": "sum by (user_role) (rate(eqms_http_requests_total[1h]))",
            "legendFormat": "{{user_role}}"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Alerting Strategy

### 3.1 Alert Rules Configuration

#### 3.1.1 Critical System Alerts
```yaml
# alert_rules.yml
groups:
  - name: eqms_critical_alerts
    rules:
    - alert: HighErrorRate
      expr: rate(eqms_http_requests_total{status_code=~"5.."}[5m]) / rate(eqms_http_requests_total[5m]) > 0.05
      for: 2m
      labels:
        severity: critical
        service: eqms
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
        runbook_url: "https://runbooks.company.com/eqms/high-error-rate"
        
    - alert: DatabaseConnectionsHigh
      expr: eqms_database_connections_active > 80
      for: 5m
      labels:
        severity: warning
        service: database
      annotations:
        summary: "High number of database connections"
        description: "Database has {{ $value }} active connections"
        
    - alert: ResponseTimeHigh
      expr: histogram_quantile(0.95, rate(eqms_http_request_duration_seconds_bucket[5m])) > 2
      for: 3m
      labels:
        severity: warning
        service: eqms
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is {{ $value }}s"
        
    - alert: SystemDown
      expr: up{job="eqms-backend"} == 0
      for: 1m
      labels:
        severity: critical
        service: eqms
      annotations:
        summary: "eQMS system is down"
        description: "eQMS backend service is not responding"
        
    - alert: DiskSpaceHigh
      expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
      for: 5m
      labels:
        severity: warning
        service: infrastructure
      annotations:
        summary: "Low disk space"
        description: "Disk space is below 10% on {{ $labels.instance }}"

  - name: eqms_business_alerts
    rules:
    - alert: CAPAProcessingTimeHigh
      expr: histogram_quantile(0.90, rate(eqms_capa_processing_time_days_bucket[1d])) > 30
      for: 1h
      labels:
        severity: warning
        service: business_process
      annotations:
        summary: "CAPA processing time is high"
        description: "90th percentile CAPA processing time is {{ $value }} days"
        
    - alert: AuditFindingsSpike
      expr: increase(eqms_audit_findings_total[1h]) > 10
      for: 0m
      labels:
        severity: info
        service: business_process
      annotations:
        summary: "Unusual spike in audit findings"
        description: "{{ $value }} audit findings created in the last hour"
```

#### 3.1.2 AlertManager Configuration
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.company.com:587'
  smtp_from: 'alerts@company.com'
  smtp_auth_username: 'alerts@company.com'
  smtp_auth_password: 'smtp_password'

route:
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
    repeat_interval: 15m
  - match:
      severity: warning
    receiver: 'warning-alerts'
    repeat_interval: 1h
  - match:
      service: business_process
    receiver: 'business-alerts'
    repeat_interval: 4h

receivers:
- name: 'default'
  email_configs:
  - to: 'devops@company.com'
    subject: '[{{ .Status | title }}] {{ .GroupLabels.SortedPairs.Values | join " " }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

- name: 'critical-alerts'
  email_configs:
  - to: 'devops@company.com,management@company.com'
    subject: '[CRITICAL] eQMS Alert'
  pagerduty_configs:
  - service_key: 'pagerduty_service_key'
    description: '{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}'
  slack_configs:
  - api_url: 'slack_webhook_url'
    channel: '#alerts-critical'
    title: 'Critical Alert'
    text: '{{ .CommonAnnotations.description }}'

- name: 'warning-alerts'
  email_configs:
  - to: 'devops@company.com'
    subject: '[WARNING] eQMS Alert'
  slack_configs:
  - api_url: 'slack_webhook_url'
    channel: '#alerts-warning'
    title: 'Warning Alert'

- name: 'business-alerts'
  email_configs:
  - to: 'quality@company.com'
    subject: '[INFO] eQMS Business Process Alert'
```

### 3.2 Incident Response Integration

#### 3.2.1 Automated Incident Creation
```typescript
class IncidentManager {
  async handleCriticalAlert(alert: PrometheusAlert): Promise<Incident> {
    const incident = await this.createIncident({
      title: alert.annotations.summary,
      description: alert.annotations.description,
      severity: this.mapAlertSeverity(alert.labels.severity),
      affectedServices: [alert.labels.service],
      alertSource: alert.generatorURL,
      createdAt: new Date(alert.startsAt)
    });
    
    // Auto-assign based on service and time
    const assignee = await this.determineAssignee(alert);
    if (assignee) {
      await this.assignIncident(incident.id, assignee.id);
    }
    
    // Create communication channels
    await this.createIncidentChannel(incident);
    
    // Notify stakeholders
    await this.notifyStakeholders(incident);
    
    return incident;
  }
  
  private async determineAssignee(alert: PrometheusAlert): Promise<User | null> {
    const currentTime = new Date();
    const isBusinessHours = this.isBusinessHours(currentTime);
    
    if (alert.labels.service === 'database') {
      return isBusinessHours 
        ? await this.getDBAOnCall()
        : await this.getDBAOnCallAfterHours();
    }
    
    if (alert.labels.severity === 'critical') {
      return await this.getIncidentCommander();
    }
    
    return await this.getDefaultAssignee(alert.labels.service);
  }
  
  async updateSLABreach(incident: Incident): Promise<void> {
    const breach = await this.calculateSLABreach(incident);
    
    if (breach.isBreached) {
      await this.createSLABreachRecord(incident, breach);
      await this.notifySLABreach(incident, breach);
      
      // Auto-escalate if needed
      if (breach.severity === 'major') {
        await this.escalateIncident(incident);
      }
    }
  }
}
```

---

## 4. Error Reporting and Tracking

### 4.1 Sentry Integration

#### 4.1.1 Error Capture Configuration
```typescript
// Frontend Error Tracking
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out known issues
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('ResizeObserver loop limit exceeded')) {
        return null; // Don't send to Sentry
      }
    }
    
    // Add user context
    if (event.user) {
      event.user.department = getCurrentUserDepartment();
      event.user.role = getCurrentUserRole();
    }
    
    return event;
  }
});

// Backend Error Tracking
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
    new Tracing.Integrations.Postgres(),
  ],
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Add regulatory context
    if (event.tags) {
      event.tags.regulation_impact = determineRegulatoryImpact(event);
      event.tags.data_sensitivity = determineDataSensitivity(event);
    }
    
    return event;
  }
});

export function configureSentryForQMS(app: Express): void {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  
  // Add QMS-specific context
  app.use((req, res, next) => {
    Sentry.configureScope((scope) => {
      scope.setTag("module", getQMSModule(req.path));
      scope.setTag("compliance_required", isComplianceRequired(req.path));
      scope.setUser({
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        department: req.user?.department
      });
    });
    next();
  });
  
  // Error handler (must be last)
  app.use(Sentry.Handlers.errorHandler());
}
```

#### 4.1.2 Custom Error Classification
```typescript
enum ErrorClassification {
  BUSINESS_LOGIC = 'business_logic',
  DATA_VALIDATION = 'data_validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  INFRASTRUCTURE = 'infrastructure',
  REGULATORY_COMPLIANCE = 'regulatory_compliance'
}

class ErrorReporter {
  reportError(error: Error, context: ErrorContext): void {
    const classification = this.classifyError(error, context);
    const severity = this.determineSeverity(error, classification, context);
    
    Sentry.withScope((scope) => {
      scope.setTag("error_classification", classification);
      scope.setTag("severity", severity);
      scope.setTag("regulatory_impact", this.assessRegulatoryImpact(error, context));
      scope.setLevel(this.mapSeverityToSentryLevel(severity));
      
      scope.setContext("qms_context", {
        module: context.module,
        workflow_step: context.workflowStep,
        entity_type: context.entityType,
        entity_id: context.entityId,
        user_action: context.userAction
      });
      
      scope.setContext("technical_context", {
        request_id: context.requestId,
        session_id: context.sessionId,
        api_version: context.apiVersion,
        client_version: context.clientVersion
      });
      
      Sentry.captureException(error);
    });
    
    // Also log to structured logs for compliance
    this.logComplianceError(error, classification, context);
  }
  
  private classifyError(error: Error, context: ErrorContext): ErrorClassification {
    if (error instanceof ValidationError) {
      return ErrorClassification.DATA_VALIDATION;
    }
    
    if (error instanceof UnauthorizedError) {
      return ErrorClassification.AUTHORIZATION;
    }
    
    if (context.module === 'audit' || context.module === 'capa') {
      return ErrorClassification.REGULATORY_COMPLIANCE;
    }
    
    if (error.message.includes('database') || error.message.includes('query')) {
      return ErrorClassification.DATABASE;
    }
    
    return ErrorClassification.BUSINESS_LOGIC;
  }
}
```

### 4.2 Log Aggregation and Analysis

#### 4.2.1 Structured Logging Configuration
```typescript
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        '@timestamp': timestamp,
        level,
        message,
        service: 'eqms',
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION,
        ...meta
      });
    })
  ),
  defaultMeta: {
    service: 'eqms',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
      },
      index: 'eqms-logs'
    })
  ]
});

// QMS-specific logging methods
export const qmsLogger = {
  auditTrail: (data: AuditTrailData) => {
    logger.info('Audit trail entry', {
      type: 'audit_trail',
      entity_type: data.entityType,
      entity_id: data.entityId,
      action: data.action,
      user_id: data.userId,
      changes: data.changes,
      compliance_requirement: data.complianceRequirement
    });
  },
  
  businessProcess: (data: BusinessProcessData) => {
    logger.info('Business process event', {
      type: 'business_process',
      process_name: data.processName,
      step: data.step,
      status: data.status,
      duration_ms: data.durationMs,
      user_id: data.userId
    });
  },
  
  securityEvent: (data: SecurityEventData) => {
    logger.warn('Security event', {
      type: 'security_event',
      event_type: data.eventType,
      severity: data.severity,
      user_id: data.userId,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      additional_context: data.context
    });
  },
  
  complianceEvent: (data: ComplianceEventData) => {
    logger.info('Compliance event', {
      type: 'compliance_event',
      regulation: data.regulation,
      requirement: data.requirement,
      status: data.status,
      entity_type: data.entityType,
      entity_id: data.entityId,
      evidence: data.evidence
    });
  }
};
```

---

## 5. Health Checks and Readiness Probes

### 5.1 Comprehensive Health Check Implementation

#### 5.1.1 Health Check Service
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: ComponentHealth[];
  overall_status: string;
  response_time_ms: number;
}

interface ComponentHealth {
  component: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  response_time_ms: number;
  details?: any;
  last_success?: Date;
  last_failure?: Date;
}

class HealthCheckService {
  private readonly checks: HealthCheck[] = [
    new DatabaseHealthCheck(),
    new RedisHealthCheck(),
    new FileStorageHealthCheck(),
    new ExternalAPIHealthCheck(),
    new MemoryHealthCheck(),
    new DiskSpaceHealthCheck()
  ];
  
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checkResults = await Promise.allSettled(
      this.checks.map(check => this.executeCheck(check))
    );
    
    const checks: ComponentHealth[] = checkResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          component: this.checks[index].name,
          status: 'unhealthy',
          response_time_ms: Date.now() - startTime,
          details: { error: result.reason.message }
        };
      }
    });
    
    const overallStatus = this.determineOverallStatus(checks);
    
    return {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      overall_status: this.getStatusDescription(overallStatus),
      response_time_ms: Date.now() - startTime
    };
  }
  
  private async executeCheck(check: HealthCheck): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
      const result = await Promise.race([
        check.execute(),
        this.timeout(check.timeoutMs || 5000)
      ]);
      
      return {
        component: check.name,
        status: result.status,
        response_time_ms: Date.now() - startTime,
        details: result.details,
        last_success: result.status === 'healthy' ? new Date() : undefined
      };
    } catch (error) {
      return {
        component: check.name,
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        details: { error: error.message },
        last_failure: new Date()
      };
    }
  }
  
  private determineOverallStatus(checks: ComponentHealth[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    if (unhealthyCount > 0) {
      // Critical components (database, auth) being unhealthy = overall unhealthy
      const criticalUnhealthy = checks.some(c => 
        c.status === 'unhealthy' && ['database', 'authentication'].includes(c.component)
      );
      
      return criticalUnhealthy ? 'unhealthy' : 'degraded';
    }
    
    if (degradedCount > 0) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

// Specific health check implementations
class DatabaseHealthCheck implements HealthCheck {
  name = 'database';
  timeoutMs = 3000;
  
  async execute(): Promise<HealthCheckComponentResult> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.db.raw('SELECT 1');
      
      // Test critical table access
      await this.db('users').count('id').first();
      
      // Check connection pool
      const poolStats = this.db.client.pool;
      
      return {
        status: 'healthy',
        details: {
          response_time_ms: Date.now() - startTime,
          active_connections: poolStats.numUsed(),
          pending_connections: poolStats.numPendingCreates(),
          pool_size: poolStats.size
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}
```

### 5.2 Kubernetes Health Check Integration

#### 5.2.1 Liveness and Readiness Probes
```yaml
# kubernetes deployment with health checks
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eqms-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: eqms/backend:latest
        ports:
        - containerPort: 3000
        
        # Liveness probe - determines if container should be restarted
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
          successThreshold: 1
        
        # Readiness probe - determines if container can receive traffic
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
          successThreshold: 1
        
        # Startup probe - gives container time to initialize
        startupProbe:
          httpGet:
            path: /health/startup
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 30
          successThreshold: 1
```

This comprehensive SLA and monitoring strategy provides enterprise-grade observability and reliability for the eQMS system, ensuring regulatory compliance while maintaining operational excellence.
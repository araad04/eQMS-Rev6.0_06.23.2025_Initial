# Detailed Design Specification (DDS)
## Medical Device eQMS (Electronic Quality Management System)

**Document Number:** DDS-MD-eQMS-001  
**Version:** 1.0  
**Date:** May 15, 2025  

## 1. Introduction

### 1.1 Purpose
This Detailed Design Specification (DDS) provides a comprehensive description of the architecture, design patterns, database schema, and system interfaces for the Medical Device electronic Quality Management System (eQMS). It serves as a blueprint for system implementation and ongoing maintenance.

### 1.2 Scope
This document covers the detailed technical design for all modules of the eQMS, including authentication, document control, CAPA management, audit management, training records, risk assessment, supplier management, design control, production, measurement & analysis, and management review.

### 1.3 References
- User Requirements Specification (URS-MD-eQMS-001)
- System Requirements Specification (SRS-MD-eQMS-001)
- ISO 13485:2016 Medical Devices - Quality Management Systems
- FDA 21 CFR Part 11 Electronic Records and Signatures
- FDA 21 CFR Part 820 Quality System Regulation
- EU MDR 2017/745 Medical Device Regulation

### 1.4 Definitions and Acronyms
- **API**: Application Programming Interface
- **CAPA**: Corrective Action and Preventive Action
- **CSRF**: Cross-Site Request Forgery
- **DTO**: Data Transfer Object
- **eQMS**: Electronic Quality Management System
- **JWT**: JSON Web Token
- **ORM**: Object-Relational Mapping
- **RBAC**: Role-Based Access Control
- **REST**: Representational State Transfer
- **SCR**: Supplier Corrective Request
- **SQL**: Structured Query Language
- **URS**: User Requirements Specification
- **XSS**: Cross-Site Scripting

## 2. System Architecture

### 2.1 Architectural Overview

The eQMS follows a multi-tier architecture pattern with clear separation of concerns:

1. **Presentation Layer**: React-based frontend with modular components
2. **Application Layer**: Express.js API services implementing business logic
3. **Data Access Layer**: Drizzle ORM for database interactions
4. **Database Layer**: PostgreSQL database for data persistence

### 2.2 Technology Stack

#### 2.2.1 Frontend
- **Framework**: React 18.2.0 with TypeScript 5.0+
- **State Management**: TanStack Query (React Query) 5.0+
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Custom library built on shadcn/ui and Radix UI
- **Styling**: Tailwind CSS
- **Build System**: Vite 4.4.0
- **HTTP Client**: Native fetch API with custom wrapper

#### 2.2.2 Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express 4.18.x
- **API Design**: RESTful
- **Authentication**: Passport.js with session-based authentication
- **ORM**: Drizzle ORM
- **Validation**: Zod schemas
- **Session Storage**: PostgreSQL via connect-pg-simple

#### 2.2.3 Database
- **RDBMS**: PostgreSQL 14+
- **Schema Management**: Drizzle Kit
- **Migration Strategy**: SQL-based migrations

#### 2.2.4 Supporting Technologies
- **Version Control**: Git
- **Documentation**: Markdown
- **Testing**: Jest, React Testing Library, Cypress
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

### 2.3 System Components

#### 2.3.1 Frontend Components
- **Core Components**
  - App Container
  - Authentication Provider
  - Layout Component
  - Error Boundary
  - Toast Provider

- **UI Components**
  - Sidebar Navigation
  - Page Header
  - Form Components
  - Data Tables
  - Modal Dialogs
  - Charts and Visualizations

- **Pages**
  - Login/Authentication
  - Dashboard
  - Module-specific pages

- **Shared Logic**
  - API Client
  - Query Hooks
  - Validation Schemas
  - Authentication Context
  - Form Utilities

#### 2.3.2 Backend Components
- **API Layer**
  - Route Definitions
  - Request Handlers
  - Response Formatters
  - Error Handlers

- **Service Layer**
  - Business Logic Implementation
  - Data Transformation
  - Validation Processing

- **Data Access Layer**
  - Storage Interface
  - ORM Integration
  - Query Building
  - Transaction Management

- **Cross-Cutting Concerns**
  - Authentication & Authorization
  - Logging & Monitoring
  - Error Handling
  - Security Filters

### 2.4 Communication Patterns

#### 2.4.1 Client-Server Communication
- RESTful API with JSON payload format
- HTTP status codes for error reporting
- Authentication via session cookies
- CSRF protection for state-changing operations

#### 2.4.2 Inter-Module Communication
- Direct function calls within the same service
- Service-to-service API calls for separate services
- Event-based communication for asynchronous operations

## 3. Database Design

### 3.1 Database Schema Overview

The database is structured around core entities that represent the main components of the quality management system:

```
+---------------+       +----------------+       +----------------+
| Users/Roles   |------>| Documents      |------>| Document Revs  |
+---------------+       +----------------+       +----------------+
       |                       |
       v                       v
+---------------+       +----------------+
| Departments   |       | Approvals      |
+---------------+       +----------------+
       |
       v
+---------------+       +----------------+       +----------------+
| CAPAs         |------>| Root Causes    |------>| CAPA Actions   |
+---------------+       +----------------+       +----------------+
       |
       v
+---------------+       +----------------+       +----------------+
| Audits        |------>| Audit Checklist|------>| SCRs           |
+---------------+       +----------------+       +----------------+
       |
       v
+---------------+       +----------------+
| Suppliers     |------>| Supplier Quals |
+---------------+       +----------------+
       |
       v
+---------------+       +----------------+       +----------------+
| Design Projects|------>| Design Inputs  |------>| Design Outputs |
+---------------+       +----------------+       +----------------+
                                |
                                v
+---------------+       +----------------+
| Verifications |<------| Validations    |
+---------------+       +----------------+
       |
       v
+---------------+       +----------------+       +----------------+
| Products      |------>| Batches        |------>| Nonconformities|
+---------------+       +----------------+       +----------------+
       |
       v
+---------------+       +----------------+
| Feedback      |------>| Complaints     |
+---------------+       +----------------+
       |
       v
+---------------+       +----------------+       +----------------+
| Management    |------>| Review Inputs  |------>| Action Items   |
| Reviews       |       |                |       |                |
+---------------+       +----------------+       +----------------+
```

### 3.2 Core Tables

#### 3.2.1 User Management Tables
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User-Role mapping
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Departments table
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  manager_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.2.2 Document Control Tables
```sql
-- Documents table
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  document_number VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_type_id INTEGER NOT NULL,
  owner_id INTEGER REFERENCES users(id),
  department_id INTEGER REFERENCES departments(id),
  status_id INTEGER NOT NULL,
  effective_date TIMESTAMP,
  expiration_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document Types table
CREATE TABLE document_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document Statuses table
CREATE TABLE document_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document Revisions table
CREATE TABLE document_revisions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  revision_number VARCHAR(50) NOT NULL,
  content TEXT,
  file_path VARCHAR(255),
  file_name VARCHAR(255),
  file_size INTEGER,
  content_type VARCHAR(255),
  reason_for_change TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document Approvals table
CREATE TABLE document_approvals (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  revision_id INTEGER REFERENCES document_revisions(id) ON DELETE CASCADE,
  approver_id INTEGER REFERENCES users(id),
  approval_date TIMESTAMP,
  approval_status_id INTEGER NOT NULL,
  comments TEXT,
  signature TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.2.3 CAPA Management Tables
```sql
-- CAPA table
CREATE TABLE capas (
  id SERIAL PRIMARY KEY,
  capa_number VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  classification_id INTEGER,
  owner_id INTEGER REFERENCES users(id),
  status_id INTEGER NOT NULL,
  priority_id INTEGER,
  due_date TIMESTAMP,
  initiated_by INTEGER REFERENCES users(id),
  initiated_date TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_date TIMESTAMP,
  closed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CAPA Types table
CREATE TABLE capa_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CAPA Sources table
CREATE TABLE capa_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CAPA Statuses table
CREATE TABLE capa_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CAPA Root Causes table
CREATE TABLE capa_root_causes (
  id SERIAL PRIMARY KEY,
  capa_id INTEGER REFERENCES capas(id) ON DELETE CASCADE,
  root_cause_number VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  analysis_method TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CAPA Actions table
CREATE TABLE capa_actions (
  id SERIAL PRIMARY KEY,
  capa_id INTEGER REFERENCES capas(id) ON DELETE CASCADE,
  root_cause_id INTEGER REFERENCES capa_root_causes(id),
  action_type_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  assigned_to INTEGER REFERENCES users(id),
  due_date TIMESTAMP,
  completion_date TIMESTAMP,
  status_id INTEGER NOT NULL,
  evidence TEXT,
  verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  verification_date TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  verification_result TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.2.4 Audit Management Tables
```sql
-- Audits table
CREATE TABLE audits (
  id SERIAL PRIMARY KEY,
  audit_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type_id INTEGER NOT NULL,
  status_id INTEGER NOT NULL,
  scope TEXT,
  lead_auditor INTEGER REFERENCES users(id),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  scheduled_date TIMESTAMP,
  supplier_id INTEGER REFERENCES suppliers(id),
  department_id INTEGER REFERENCES departments(id),
  standard_reference VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit Types table
CREATE TABLE audit_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit Statuses table
CREATE TABLE audit_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit Checklist Items table
CREATE TABLE audit_checklist_items (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER REFERENCES audits(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  response_type VARCHAR(50) NOT NULL,
  regulation_clause VARCHAR(255),
  response TEXT,
  finding_type VARCHAR(50),
  evidence_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Supplier Corrective Requests (SCR) table
CREATE TABLE supplier_corrective_requests (
  id SERIAL PRIMARY KEY,
  scr_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status_id INTEGER NOT NULL,
  severity VARCHAR(50) NOT NULL,
  due_date TIMESTAMP,
  initiated_by INTEGER REFERENCES users(id),
  audit_id INTEGER REFERENCES audits(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  finding_id INTEGER REFERENCES audit_checklist_items(id),
  response_required BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_to INTEGER REFERENCES users(id),
  response_date TIMESTAMP,
  response TEXT,
  closed_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SCR Attachments table
CREATE TABLE scr_attachments (
  id SERIAL PRIMARY KEY,
  scr_id INTEGER REFERENCES supplier_corrective_requests(id) ON DELETE CASCADE,
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  content_type VARCHAR(255),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 3.2.5 Design Control Tables
```sql
-- Design Projects table
CREATE TABLE design_projects (
  id SERIAL PRIMARY KEY,
  project_number VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_manager_id INTEGER REFERENCES users(id),
  status_id INTEGER NOT NULL,
  risk_classification VARCHAR(50),
  regulatory_pathway VARCHAR(255),
  start_date TIMESTAMP,
  target_completion_date TIMESTAMP,
  actual_completion_date TIMESTAMP,
  has_software_component BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Design Inputs table
CREATE TABLE design_inputs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES design_projects(id) ON DELETE CASCADE,
  requirement_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  source VARCHAR(255),
  requirement_type_id INTEGER NOT NULL,
  acceptance_criteria TEXT,
  verification_method_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Design Outputs table
CREATE TABLE design_outputs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES design_projects(id) ON DELETE CASCADE,
  output_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  output_type_id INTEGER NOT NULL,
  document_reference VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Design Input-Output Mapping table
CREATE TABLE design_input_outputs (
  input_id INTEGER REFERENCES design_inputs(id) ON DELETE CASCADE,
  output_id INTEGER REFERENCES design_outputs(id) ON DELETE CASCADE,
  PRIMARY KEY (input_id, output_id)
);

-- Design Verifications table
CREATE TABLE design_verifications (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES design_projects(id) ON DELETE CASCADE,
  verification_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  method TEXT NOT NULL,
  output_id INTEGER REFERENCES design_outputs(id),
  acceptance_criteria TEXT,
  result TEXT,
  status_id INTEGER NOT NULL,
  performed_by INTEGER REFERENCES users(id),
  performed_date TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Design Validations table
CREATE TABLE design_validations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES design_projects(id) ON DELETE CASCADE,
  validation_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  method TEXT NOT NULL,
  user_needs_reference VARCHAR(255),
  acceptance_criteria TEXT,
  result TEXT,
  status_id INTEGER NOT NULL,
  performed_by INTEGER REFERENCES users(id),
  performed_date TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3.3 Database Relationships

The database schema implements several types of relationships:

#### 3.3.1 One-to-Many Relationships
- User to Documents (owner relationship)
- Department to Documents
- CAPA to Root Causes
- CAPA to Actions
- Audit to Checklist Items
- Supplier to SCRs
- Design Project to Design Inputs/Outputs
- Product to Batch Records
- Management Review to Inputs

#### 3.3.2 Many-to-Many Relationships
- Users to Roles (via user_roles)
- Roles to Permissions (via role_permissions)
- Design Inputs to Design Outputs (via design_input_outputs)
- Users to Training Requirements (via user_training_requirements)

#### 3.3.3 Self-Referencing Relationships
- Document revisions reference their parent document
- User references for approvals, assignments

### 3.4 Indexing Strategy

To optimize query performance, the following indexes will be implemented:

#### 3.4.1 Primary Key Indexes
All tables have primary key indexes automatically created.

#### 3.4.2 Foreign Key Indexes
Indexes are created on all foreign key columns to improve join performance.

#### 3.4.3 Search Optimization Indexes
```sql
-- Document search optimization
CREATE INDEX idx_documents_title ON documents (title);
CREATE INDEX idx_documents_document_number ON documents (document_number);
CREATE INDEX idx_documents_status_id ON documents (status_id);
CREATE INDEX idx_documents_effective_date ON documents (effective_date);

-- CAPA search optimization
CREATE INDEX idx_capas_capa_number ON capas (capa_number);
CREATE INDEX idx_capas_status_id ON capas (status_id);
CREATE INDEX idx_capas_due_date ON capas (due_date);
CREATE INDEX idx_capas_type_id ON capas (type_id);

-- Audit search optimization
CREATE INDEX idx_audits_audit_id ON audits (audit_id);
CREATE INDEX idx_audits_status_id ON audits (status_id);
CREATE INDEX idx_audits_scheduled_date ON audits (scheduled_date);
CREATE INDEX idx_audits_type_id ON audits (type_id);

-- Design project search optimization
CREATE INDEX idx_design_projects_project_number ON design_projects (project_number);
CREATE INDEX idx_design_projects_status_id ON design_projects (status_id);
CREATE INDEX idx_design_projects_name ON design_projects (name);
```

## 4. Frontend Design

### 4.1 Application Structure

The frontend application follows a modular structure organized by features:

```
/client
  /src
    /assets              # Static assets
    /components          # Reusable components
      /ui                # Base UI components
      /forms             # Form components
      /tables            # Table components
      /charts            # Chart components
      /layout            # Layout components
    /hooks               # Custom React hooks
    /lib                 # Utilities and helpers
    /pages               # Page components
      /auth              # Authentication pages
      /dashboard         # Dashboard pages
      /documents         # Document control pages
      /capa              # CAPA management pages
      /audits            # Audit management pages
      /training          # Training records pages
      /risk              # Risk assessment pages
      /suppliers         # Supplier management pages
      /design            # Design control pages
      /production        # Production management pages
      /measurement       # Measurement & analysis pages
      /management-review # Management review pages
    /contexts            # React contexts
    /types               # TypeScript type definitions
    App.tsx              # Root application component
    index.tsx            # Application entry point
    index.css            # Global styles
```

### 4.2 Component Design

#### 4.2.1 Core Components

**Layout Component**
```tsx
// Layout component wraps all pages and provides consistent structure
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};
```

**Page Header Component**
```tsx
// Consistent page header used across all pages
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => {
  return (
    <div className={cn("mb-6 gradient-header", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
```

**Form Component**
```tsx
// Form wrapper using react-hook-form
interface FormProps<T extends FieldValues> extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
}

const Form = <T extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<T>) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", className)} {...props}>
      <FormProvider {...form}>{children}</FormProvider>
    </form>
  );
};
```

### 4.3 State Management

#### 4.3.1 React Query for Server State
```tsx
// Example query hook for fetching audits
export function useAudits(filters?: AuditFilters) {
  return useQuery({
    queryKey: ['/api/audits', filters],
    queryFn: () => getQueryFn()('/api/audits', { params: filters }),
  });
}

// Example mutation hook for creating an audit
export function useCreateAudit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (audit: AuditInput) => 
      apiRequest('POST', '/api/audits', audit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audits'] });
      toast({
        title: "Audit created",
        description: "The audit has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create audit",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
```

#### 4.3.2 Local State Management
```tsx
// Example of local state management using React hooks
const AuditChecklist = ({ auditId }: { auditId: number }) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  
  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      {
        id: Date.now(),
        questionText: '',
        responseType: 'Yes/No',
        regulationClause: '',
      }
    ]);
  };
  
  const updateChecklistItem = (id: number, field: string, value: string) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  const removeChecklistItem = (id: number) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };
  
  // Rest of component...
};
```

### 4.4 Routing

The application uses Wouter for client-side routing:

```tsx
// App.tsx
function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Document Control */}
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/documents/create" component={DocumentCreatePage} />
      <ProtectedRoute path="/documents/:id" component={DocumentDetailPage} />
      
      {/* CAPA Management */}
      <ProtectedRoute path="/capas" component={CapasPage} />
      <ProtectedRoute path="/capas/create" component={CapaCreatePage} />
      <ProtectedRoute path="/capas/:id" component={CapaDetailPage} />
      
      {/* Audit Management */}
      <ProtectedRoute path="/audits" component={AuditManagementPage} />
      <ProtectedRoute path="/audits/create" component={AuditCreatePage} />
      <ProtectedRoute path="/audits/:id" component={AuditDetailPage} />
      <ProtectedRoute path="/audits/:id/checklist/create" component={AuditChecklistCreatePage} />
      <ProtectedRoute path="/scr/create" component={ScrCreatePage} />
      
      {/* Design Control */}
      <ProtectedRoute path="/design" component={DesignProjectsPage} />
      <ProtectedRoute path="/design/create" component={DesignProjectCreatePage} />
      <ProtectedRoute path="/design/:id" component={DesignProjectDetailPage} />
      
      {/* Additional routes... */}
      
      <Route component={NotFound} />
    </Switch>
  );
}
```

## 5. Backend Design

### 5.1 API Structure

The backend implements a RESTful API organized by domain:

```
/server
  /routes.ts           # Route registration
  /storage.ts          # Storage interface
  /auth.ts             # Authentication setup
  /db.ts               # Database connection
```

### 5.2 Route Definitions

#### 5.2.1 Authentication Routes
```typescript
// Authentication routes
app.post("/api/register", async (req, res, next) => {
  const existingUser = await storage.getUserByUsername(req.body.username);
  if (existingUser) {
    return res.status(400).send("Username already exists");
  }

  const user = await storage.createUser({
    ...req.body,
    password: await hashPassword(req.body.password),
  });

  req.login(user, (err) => {
    if (err) return next(err);
    res.status(201).json(user);
  });
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(req.user);
});
```

#### 5.2.2 Audit Management Routes
```typescript
// Audit routes
app.get("/api/audits", isAuthenticated, async (req, res) => {
  try {
    const audits = await storage.getAudits();
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/audits", isAuthenticated, async (req, res) => {
  try {
    const auditData = req.body;
    const audit = await storage.createAudit(auditData);
    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/audits/:id", isAuthenticated, async (req, res) => {
  try {
    const audit = await storage.getAudit(parseInt(req.params.id));
    if (!audit) return res.status(404).json({ error: "Audit not found" });
    res.json(audit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/audits/:id/checklist-items/batch", isAuthenticated, async (req, res) => {
  try {
    const auditId = parseInt(req.params.id);
    const items = req.body.items;
    
    const result = await storage.createChecklistItemsBatch(auditId, items);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/scr", isAuthenticated, async (req, res) => {
  try {
    const scrData = req.body;
    const scr = await storage.createSCR(scrData);
    res.status(201).json(scr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5.3 Storage Interface

The storage interface provides a consistent way to interact with the data store:

```typescript
// Storage interface for Audit Management
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Audit methods
  getAudits(): Promise<Audit[]>;
  getAuditsByStatus(statusId: number): Promise<Audit[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined>;
  createChecklistItem(auditId: number, item: InsertChecklistItem): Promise<ChecklistItem>;
  createChecklistItemsBatch(auditId: number, items: InsertChecklistItem[]): Promise<ChecklistItem[]>;
  getChecklistItems(auditId: number): Promise<ChecklistItem[]>;
  
  // SCR methods
  createSCR(scr: InsertSCR): Promise<SCR>;
  getSCR(id: number): Promise<SCR | undefined>;
  getSCRsByAudit(auditId: number): Promise<SCR[]>;
  getSCRsBySupplier(supplierId: number): Promise<SCR[]>;
  updateSCR(id: number, scr: Partial<InsertSCR>): Promise<SCR | undefined>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}
```

### 5.4 Database Implementation

The storage interface is implemented using Drizzle ORM:

```typescript
export class DatabaseStorage implements IStorage {
  async getAudits(): Promise<Audit[]> {
    try {
      return await db.select().from(audits).orderBy(desc(audits.createdAt));
    } catch (error) {
      console.error("Error fetching audits:", error);
      throw new Error(`Failed to fetch audits: ${error.message}`);
    }
  }

  async getAuditsByStatus(statusId: number): Promise<Audit[]> {
    try {
      return await db
        .select()
        .from(audits)
        .where(eq(audits.statusId, statusId))
        .orderBy(desc(audits.createdAt));
    } catch (error) {
      console.error(`Error fetching audits by status ${statusId}:`, error);
      throw new Error(`Failed to fetch audits by status: ${error.message}`);
    }
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    try {
      const [audit] = await db
        .select()
        .from(audits)
        .where(eq(audits.id, id));
      return audit;
    } catch (error) {
      console.error(`Error fetching audit ${id}:`, error);
      throw new Error(`Failed to fetch audit: ${error.message}`);
    }
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    try {
      const [result] = await db.insert(audits).values(audit).returning();
      return result;
    } catch (error) {
      console.error("Error creating audit:", error);
      throw new Error(`Failed to create audit: ${error.message}`);
    }
  }

  async createChecklistItemsBatch(auditId: number, items: InsertChecklistItem[]): Promise<ChecklistItem[]> {
    try {
      const itemsWithAuditId = items.map(item => ({
        ...item,
        auditId
      }));
      
      return await db.insert(auditChecklistItems).values(itemsWithAuditId).returning();
    } catch (error) {
      console.error(`Error creating checklist items batch for audit ${auditId}:`, error);
      throw new Error(`Failed to create checklist items: ${error.message}`);
    }
  }

  async createSCR(scr: InsertSCR): Promise<SCR> {
    try {
      // Handle date conversions
      const preparedScr = {
        ...scr,
        dueDate: new Date(scr.dueDate),
        responseDate: scr.responseDate ? new Date(scr.responseDate) : null,
        closedDate: scr.closedDate ? new Date(scr.closedDate) : null,
      };
      
      const [result] = await db.insert(supplierCorrectiveRequests).values(preparedScr).returning();
      return result;
    } catch (error) {
      console.error("Error creating SCR:", error);
      throw new Error(`Failed to create SCR: ${error.message}`);
    }
  }
}
```

## 6. Security Design

### 6.1 Authentication & Authorization

#### 6.1.1 Authentication Implementation
```typescript
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Session setup
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize/deserialize user
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
```

#### 6.1.2 Authorization Middleware
```typescript
// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Role-based authorization middleware
export function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userRoles = req.user.roles || [];
    const hasRequiredRole = userRoles.some(role => roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    next();
  };
}

// Resource authorization middleware
export function canAccess(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const hasPermission = await storage.checkUserPermission(userId, resource, action);
      
      if (!hasPermission) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
```

### 6.2 Input Validation

Input validation is implemented using Zod schemas:

```typescript
// Audit validation schema
export const insertAuditSchema = createInsertSchema(audits)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    title: z.string().min(3).max(255),
    description: z.string().optional().nullable(),
    typeId: z.number().int().positive(),
    statusId: z.number().int().positive(),
    scope: z.string().min(3),
    leadAuditor: z.number().int().positive(),
    startDate: z.date().optional().nullable(),
    endDate: z.date().optional().nullable(),
    scheduledDate: z.date().optional().nullable(),
    supplierId: z.number().int().positive().optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    standardReference: z.string().optional().nullable(),
  });

// SCR validation schema
export const insertSCRSchema = createInsertSchema(supplierCorrectiveRequests)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    title: z.string().min(3).max(255),
    description: z.string().min(3),
    statusId: z.number().int().positive(),
    severity: z.string(),
    dueDate: z.date(),
    initiatedBy: z.number().int().positive(),
    auditId: z.number().int().positive().optional().nullable(),
    supplierId: z.number().int().positive().optional().nullable(),
    findingId: z.number().int().positive().optional().nullable(),
    responseRequired: z.boolean().optional(),
    assignedTo: z.number().int().positive().optional(),
    responseDate: z.date().optional().nullable(),
    response: z.string().optional().nullable(),
    closedDate: z.date().optional().nullable(),
  });

// Validation middleware
export function validateRequest(schema: ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };
}

// Usage in routes
app.post(
  "/api/audits",
  isAuthenticated,
  validateRequest(insertAuditSchema),
  async (req, res) => {
    try {
      const auditData = req.body;
      const audit = await storage.createAudit(auditData);
      res.status(201).json(audit);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### 6.3 CSRF Protection

```typescript
import csrf from "csurf";

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Apply to all state-changing routes
app.post("/api/audits", csrfProtection, isAuthenticated, async (req, res) => {
  // ...
});

app.patch("/api/audits/:id", csrfProtection, isAuthenticated, async (req, res) => {
  // ...
});

app.delete("/api/audits/:id", csrfProtection, isAuthenticated, async (req, res) => {
  // ...
});

// Provide CSRF token to frontend
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 6.4 Audit Trail Implementation

```typescript
// Audit trail middleware
export function auditTrail(action: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function (body) {
      const userId = req.user?.id;
      const resourceId = req.params.id || null;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];
      const requestBody = req.method !== "GET" ? req.body : null;
      
      // Create audit trail entry after response is sent
      res.on("finish", async () => {
        try {
          await storage.createAuditTrail({
            userId,
            action,
            resourceType,
            resourceId,
            ipAddress,
            userAgent,
            requestData: requestBody ? JSON.stringify(requestBody) : null,
            responseStatus: res.statusCode,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error("Failed to create audit trail:", error);
        }
      });
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}

// Usage in routes
app.post(
  "/api/audits",
  isAuthenticated,
  validateRequest(insertAuditSchema),
  auditTrail("create", "audit"),
  async (req, res) => {
    // ...
  }
);
```

## 7. Integration & Deployment

### 7.1 Continuous Integration and Deployment

The application will be deployed using a CI/CD pipeline built with GitHub Actions:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Test
        run: npm test
      
      - name: Build
        run: npm run build
  
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy application
        run: |
          # AWS deployment steps
          # - Upload build artifacts
          # - Update ECS service
          # - Perform database migrations
```

### 7.2 Containerization

The application is containerized using Docker:

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 5000

USER node

CMD ["node", "dist/server/index.js"]
```

### 7.3 Environment Configuration

```typescript
// config.ts
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Environment variables with validation
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL,
  
  // Authentication configuration
  sessionSecret: process.env.SESSION_SECRET || "development-secret",
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || "*",
  
  // File storage configuration
  fileStoragePath: process.env.FILE_STORAGE_PATH || "./uploads",
  
  // Validate required environment variables
  validate: () => {
    const required = ["DATABASE_URL", "SESSION_SECRET"];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    
    return true;
  }
};

// Validate on import
config.validate();
```

## 8. Testing Strategy

### 8.1 Unit Testing

```typescript
// Example unit test for authentication utils
import { hashPassword, comparePasswords } from "../auth-utils";

describe("Authentication Utilities", () => {
  test("should hash password", async () => {
    const password = process.env.TEST_PASSWORD || "<PASSWORD_PLACEHOLDER>";
    const hashed = await hashPassword(password);
    
    expect(hashed).toBeDefined();
    expect(hashed.split(".").length).toBe(2);
  });
  
  test("should verify correct password", async () => {
    const password = process.env.TEST_PASSWORD || "<PASSWORD_PLACEHOLDER>";
    const hashed = await hashPassword(password);
    
    const result = await comparePasswords(password, hashed);
    expect(result).toBe(true);
  });
  
  test("should reject incorrect password", async () => {
    const password = process.env.TEST_PASSWORD || "<PASSWORD_PLACEHOLDER>";
    const wrongPassword = process.env.WRONG_TEST_PASSWORD || "<INCORRECT_PASSWORD_PLACEHOLDER>";
    const hashed = await hashPassword(password);
    
    const result = await comparePasswords(wrongPassword, hashed);
    expect(result).toBe(false);
  });
});
```

### 8.2 Integration Testing

```typescript
// Example integration test for audit API
import request from "supertest";
import { app } from "../app";
import { createTestUser, authenticateTestUser } from "./test-utils";

describe("Audit API", () => {
  let authToken;
  let testUserId;
  
  beforeAll(async () => {
    testUserId = await createTestUser("audituser", "password123");
    authToken = await authenticateTestUser("audituser", "password123");
  });
  
  test("should create an audit", async () => {
    const auditData = {
      title: "Test Audit",
      description: "Test Description",
      typeId: 1,
      statusId: 1,
      scope: "Test Scope",
      leadAuditor: testUserId,
      scheduledDate: new Date().toISOString(),
    };
    
    const response = await request(app)
      .post("/api/audits")
      .set("Authorization", `Bearer ${authToken}`)
      .send(auditData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(auditData.title);
  });
  
  test("should get audits", async () => {
    const response = await request(app)
      .get("/api/audits")
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### 8.3 End-to-End Testing

```typescript
// Example Cypress E2E test for audit creation
describe("Audit Management", () => {
  beforeEach(() => {
    cy.login("admin", "admin123");
    cy.visit("/audits");
  });
  
  it("should create a new audit", () => {
    // Click the new audit button
    cy.findByRole("button", { name: /new audit/i }).click();
    
    // Fill in the form
    cy.findByLabelText(/title/i).type("Cypress Test Audit");
    cy.findByLabelText(/description/i).type("Audit created via Cypress test");
    cy.findByLabelText(/audit type/i).select("Internal");
    cy.findByLabelText(/status/i).select("Planning");
    cy.findByLabelText(/scope/i).type("Testing the audit creation functionality");
    cy.findByLabelText(/department/i).select("Quality Assurance");
    cy.findByLabelText(/scheduled date/i).type("2025-06-01");
    
    // Submit the form
    cy.findByRole("button", { name: /create audit/i }).click();
    
    // Verify success
    cy.findByText(/audit created successfully/i).should("be.visible");
    
    // Verify the new audit appears in the list
    cy.visit("/audits");
    cy.findByText("Cypress Test Audit").should("be.visible");
  });
});
```

## 9. Documentation

### 9.1 API Documentation

The API is documented using Swagger/OpenAPI:

```typescript
// swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Medical Device eQMS API",
      version: "1.0.0",
      description: "API documentation for the Medical Device eQMS",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./server/routes/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
```

## 10. Maintenance and Support

### 10.1 Logging Strategy

```typescript
// logger.ts
import winston from "winston";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "eqms-api" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Create middleware for HTTP request logging
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });
  
  next();
};
```

### 10.2 Error Handling Strategy

```typescript
// error-handler.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { PostgresError } from "@neondatabase/serverless";

// Custom error classes
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends ApiError {
  errors: unknown;
  
  constructor(message = "Validation Error", errors?: unknown) {
    super(400, message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logger.error({
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Handle different error types
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err instanceof ValidationError && err.errors
        ? { details: err.errors }
        : {}),
    });
  }
  
  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    return res.status(400).json({
      error: "Validation Error",
      details: validationError.details,
    });
  }
  
  if (err instanceof PostgresError) {
    // Handle database errors
    if (err.code === "23505") {
      // Unique constraint violation
      return res.status(409).json({
        error: "Conflict Error",
        message: "A resource with the same unique identifier already exists",
      });
    }
    
    if (err.code === "23503") {
      // Foreign key constraint violation
      return res.status(400).json({
        error: "Foreign Key Constraint Error",
        message: "Referenced resource does not exist",
      });
    }
  }
  
  // Handle unexpected errors
  console.error(err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message,
  });
}
```

## 11. Performance Considerations

### 11.1 Database Query Optimization

```typescript
// Optimized query for fetching audits with related data
async getAuditsWithDetails(): Promise<AuditWithDetails[]> {
  try {
    return await db
      .select({
        id: audits.id,
        auditId: audits.auditId,
        title: audits.title,
        description: audits.description,
        typeId: audits.typeId,
        typeName: auditTypes.name,
        statusId: audits.statusId,
        statusName: auditStatuses.name,
        scope: audits.scope,
        leadAuditor: audits.leadAuditor,
        leadAuditorName: sql<string>`concat(users.first_name, ' ', users.last_name)`,
        startDate: audits.startDate,
        endDate: audits.endDate,
        scheduledDate: audits.scheduledDate,
        supplierId: audits.supplierId,
        supplierName: suppliers.name,
        departmentId: audits.departmentId,
        departmentName: departments.name,
        standardReference: audits.standardReference,
        createdAt: audits.createdAt,
        updatedAt: audits.updatedAt,
        checklistItemCount: sql<number>`(
          SELECT COUNT(*) FROM audit_checklist_items
          WHERE audit_checklist_items.audit_id = audits.id
        )`,
        scrCount: sql<number>`(
          SELECT COUNT(*) FROM supplier_corrective_requests
          WHERE supplier_corrective_requests.audit_id = audits.id
        )`
      })
      .from(audits)
      .leftJoin(auditTypes, eq(audits.typeId, auditTypes.id))
      .leftJoin(auditStatuses, eq(audits.statusId, auditStatuses.id))
      .leftJoin(users, eq(audits.leadAuditor, users.id))
      .leftJoin(suppliers, eq(audits.supplierId, suppliers.id))
      .leftJoin(departments, eq(audits.departmentId, departments.id))
      .orderBy(desc(audits.createdAt));
  } catch (error) {
    console.error("Error fetching audits with details:", error);
    throw new Error(`Failed to fetch audits with details: ${error.message}`);
  }
}
```

### 11.2 Caching Strategy

```typescript
// Cache middleware using memory-cache
import mcache from "memory-cache";

export function cache(duration: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for authenticated routes or non-GET requests
    if (!req.isAuthenticated() || req.method !== "GET") {
      return next();
    }
    
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = mcache.get(key);
    
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    
    const originalSend = res.send;
    res.send = function(body) {
      mcache.put(key, body, duration * 1000);
      originalSend.call(this, body);
    };
    
    next();
  };
}

// Usage in routes
app.get("/api/audits", isAuthenticated, cache(60), async (req, res) => {
  // Handle request
});
```

## 12. Quality Assurance

### 12.1 Code Quality Tools

```json
// .eslintrc.json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "@typescript-eslint",
    "react-hooks"
  ],
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 12.2 Code Reviews Checklist

1. **Functionality**
   - Does the code implement the specified requirements?
   - Does it handle edge cases appropriately?
   - Are there any potential bugs or issues?

2. **Code Quality**
   - Is the code clean, maintainable, and well-structured?
   - Does it follow established patterns and practices?
   - Are there any code smells or anti-patterns?

3. **Security**
   - Are there any security vulnerabilities?
   - Is sensitive data handled properly?
   - Is input validation implemented correctly?

4. **Performance**
   - Are there any performance concerns?
   - Are database queries optimized?
   - Is caching implemented where appropriate?

5. **Testing**
   - Are there appropriate unit tests?
   - Is there sufficient test coverage?
   - Do all tests pass?

6. **Documentation**
   - Is the code well-commented?
   - Are there up-to-date API docs?
   - Are functions and components well-documented?

7. **Compliance**
   - Does the code meet regulatory requirements?
   - Are validation steps implemented correctly?
   - Is proper audit trail maintained?

## 13. Conclusion

This Detailed Design Specification provides a comprehensive technical blueprint for the Medical Device eQMS system. It details the architecture, database schema, API design, security measures, and other technical aspects necessary for implementation. This document should be used as the primary reference for developers building the system and should be updated as the system evolves.

## Appendices

### Appendix A: Reference Architecture Diagram

[Include detailed architecture diagram here]

### Appendix B: Database Schema Diagram

[Include detailed database schema diagram here]

### Appendix C: API Endpoints Reference

[Include comprehensive API documentation here]

## Revision History

| Version | Date | Author | Description of Changes |
|---------|------|--------|------------------------|
| 1.0 | 2025-05-15 | System Architect | Initial creation |

## Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Architect | | | |
| Software Engineering Manager | | | |
| Quality Manager | | | |
| Project Manager | | | |

---

**Document End**
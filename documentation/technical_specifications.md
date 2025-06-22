# Medical Device eQMS: Technical Specifications

## System Architecture

### Overview
The Medical Device eQMS is a modern web application built using a modular, scalable architecture with strict separation of concerns. It follows a client-server model with a React-based frontend and a Node.js/Express backend, connected to a PostgreSQL database.

## Frontend Specifications

### Technology Stack
- **Framework**: React 18.2.0 with TypeScript 5.0+
- **Build Tool**: Vite 4.4.0 for fast development and optimized production builds
- **State Management**: TanStack Query (React Query) 5.0+ for server state, local state with hooks
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation schemas
- **UI Components**: Custom component library built on shadcn/ui and Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Icons**: Lucide React for consistent iconography
- **Charts/Visualization**: Recharts for data visualization
- **Date Handling**: date-fns for consistent date operations
- **PDF Generation**: jsPDF with html2canvas for report generation

### Component Structure
- **Layout Components**: 
  - Layout (main application shell)
  - Sidebar (navigation)
  - PageHeader (standardized page headers)
  - Card variants (for content grouping)
  - Modal dialogs

- **Form Components**:
  - Form (wrapper around React Hook Form)
  - FormField, FormItem, FormControl (field abstractions)
  - Input, Textarea, Select, DatePicker
  - MultiSelect, FileUpload

- **Table Components**:
  - DataTable (sortable, filterable table)
  - TableRow, TableCell
  - TablePagination

- **Chart Components**:
  - BarChart, LineChart, PieChart
  - KPICard (key performance indicators)
  - Gauge (for metrics)

- **Utility Components**:
  - Toast (notifications)
  - Tooltip
  - Dropdown
  - Button (with variants)
  - Tabs

### Performance Optimizations
- Code splitting with dynamic imports for route-based chunks
- Memoization of expensive components with React.memo
- Virtualized lists for long data sets
- Query caching with React Query
- Lazy loading of images and non-critical components
- Prefetching data for anticipated user paths

### Accessibility Features
- ARIA attributes throughout the component library
- Keyboard navigation support
- Focus management for modals and dialogs
- High contrast mode
- Screen reader optimizations
- Responsive design for multiple device types

## Backend Specifications

### Technology Stack
- **Runtime**: Node.js 20.x
- **Framework**: Express 4.18.x
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy
- **Session Management**: express-session with PostgreSQL store
- **Validation**: Zod for schema validation
- **API Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston for structured logging
- **Security**: Helmet.js for HTTP security headers

### API Structure
- RESTful API design principles
- Versioned endpoints (currently v1)
- JSON response format
- Standard HTTP status codes
- Consistent error format

### Authentication & Authorization
- Session-based authentication
- Role-based access control (RBAC)
- Permission-based actions
- Audit logging of authentication events
- Password hashing with scrypt
- CSRF protection

### Database Design
- PostgreSQL 14+
- Normalized schema design
- Foreign key constraints for referential integrity
- Indexes on frequently queried columns
- Transactions for data integrity
- Soft delete pattern for data retention

### Error Handling
- Standardized error responses
- Detailed logging for debugging
- Graceful failure handling
- Rate limiting for API protection
- Request timeout handling

## Database Schema

### Core Tables
- users
- roles
- permissions
- departments
- documents
- document_revisions
- document_approvals
- capas
- capa_root_causes
- capa_actions
- audits
- audit_checklist_items
- suppliers
- supplier_corrective_requests
- training_records
- training_requirements
- risk_assessments
- risk_items
- design_projects
- design_inputs
- design_outputs
- design_verifications
- design_validations
- products
- production_batches
- nonconforming_products
- customer_feedback
- complaints
- management_reviews
- management_review_inputs
- management_review_action_items

### Key Relationships
- One-to-many: users to documents, capas to actions
- Many-to-many: users to roles, documents to approvers
- Self-referencing: document revisions, organizational hierarchy
- Polymorphic: attachments, comments, audit trail

## Security Features

### Data Protection
- All sensitive data encrypted at rest
- TLS/SSL for data in transit
- Environment variable-based configuration
- No hardcoded credentials
- Secrets management

### Authentication Security
- Password strength enforcement
- Account lockout after failed attempts
- Session timeout and renewal
- JWT token rotation
- Secure cookie configuration

### Input Validation
- All input validated through Zod schemas
- SQL injection prevention via ORM
- XSS protection with content security policy
- CSRF token verification

### Audit & Compliance
- Comprehensive audit logging
- Timestamped user actions
- Electronic signatures (21 CFR Part 11 compliant)
- Data integrity checks
- Regulatory-compliant record retention

## API Endpoints Overview

### Authentication
- POST /api/login
- POST /api/logout
- GET /api/user

### Document Control
- GET /api/documents
- POST /api/documents
- GET /api/documents/:id
- PATCH /api/documents/:id
- POST /api/documents/:id/revisions
- GET /api/documents/:id/approvals
- POST /api/documents/:id/approvals

### CAPA Management
- GET /api/capas
- POST /api/capas
- GET /api/capas/:id
- PATCH /api/capas/:id
- POST /api/capas/:id/root-causes
- POST /api/capas/:id/actions
- PATCH /api/capas/:id/effectiveness
- PATCH /api/capas/:id/close

### Audit Management
- GET /api/audits
- POST /api/audits
- GET /api/audits/:id
- PATCH /api/audits/:id
- GET /api/audits/:id/checklist
- POST /api/audits/:id/checklist-items/batch
- POST /api/scr
- GET /api/scr/:id

### Training Records
- GET /api/training-records
- POST /api/training-assignments
- PATCH /api/training-records/:id/complete
- GET /api/training-requirements

### Supplier Management
- GET /api/suppliers
- POST /api/suppliers
- GET /api/suppliers/:id
- PATCH /api/suppliers/:id
- GET /api/critical-suppliers

### Design Control
- GET /api/design-projects
- POST /api/design-projects
- GET /api/design-projects/:id
- GET /api/design-projects/:id/matrix
- POST /api/design-projects/:id/inputs
- POST /api/design-projects/:id/outputs
- POST /api/design-projects/:id/verifications

### Production
- GET /api/products
- POST /api/products
- GET /api/production/batches
- POST /api/production/batches
- POST /api/production/nonconforming

### Measurement & Analysis
- GET /api/feedback
- POST /api/feedback
- GET /api/complaints
- POST /api/complaints
- PATCH /api/complaints/:id

### Management Review
- GET /api/management-reviews
- POST /api/management-reviews
- GET /api/management-reviews/:id/inputs
- POST /api/management-reviews/:id/inputs
- POST /api/management-reviews/:id/action-items

## Performance Specifications

### Response Time Targets
- API response: < 200ms for 95% of requests
- Page load: < 1.5s for initial load, < 300ms for subsequent navigation
- Database queries: < 100ms for 99% of queries

### Scalability
- Designed to handle up to 200 concurrent users
- Database optimized for up to 1 million records per main table
- Document storage designed for up to 500GB of documents

### Availability
- 99.9% uptime target (excluding scheduled maintenance)
- Graceful degradation during partial outages
- Automatic retry mechanisms for transient failures

## Compliance & Validation

### Regulatory Compliance
- ISO 13485:2016 compliant processes
- FDA 21 CFR Part 11 electronic records and signatures
- FDA 21 CFR Part 820 quality system requirements
- EU MDR 2017/745 documentation requirements
- GDPR data protection measures

### Validation Documentation
- Requirements traceability matrix
- Test protocols and results
- Installation qualification (IQ)
- Operational qualification (OQ)
- Performance qualification (PQ)

### Audit Support
- Predefined audit reports
- Regulatory submission exports
- Compliance dashboards

## Integration Capabilities

### External Systems
- REST API for third-party integration
- Webhook support for event-driven integration
- Import/export functionality for bulk data
- Single Sign-On (SSO) readiness

### File Formats
- Document import: PDF, DOCX, XLSX, CSV, JPG, PNG
- Data export: CSV, XLSX, JSON, PDF
- Report generation: PDF, HTML

## Development & Deployment

### Development Environment
- Docker containers for consistent development
- ESLint and Prettier for code quality
- Jest and React Testing Library for unit tests
- Cypress for end-to-end testing
- TypeScript for type safety

### CI/CD Pipeline
- GitHub Actions for continuous integration
- Automated tests on pull requests
- Semantic versioning
- Containerized deployment
- Blue/green deployment capability

### Deployment Options
- Cloud-native architecture (AWS preferred)
- On-premises deployment support
- High-availability configuration option
- Disaster recovery procedures
- Automated backup and restore

## Future Expansion

### Planned Features
- Mobile application for audit and inspection activities
- Machine learning for predictive quality metrics
- Advanced document comparison tools
- Integration with equipment and IoT devices
- Advanced reporting and business intelligence

### Extensibility
- Plugin architecture for custom modules
- API versioning strategy
- Database migration framework
- Feature flag system
- Client-specific customization capability

---

This technical specification document outlines the comprehensive architecture and implementation details of the Medical Device eQMS system, providing a clear reference for developers, system administrators, and IT personnel involved in maintaining and extending the platform.
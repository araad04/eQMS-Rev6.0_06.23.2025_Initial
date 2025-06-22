# Medical Device eQMS: Detailed Design Specification (DDS) Summary

**Document Number:** DDS-MD-eQMS-001  
**Version:** 1.0  
**Date:** May 15, 2025  

## 1. Introduction

### 1.1 Purpose
This Detailed Design Specification (DDS) provides a comprehensive description of the architecture, design patterns, database schema, and system interfaces for the Medical Device electronic Quality Management System (eQMS). It serves as a blueprint for system implementation and ongoing maintenance.

### 1.2 Scope
Covers the detailed technical design for all modules of the eQMS, including authentication, document control, CAPA management, audit management, training records, risk assessment, supplier management, design control, production, measurement & analysis, and management review.

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

### 2.3 System Components

#### 2.3.1 Frontend Components
- **Core Components**: App Container, Authentication Provider, Layout Component, Error Boundary
- **UI Components**: Navigation, Forms, Data Tables, Modals, Charts
- **Pages**: Login, Dashboard, Module-specific pages
- **Shared Logic**: API Client, Query Hooks, Validation, Authentication Context

#### 2.3.2 Backend Components
- **API Layer**: Routes, Request Handlers, Response Formatters, Error Handlers
- **Service Layer**: Business Logic, Data Transformation, Validation
- **Data Access Layer**: Storage Interface, ORM Integration, Query Building
- **Cross-Cutting Concerns**: Authentication, Logging, Error Handling, Security Filters

## 3. Database Design

### 3.1 Database Schema Overview
The database is structured around core entities representing the main QMS components:
- Users/Roles/Permissions
- Documents and Document Control
- CAPA Management
- Audit Management
- Supplier Management
- Design Control
- Production Control
- Management Reviews

### 3.2 Core Tables
The DDS includes detailed SQL definitions for all database tables, including:
- User Management Tables
- Document Control Tables
- CAPA Management Tables
- Audit Management Tables
- Design Control Tables
- Production Control Tables
- Supplier Management Tables
- Risk Management Tables
- Management Review Tables

## 4. API Design

### 4.1 RESTful API Structure
- Resource-based URL structure
- HTTP methods for CRUD operations
- JSON response format
- Proper status code usage
- Authentication/authorization headers

### 4.2 API Endpoints
Comprehensive API endpoints for all modules, including:
- User Management
- Document Control
- CAPA Management
- Audit Management
- Supplier Management
- Design Control
- Training Records
- Management Review

## 5. Storage Interface

### 5.1 Interface Definition
The system implements the `IStorage` interface for database operations:
```typescript
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // CAPA methods
  getCapas(): Promise<Capa[]>;
  getCapa(id: number): Promise<Capa | undefined>;
  createCapa(capa: InsertCapa): Promise<Capa>;
  
  // And many more module-specific methods...
}
```

### 5.2 Database Implementation
The storage interface is implemented using Drizzle ORM with comprehensive error handling and transaction support.

## 6. Security Design

### 6.1 Authentication & Authorization
- Session-based authentication using Passport.js
- Password hashing using scrypt with salt
- Timing-safe password comparison
- Role-based authorization middleware
- HTTP-only secure cookies

### 6.2 Data Protection
- Input validation with Zod schemas
- CSRF protection
- SQL injection prevention
- XSS prevention
- Data encryption

### 6.3 Audit Trails
- Comprehensive change tracking
- User action logging
- Electronic signature verification

## 7. 21 CFR Part 11 Compliance

### 7.1 Electronic Signatures
- Username/password authentication
- Signature meaning capture
- Date/time/user tracking
- Non-repudiation features

### 7.2 Electronic Records
- Data integrity safeguards
- Audit trail generation
- Record retention policies

## 8. Testing Strategy

### 8.1 Unit Testing
- Component-level tests with Jest
- Business logic validation
- Edge case handling

### 8.2 Integration Testing
- API endpoint validation
- Module interaction testing
- Database transaction testing

### 8.3 System Testing
- End-to-end workflow testing
- Performance testing
- Security testing

## 9. Deployment Strategy

### 9.1 Environment Configuration
- Development, Testing, Staging, Production environments
- Environment-specific configuration
- Secret management

### 9.2 CI/CD Pipeline
- Automated testing
- Code quality checks
- Deployment automation

## 10. Maintenance and Support

### 10.1 Monitoring
- System health checks
- Performance metrics
- Error tracking

### 10.2 Backup and Recovery
- Database backup procedures
- Disaster recovery planning
- Data archiving strategy
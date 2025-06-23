# eQMS 6.0 - Electronic Quality Management System

A comprehensive medical device Quality Management System built with modern web technologies and designed for regulatory compliance with ISO 13485:2016, 21 CFR Part 11, and IEC 62304.

## Overview

The eQMS provides end-to-end quality management for medical device manufacturers, featuring document control, CAPA management, audit tracking, supplier management, training records, and compliance reporting with enterprise-grade phase-gated design control workflows.

## Key Features

### Core QMS Modules
- **Document Control** - ISO 13485 compliant document lifecycle management
- **CAPA Management** - Corrective and Preventive Action workflows with root cause analysis
- **Design Control** - Phase-gated design development with sequential workflow enforcement
- **Audit Management** - Internal and external audit execution with automated checklists
- **Training Management** - Competency tracking with validity periods and automatic renewals
- **Supplier Management** - Risk-based supplier qualification and performance monitoring
- **Management Review** - Automated review processes with intelligent action generation
- **Complaint Handling** - Customer feedback and complaint tracking with regulatory reporting

### Advanced Features
- **Unified Ribbon Navigation** - Consistent enterprise-grade UI across all modules
- **Dynamic Traceability Matrix** - Automated requirement linking from user needs to validation
- **KPI Analytics Dashboard** - Real-time performance metrics and compliance monitoring
- **Electronic Signatures** - 21 CFR Part 11 compliant digital signatures
- **Comprehensive Audit Trails** - Complete tamper-evident change tracking
- **Role-Based Access Control** - Multi-level permissions (admin, manager, qa, viewer)

## Technology Stack

- **Frontend**: React 18.3.1, TypeScript, Vite, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express.js, Drizzle ORM
- **Database**: PostgreSQL with comprehensive audit trail schema
- **Authentication**: Session-based with Passport.js and JWT tokens
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **File Management**: Multer with secure local storage

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/biomedical78/eQMS6.0_06.23.2025-.git
   cd eQMS6.0_06.23.2025-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Open http://localhost:5000 in your browser
   - Default development user: Biomedical78

### Production Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

## Project Structure

```
eQMS6.0_06.23.2025-/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages and modules
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions and configurations
├── server/                 # Express.js backend
│   ├── routes/             # API route handlers
│   ├── auth.ts             # Authentication middleware
│   └── storage.ts          # Database abstraction layer
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
├── public/                 # Static assets
└── docs/                   # Documentation
```

## Core Modules

### Design Control
- Phase-gated workflow management (Planning → Inputs → Outputs → Verification → Validation → Transfer)
- Sequential enforcement with mandatory gate reviews
- Comprehensive traceability matrix from user requirements to validation
- ISO 13485:7.3 compliant design history file generation

### Document Control
- Version control with approval workflows
- Electronic signatures and audit trails
- ISO 13485 compliant document lifecycle
- Automated notifications and review scheduling

### CAPA Management
- Root cause analysis workflows
- Effectiveness review tracking
- Integration with audit findings
- Risk-based prioritization

### Audit Management
- Internal and external audit planning
- Automated checklist generation
- Finding tracking and CAPA integration
- Comprehensive reporting capabilities

## Regulatory Compliance

- **ISO 13485:2016** - Medical device quality management systems
- **21 CFR Part 11** - Electronic records and signatures
- **IEC 62304** - Medical device software lifecycle processes
- **EU MDR** - European Medical Device Regulation compliance features

## Security Features

- Role-based access control with granular permissions
- Session-based authentication with secure token management
- Input sanitization and XSS prevention
- SQL injection protection through parameterized queries
- Rate limiting to prevent API abuse
- Comprehensive audit trails for all operations

## API Documentation

The application includes built-in API documentation accessible at `/api/docs` when running in development mode.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run db:push` - Apply database schema changes
- `npm test` - Run test suite
- `npm run lint` - Run code linting

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/eqms

# Authentication
SESSION_SECRET=your-secure-session-secret

# Application
NODE_ENV=production
PORT=5000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is proprietary software developed for medical device quality management.

## Support

For technical support or questions about deployment:
- Review the documentation in the `docs/` directory
- Check the `replit.md` file for detailed project context
- Refer to the GitHub Transfer Guide for deployment instructions

---

**Version**: 6.0 Production Ready  
**Compliance**: ISO 13485:2016, 21 CFR Part 11, IEC 62304  
**Status**: Production Ready with Enterprise-Grade Validation
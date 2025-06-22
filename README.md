# eQMS - Electronic Quality Management System

A comprehensive medical device Quality Management System built with modern web technologies and designed for regulatory compliance with ISO 13485:2016 and 21 CFR Part 11.

## 🏗️ Architecture

- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js with Express.js, JWT authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Docker, Kubernetes, CI/CD with GitHub Actions
- **Monitoring**: Prometheus, Grafana, Sentry

## 📋 Features

### Core QMS Modules
- **Management Reviews** - ISO 13485 compliant management review processes
- **CAPA Management** - Corrective and Preventive Action workflows
- **Audit Management** - Internal and supplier audit execution
- **Document Control** - Controlled document management with versioning
- **Supplier Management** - Supplier qualification and assessment

### Compliance Features
- **21 CFR Part 11 Compliant** - Electronic records and signatures
- **Audit Trails** - Complete tamper-evident change tracking
- **Role-Based Access Control** - Multi-level security permissions
- **Data Encryption** - Field-level encryption for sensitive data
- **Validation Ready** - IQ/OQ/PQ protocols included

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd eqms
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. **Initialize database**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Project Structure
```
eqms/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Node.js backend API
│   ├── routes/             # API route handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic services
│   └── utils/              # Server utilities
├── shared/                 # Shared code between client/server
│   └── schema.ts           # Database schema definitions
├── documentation/          # Comprehensive project documentation
├── tests/                  # Test files
└── migrations/             # Database migrations
```

## 📚 Documentation

Comprehensive documentation is available in the `/documentation` folder:

### Technical Documentation
1. **[User Requirements Specification](documentation/USER_REQUIREMENTS_SPECIFICATION.md)** - Functional and non-functional requirements
2. **[Detailed Design Specification](documentation/DETAILED_DESIGN_SPECIFICATION.md)** - Technical architecture and implementation
3. **[Architectural Diagrams](documentation/ARCHITECTURAL_DIAGRAMS.md)** - System architecture visualizations
4. **[Traceability Matrix](documentation/TRACEABILITY_MATRIX.md)** - Requirements to test case mapping

### Testing & Validation
5. **[Test Protocols](documentation/TEST_PROTOCOLS.md)** - Comprehensive testing strategy
6. **[Validation Master Plan](documentation/VALIDATION_MASTER_PLAN.md)** - Computer system validation approach

### Operations & Deployment
7. **[Deployment Strategy](documentation/DEPLOYMENT_STRATEGY.md)** - DevOps and infrastructure setup
8. **[Security & Compliance Controls](documentation/SECURITY_COMPLIANCE_CONTROLS.md)** - Security architecture
9. **[Change Control Strategy](documentation/CHANGE_CONTROL_STRATEGY.md)** - Software change management
10. **[SLA & Monitoring Strategy](documentation/SLA_MONITORING_STRATEGY.md)** - System monitoring and SLAs

## 🔒 Security

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: AES-256 encryption at rest, TLS 1.3 in transit
- **Audit Logging**: Comprehensive tamper-evident audit trails
- **Compliance**: 21 CFR Part 11 compliant electronic records

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Component and service-level testing
- **Integration Tests**: API and database integration testing
- **Security Tests**: Authentication, authorization, and data protection
- **Performance Tests**: Load testing and scalability validation
- **Compliance Tests**: Regulatory requirement verification

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:security
```

## 🚀 Deployment

### Development Environment
```bash
npm run dev
```

### Production Deployment
The system supports multiple deployment options:

1. **Docker Containers**
```bash
docker-compose up -d
```

2. **Kubernetes**
```bash
kubectl apply -f k8s/
```

3. **CI/CD Pipeline**
- GitHub Actions workflow for automated testing and deployment
- Blue-green deployment strategy
- Automated rollback capabilities

## 🏥 Regulatory Compliance

### ISO 13485:2016
- Quality management system requirements for medical devices
- Risk management integration
- Design controls and document management
- Management review and CAPA processes

### 21 CFR Part 11 Compliant
- Electronic record requirements
- Electronic signature compliance
- Audit trail maintenance
- System validation documentation

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run quality checks: `npm run lint && npm run test`
4. Submit pull request for review
5. Merge to `develop` after approval

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Comprehensive test coverage (>90%)
- Security-first development practices

### Change Control
All changes must follow the established change control process:
- Change request documentation
- Impact assessment
- Testing and validation
- Change Control Board approval

## 📊 Monitoring

### Application Monitoring
- **Metrics**: Prometheus with Grafana dashboards
- **Logs**: Structured logging with Elasticsearch/Kibana
- **Errors**: Sentry for error tracking and alerting
- **Health Checks**: Automated system health monitoring

### SLA Targets
- **Availability**: 99.9% uptime
- **Performance**: <2s response time (95th percentile)
- **Recovery**: <1 hour RTO, <15 minutes RPO

## 📞 Support

### Getting Help
- **Documentation**: Check the `/documentation` folder
- **Issues**: Create GitHub issues for bugs or feature requests
- **Development**: Contact the development team

### Team Contacts
- **Project Lead**: [Name] - [email]
- **DevOps**: [Name] - [email]
- **QA Lead**: [Name] - [email]
- **Compliance**: [Name] - [email]

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with enterprise-grade quality for medical device manufacturing compliance.**
# eQMS Git Repository Setup Guide

## Initial Repository Setup

### 1. Initialize Git Repository
```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial eQMS project setup with comprehensive documentation

- Complete eQMS application with React frontend and Node.js backend
- 10 comprehensive documentation files covering requirements through deployment
- ISO 13485:2016 and 21 CFR Part 11 compliant architecture
- Core QMS modules: Management Reviews, CAPA, Audits, Document Control
- Delete functionality implemented across all modules with confirmation dialogs
- Role-based access control and audit trail system
- Complete test suite and validation protocols
- DevOps deployment strategy with CI/CD pipelines"
```

### 2. Add Remote Repository
```bash
# Add your remote repository URL
git remote add origin <YOUR_REPOSITORY_URL>

# Verify remote is added
git remote -v
```

### 3. Push to Remote Repository
```bash
# Push to main branch
git push -u origin main

# Create and push develop branch
git checkout -b develop
git push -u origin develop
```

### 4. Branch Protection Setup
Configure branch protection rules in your Git hosting platform:

**Main Branch Protection:**
- Require pull request reviews (minimum 2 reviewers)
- Require status checks to pass
- Require branches to be up to date
- Restrict push access
- Include administrators in restrictions

**Develop Branch Protection:**
- Require pull request reviews (minimum 1 reviewer)
- Require status checks to pass
- Allow force pushes (for team leads only)

## Team Onboarding Commands

### 1. Clone Repository
```bash
# Clone the repository
git clone <REPOSITORY_URL>
cd eqms

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your local database credentials
```

### 2. Database Setup
```bash
# Start PostgreSQL (if using Docker)
docker run --name eqms-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=eqms -p 5432:5432 -d postgres:15

# Push database schema
npm run db:push

# Optional: Seed development data
npm run db:seed
```

### 3. Development Server
```bash
# Start development server
npm run dev

# Application will be available at http://localhost:5000
```

### 4. Verify Setup
```bash
# Run all quality checks
npm run lint
npm run type-check
npm run test

# All checks should pass before starting development
```

## Git Workflow for Development Team

### Feature Development
```bash
# Switch to develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/description-of-feature

# Make changes and commit
git add .
git commit -m "feat: implement new feature description"

# Push feature branch
git push origin feature/description-of-feature

# Create pull request to develop branch
```

### Bug Fixes
```bash
# Create bugfix branch from develop
git checkout develop
git checkout -b bugfix/issue-description

# Fix and test
git add .
git commit -m "fix: resolve issue description"

# Push and create pull request
git push origin bugfix/issue-description
```

### Hotfixes (Emergency Production Fixes)
```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-issue

# Apply fix
git add .
git commit -m "hotfix: critical issue resolution"

# Push and create pull request to main
git push origin hotfix/critical-issue

# After merge, ensure fix is also in develop
git checkout develop
git merge main
```

## Repository Structure Overview

```
eqms/
├── README.md                           # Project overview and setup
├── CONTRIBUTING.md                     # Development guidelines
├── SETUP_GUIDE.md                     # This file
├── .gitignore                          # Git ignore patterns
├── .env.example                        # Environment template
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
├── 
├── client/                             # React frontend
│   ├── src/
│   │   ├── components/                 # UI components
│   │   ├── pages/                      # Application pages
│   │   ├── hooks/                      # Custom hooks
│   │   └── lib/                        # Utilities
│   └── public/                         # Static assets
├── 
├── server/                             # Node.js backend
│   ├── routes/                         # API endpoints
│   ├── middleware/                     # Express middleware
│   ├── services/                       # Business logic
│   └── utils/                          # Server utilities
├── 
├── shared/                             # Shared code
│   └── schema.ts                       # Database schemas
├── 
├── documentation/                      # Comprehensive docs
│   ├── README.md                       # Documentation index
│   ├── USER_REQUIREMENTS_SPECIFICATION.md
│   ├── DETAILED_DESIGN_SPECIFICATION.md
│   ├── ARCHITECTURAL_DIAGRAMS.md
│   ├── TRACEABILITY_MATRIX.md
│   ├── TEST_PROTOCOLS.md
│   ├── VALIDATION_MASTER_PLAN.md
│   ├── DEPLOYMENT_STRATEGY.md
│   ├── SECURITY_COMPLIANCE_CONTROLS.md
│   ├── CHANGE_CONTROL_STRATEGY.md
│   └── SLA_MONITORING_STRATEGY.md
├── 
├── tests/                              # Test files
└── migrations/                         # Database migrations
```

## Important Notes for Team

### Security Considerations
- Never commit secrets, API keys, or passwords
- Use .env.example as template for local .env files
- Review all code changes for security implications
- Follow authentication and authorization patterns

### Compliance Requirements
- All changes must maintain regulatory compliance
- Update documentation for significant changes
- Follow change control procedures for production deployments
- Maintain audit trail for all modifications

### Code Quality Standards
- Minimum 90% test coverage required
- All TypeScript strict mode checks must pass
- ESLint and Prettier formatting enforced
- Security scans must pass before merge

### Support Contacts
- Repository Owner: [Your Name] <your.email@company.com>
- Development Lead: [Lead Name] <lead.email@company.com>
- DevOps Support: [DevOps Name] <devops.email@company.com>
- Compliance Review: [QA Name] <qa.email@company.com>

---

**Ready for professional development team collaboration with enterprise-grade QMS capabilities.**
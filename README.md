# 🚀 CRM SaaS Platform

A modern, production-ready Customer Relationship Management (CRM) application built with **React + Node.js, TypeScript**, and deployed on AWS App Runner. This **full-stack React frontend + Node.js backend application** demonstrates enterprise-level development practices and scalable architecture with complete end-to-end development proficiency.

## 🌟 Live Demo

**🔗 Application**: https://3u3db7q2ku.us-west-2.awsapprunner.com  
**🔗 Backend API**: https://f37ddu4y24.us-west-2.awsapprunner.com  
**📧 Contact Sales**: Fully functional with email notifications

### Test Credentials
- **Email**: test@example.com
- **Password**: password123

## ✨ Key Features

- 🔐 **Secure Authentication** - JWT-based with password hashing
- 👥 **Contact Management** - Full CRUD operations with search and filtering  
- 🏢 **Company Tracking** - Organize contacts by companies
- 💼 **Deal Pipeline** - Sales opportunity management
- 📊 **Analytics Dashboard** - Real-time metrics and insights
- 📧 **Email Integration** - Transactional emails via Resend SMTP
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Professional UI** - Modern design with Shadcn/ui components
- ⚡ **Fast Performance** - Optimized with Vite and modern practices
- 🛡️ **Production Security** - Input validation, CORS, XSS protection
- 🌐 **Full-Stack React + Node.js** - Complete end-to-end development

## 🛠️ Tech Stack

### Frontend (React)
- **React 19** + **TypeScript** for type-safe development
- **Vite** for lightning-fast builds and HMR
- **TailwindCSS** for utility-first styling
- **Shadcn/ui** for consistent, accessible components
- **Zustand** for lightweight state management
- **React Router** for client-side navigation

### Backend (Node.js)
- **Node.js** + **Express.js** for robust REST API
- **TypeScript** for backend type safety and development
- **MongoDB Atlas** for cloud database storage
- **JWT** for secure authentication tokens
- **bcryptjs** for password hashing and security
- **Nodemailer** + **Resend** for transactional email services

### DevOps & Deployment
- **AWS App Runner** for serverless deployment
- **GitHub Actions** for CI/CD pipeline
- **Docker** containerization
- **Environment-based** configuration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Node.js API   │    │   MongoDB       │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│   Port: 5173    │    │   Port: 3001    │    │   Cloud Atlas   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS App       │    │   JWT Auth      │    │   Email Service │
│   Runner        │    │   Middleware    │    │   (Resend)      │
│   (Production)  │    │   (Security)    │    │   (SMTP)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Resend account for email (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tsikot39/crm.git
cd crm
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
# Copy environment file
cp .env.example .env

# Update with your credentials:
# - MongoDB connection string
# - JWT secret
# - Email service credentials (optional)
```

4. **Start Development Server**
```bash
npm run dev
```

This starts both frontend (http://localhost:5173) and backend (http://localhost:3001) concurrently.

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Building
npm run build           # Build all services
npm run build:frontend  # Build frontend only
npm run build:services  # Build backend services

# Testing
npm run test           # Run all tests
npm run lint           # Lint all code
```
- **Company Relationships**: Automatic company linking and relationship tracking
- **Smart Search & Filtering**: Global search with instant filtering and highlighting
- **Bulk Operations**: Import, export, and bulk edit contacts
- **Activity Timeline**: Complete interaction history with timestamps
- **Tag Management**: Custom tagging system with autocomplete

### 🏢 Company Management

- **Company Profiles**: Comprehensive company information with industry classification
- **Revenue Tracking**: Financial data with growth metrics and reporting
- **Contact Hierarchies**: Employee relationship mapping within companies
- **Deal Association**: Automatic deal linking and pipeline management
- **Company Size Categorization**: From startup to enterprise classification
- **Location Intelligence**: Geographic data with mapping integration

### 💰 Deal Management

- **Pipeline Visualization**: Drag-and-drop deal progression through sales stages
- **Revenue Forecasting**: Predictive analytics with probability weighting
- **Deal Scoring**: AI-powered lead scoring and prioritization
- **Activity Integration**: Meeting, call, and email tracking per deal
- **Custom Fields**: Flexible deal attributes and metadata
- **Reporting Dashboard**: Real-time sales analytics and KPI tracking

### 🔍 Advanced Search & Analytics

- **Global Search**: Instant search across contacts, companies, and deals
- **Smart Filters**: Dynamic filtering with search-to-page navigation
- **Persistent State**: Filter states maintained across page navigation
- **Advanced Analytics**: Custom dashboards with drill-down capabilities
- **Export Tools**: CSV, Excel, and PDF export functionality
- **Data Visualization**: Charts, graphs, and trend analysis

### 🔐 Security & Access Control

- **Role-Based Permissions**: Admin, Manager, Sales Rep, and Viewer roles
- **Organization Isolation**: Complete tenant separation with zero data leakage
- **JWT Authentication**: Secure token-based authentication system
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Management**: Secure session handling with automatic expiration
- **Audit Logging**: Complete activity tracking for compliance

---

## 🏗️ Architecture

### Microservices Design

Our platform follows a sophisticated microservices architecture that ensures scalability, maintainability, and fault tolerance:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway                               │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Auth Service   │  Contact Service │    Company Service      │
├─────────────────┼─────────────────┼─────────────────────────┤
│  Deal Service   │  Analytics      │    Notification Service  │
├─────────────────┴─────────────────┴─────────────────────────┤
│              Shared Database Layer (MongoDB)                │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
react-nodejs/
├── apps/
│   └── frontend/                 # React TypeScript application
│       ├── src/
│       │   ├── components/       # Reusable UI components
│       │   ├── pages/           # Page components and routing
│       │   ├── stores/          # Zustand state management
│       │   ├── hooks/           # Custom React hooks
│       │   └── utils/           # Utility functions
├── services/
│   ├── api-gateway/             # Central API gateway
│   ├── auth-service/            # Authentication microservice
│   ├── contacts-service/        # Contact management service
│   └── companies-service/       # Company management service
├── shared/
│   ├── types/                   # Shared TypeScript types
│   ├── database/                # Database utilities and repositories
│   └── schemas/                 # Zod validation schemas
├── performance/                 # Performance testing suite
├── infra/                       # Infrastructure and deployment
└── docs/                        # Comprehensive documentation
```

---

## 🛠️ Technology Stack

### Frontend Excellence

- **⚛️ React 19** - Latest React with concurrent features and Suspense
- **📘 TypeScript** - Full type safety with strict mode enabled
- **⚡ Vite** - Lightning-fast development with HMR and optimized builds
- **🎨 TailwindCSS + Shadcn/ui** - Beautiful, consistent, and accessible components
- **🛣️ React Router** - Type-safe routing with protected routes
- **🏪 Zustand** - Lightweight state management with persistence
- **🔄 React Query** - Server state management with caching and synchronization
- **📋 React Hook Form + Zod** - Form validation with schema-based approach
- **🔌 Socket.io Client** - Real-time updates and live data synchronization

### Backend Power

- **🟢 Node.js 18+** - Modern JavaScript runtime with ES modules
- **📘 TypeScript** - Strict typing throughout the entire backend
- **🚀 Express.js** - Fast, minimalist web framework with middleware
- **🔗 tRPC** - End-to-end type safety for API calls
- **🗃️ MongoDB Atlas** - Cloud-native NoSQL database with replica sets
- **📊 Prisma ORM** - Type-safe database operations with migrations
- **🔌 Socket.io** - Real-time bidirectional event-based communication
- **📧 Nodemailer** - Email service integration with templates
- **🔒 JWT + bcrypt** - Secure authentication and password hashing

### DevOps & Infrastructure

- **🐳 Docker** - Containerization with multi-stage builds
- **☸️ Kubernetes** - Container orchestration and auto-scaling
- **⚙️ GitHub Actions** - Automated CI/CD pipeline with testing
- **📊 Sentry** - Error monitoring and performance tracking
- **📈 Prometheus + Grafana** - Metrics collection and visualization
- **🔍 ESLint + Prettier** - Code quality and consistent formatting
- **🧪 Jest + Vitest** - Comprehensive testing framework
- **🎯 Artillery + K6** - Performance and load testing

### Security & Compliance

- **🛡️ Helmet.js** - Security headers and OWASP protection
- **⏱️ Rate Limiting** - API protection against abuse
- **🔐 CORS** - Cross-origin resource sharing configuration
- **🧹 Data Sanitization** - XSS and injection prevention
- **📝 Audit Logging** - Complete activity tracking
- **🔒 HTTPS Enforcement** - TLS/SSL certificate management

---

## 🔐 Security & Compliance

### Authentication & Authorization

- **Multi-Factor Authentication**: Optional 2FA with TOTP
- **OAuth 2.0 Integration**: Google, Microsoft, and GitHub SSO
- **Role-Based Access Control**: Granular permissions system
- **Session Security**: Secure cookie handling with HttpOnly flags
- **Token Rotation**: Automatic JWT refresh with blacklisting

### Data Protection

- **Encryption at Rest**: AES-256 database encryption
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Protection**: Sensitive data masking and anonymization
- **Data Retention**: Configurable retention policies
- **GDPR Compliance**: Right to deletion and data portability

### Security Monitoring

- **Intrusion Detection**: Real-time threat monitoring
- **Vulnerability Scanning**: Automated dependency checks
- **Security Headers**: OWASP recommended headers
- **Input Validation**: Comprehensive sanitization and validation
- **Audit Trails**: Complete activity logging for compliance

---

## 📊 Performance & Optimization

### Frontend Optimizations

- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: On-demand component and asset loading
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Service Workers**: Offline capability and caching strategies
- **Image Optimization**: WebP conversion and responsive images

### Backend Performance

- **Database Indexing**: Optimized MongoDB indexes for queries
- **Query Optimization**: Aggregation pipelines and projection
- **Caching Strategy**: Redis for session and data caching
- **Connection Pooling**: Efficient database connection management
- **Compression**: Gzip/Brotli compression for responses
- **CDN Integration**: Static asset delivery optimization

### Monitoring & Analytics

- **Real-Time Metrics**: Application performance monitoring
- **Error Tracking**: Comprehensive error reporting with Sentry
- **User Analytics**: Usage patterns and feature adoption
- **Performance Budgets**: Automated performance regression detection
- **Load Testing**: Continuous performance validation

---

## 🧪 Testing Strategy

### Test Coverage

- **Unit Tests**: 95%+ coverage with Jest and Vitest
- **Integration Tests**: API endpoint and database testing
- **Component Tests**: React Testing Library for UI components
- **E2E Tests**: Playwright for user journey validation
- **Performance Tests**: Load testing with K6 and Artillery
- **Security Tests**: OWASP ZAP integration for vulnerability scanning

### Quality Assurance

- **Type Safety**: Strict TypeScript configuration
- **Code Quality**: ESLint with custom rules and plugins
- **Git Hooks**: Pre-commit testing and formatting
- **Continuous Integration**: Automated testing on every PR
- **Regression Testing**: Automated visual and functional testing
- **Browser Testing**: Cross-browser compatibility validation

### Test Data Management

- **Database Seeding**: Automated test data generation
- **Mock Services**: Comprehensive API mocking
- **Test Isolation**: Independent test execution
- **Cleanup Utilities**: Automatic test data cleanup
- **Snapshot Testing**: UI component regression prevention

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** 6.0+ (or MongoDB Atlas account)
- **Docker** (optional, for containerized development)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/react-nodejs-crm.git
   cd react-nodejs-crm
   ```

2. **Install dependencies**

   ```bash
   npm install
   npm run install:all
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5174
   - API Gateway: http://localhost:3001
   - API Docs: http://localhost:3001/docs

### Docker Development

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     # Register new user and organization
POST /api/auth/login        # Authenticate user
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update user profile
POST /api/auth/logout       # Logout user
```

### Contact Management

```
GET    /api/contacts        # List contacts with pagination
POST   /api/contacts        # Create new contact
GET    /api/contacts/:id    # Get contact by ID
PUT    /api/contacts/:id    # Update contact
DELETE /api/contacts/:id    # Delete contact
```

### Company Management

```
GET    /api/companies       # List companies with search
POST   /api/companies       # Create new company
GET    /api/companies/:id   # Get company details
PUT    /api/companies/:id   # Update company
DELETE /api/companies/:id   # Delete company
```

### Real-Time Events

```
contact:created             # New contact added
contact:updated             # Contact modified
company:created             # New company added
deal:stage_changed          # Deal moved in pipeline
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                 # Start development servers
npm run dev:frontend        # Start only frontend
npm run dev:backend         # Start only backend services

# Building
npm run build               # Build for production
npm run build:frontend      # Build frontend only
npm run build:services      # Build backend services

# Testing
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:e2e            # End-to-end tests
npm run test:performance    # Performance tests

# Code Quality
npm run lint                # ESLint checking
npm run format              # Prettier formatting
npm run type-check          # TypeScript validation
```

### Development Guidelines

1. **Code Standards**: Follow TypeScript strict mode and ESLint rules
2. **Component Structure**: Use functional components with hooks
3. **State Management**: Zustand for client state, React Query for server state
4. **Testing**: Write tests before implementation (TDD approach)
5. **Git Workflow**: Feature branches with pull request reviews
6. **Documentation**: Update docs with every feature addition

---

## 🐳 Deployment

### Production Deployment

1. **Environment Setup**

   ```bash
   # Production environment variables
   NODE_ENV=production
   MONGODB_URI=your_production_db
   JWT_SECRET=your_secure_secret
   ```

2. **Docker Deployment**

   ```bash
   docker build -t crm-app .
   docker run -p 3000:3000 crm-app
   ```

3. **Kubernetes Deployment**
   ```bash
   kubectl apply -f k8s/
   kubectl get pods
   ```

### Performance Monitoring

- **Health Checks**: `/health` endpoint for service monitoring
- **Metrics**: Prometheus metrics at `/metrics`
- **Logging**: Structured JSON logging with Winston
- **Alerting**: Automated alerts for critical issues

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ by the development team
- Special thanks to the open-source community
- Inspired by modern SaaS architecture best practices

---

**Ready to revolutionize your customer relationship management? Get started today! 🚀**

```

```

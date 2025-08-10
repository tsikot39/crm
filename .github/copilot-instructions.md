<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# CRM SaaS Platform - Development Guidelines

## Project Overview

This is an advanced CRM SaaS application built with a modern tech stack including React, Node.js, TypeScript, and microservices architecture.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + Shadcn/ui
- **Backend**: Node.js + TypeScript + Express + tRPC + Microservices
- **Database**: MongoDB + Prisma ORM
- **Authentication**: Google OAuth + JWT
- **Validation**: Zod schemas
- **State Management**: Zustand + React Query
- **Real-time**: Socket.io
- **Testing**: Jest + Vitest + React Testing Library
- **Deployment**: Docker + Kubernetes

## Project Structure

```
├── apps/
│   └── frontend/          # React application
├── services/
│   ├── api-gateway/       # API Gateway service
│   ├── auth-service/      # Authentication service
│   └── contacts-service/  # Contacts management service
├── shared/
│   ├── types/            # Shared TypeScript types and Zod schemas
│   └── database/         # Prisma schema and database utilities
├── packages/             # Shared packages and utilities
└── infra/               # Infrastructure and deployment configs
```

## Development Guidelines

### Code Standards

- Use TypeScript for all code with strict type checking
- Follow functional programming patterns where possible
- Use Zod for all data validation and schema definition
- Implement proper error handling and logging
- Write comprehensive tests for all components and services

### Component Guidelines

- Use functional components with hooks
- Implement proper prop types with TypeScript interfaces
- Use composition over inheritance
- Create reusable UI components with Shadcn/ui
- Follow accessibility best practices (WCAG 2.1)

### API Guidelines

- Use tRPC for type-safe API calls
- Implement proper authentication and authorization
- Use proper HTTP status codes
- Implement rate limiting and security measures
- Follow RESTful principles for external APIs

### Database Guidelines

- Use Prisma for type-safe database operations
- Implement proper data validation
- Use database transactions where needed
- Optimize queries for performance
- Follow multi-tenant architecture patterns

### Security Guidelines

- Implement OWASP security best practices
- Use proper authentication and session management
- Sanitize all user inputs
- Implement proper CORS policies
- Use HTTPS in production

### Performance Guidelines

- Implement code splitting and lazy loading
- Use React Query for server state management
- Optimize database queries
- Implement proper caching strategies
- Monitor performance metrics

### Testing Guidelines

- Write unit tests for all utilities and services
- Write integration tests for API endpoints
- Write component tests for React components
- Implement end-to-end tests for critical user flows
- Maintain high test coverage

## Best Practices

- Follow SOLID principles
- Use dependency injection where appropriate
- Implement proper logging and monitoring
- Use environment variables for configuration
- Follow semantic versioning
- Write clear documentation and comments
- Use meaningful commit messages

## Development Workflow

1. Create feature branches from main
2. Write tests before implementing features (TDD)
3. Ensure all tests pass before committing
4. Use proper linting and formatting (ESLint + Prettier)
5. Submit pull requests for code review
6. Deploy through CI/CD pipeline

## Environment Setup

- Node.js >= 18
- MongoDB for development
- Docker for containerization

When writing code, always consider scalability, maintainability, and security. Follow the established patterns and conventions in the codebase.

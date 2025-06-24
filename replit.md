# University Staff Attendance System

## Overview

This is a comprehensive university staff attendance management system built with a modern full-stack architecture. The system serves multiple user roles including heads, administrators, mazers (academic coordinators), assistants, teachers, and staff members. Each role has specific permissions and access to different features for managing attendance, leave requests, and schedules.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Comprehensive shadcn/ui component system with Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with in-memory storage
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via Neon serverless)
- **Development**: tsx for TypeScript execution in development

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless connection
- **Session Storage**: In-memory session storage (development setup)
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Authentication & Authorization
- **Session-based Authentication**: Server-side sessions with role-based access control
- **User Roles**: Hierarchical permission system (head, admin, mazer, assistant, teacher, staff)
- **Protected Routes**: Role-based route protection on both client and server
- **User Management**: Full CRUD operations for user accounts

### Database Schema
- **Users Table**: Central user management with role-based permissions
- **Attendance Table**: Daily attendance tracking with time-in/time-out
- **Leave Requests Table**: Leave application and approval workflow
- **Schedules Table**: User schedule management with day-of-week assignments

### User Interfaces
- **Role-specific Dashboards**: Customized interfaces for each user role
- **Attendance Management**: Mark attendance, view records, generate reports
- **Leave Management**: Submit requests, approve/reject applications
- **User Administration**: Add, edit, and manage user accounts
- **Schedule Management**: View and manage work schedules

## Data Flow

1. **Authentication Flow**: User logs in → Session created → Role-based routing
2. **Attendance Flow**: Mark attendance → Database update → Real-time UI refresh
3. **Leave Request Flow**: Submit request → Admin approval → Status update
4. **User Management Flow**: Admin creates user → Database insertion → Role assignment

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React ecosystem with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **HTTP Client**: Fetch API with TanStack Query
- **Form Validation**: Zod for schema validation
- **Date Handling**: date-fns for date manipulation

### Backend Dependencies
- **Database**: Neon PostgreSQL serverless
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express session middleware
- **Development Tools**: tsx, esbuild for TypeScript compilation

### Development Tools
- **Build System**: Vite for frontend, esbuild for backend
- **Type Checking**: TypeScript with strict configuration
- **Linting**: Built-in TypeScript checking
- **Development Server**: Vite dev server with HMR

## Deployment Strategy

### Production Build
- **Frontend**: Vite build outputs to `dist/public`
- **Backend**: esbuild compiles TypeScript to `dist/index.js`
- **Static Assets**: Served from Express static middleware

### Environment Configuration
- **Development**: `npm run dev` - runs both frontend and backend
- **Production**: `npm run build` followed by `npm run start`
- **Database**: Requires `DATABASE_URL` environment variable

### Replit Configuration
- **Modules**: Node.js 20, web development, PostgreSQL 16
- **Deployment**: Autoscale deployment target
- **Port Configuration**: Internal port 5000, external port 80

## Changelog

```
Changelog:
- June 24, 2025. Initial setup
- June 24, 2025. Updated Teacher/Staff dashboard design to match user specifications with simplified layout showing Present Days, Late Days, Absence Days, Pending Leaves, Attendance History, and Leave Request functionality with approval status indicators
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
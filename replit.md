# GovPortal - Government Examination Portal

## Overview
GovPortal is a full-stack government examination portal enabling candidates to register, create one-time registration (OTR) profiles, browse active exams, and submit applications. Administrators can manage exams, notices, and view applications. It features a professional blue/gold government-themed design, secure session-based authentication, and supports both online and offline examination modes. The platform aims to streamline the government examination process with features like multi-post exam support, enhanced education profiles, secure exam browser integration, and comprehensive reporting.

### Domain Separation
- **Examination Portal**: Main domain (examinationportal.com)
- **Job Alerts Portal (Rogar Hub)**: Separate domain (rogar-hub.com) for job alerts, results, admit cards
- Domain detection via `usePortal()` hook in `client/src/hooks/use-portal.ts` - checks hostname for "rogar-hub" or "rojgarhub" or admin-configured `jobPortalDomain` setting
- Dedicated `RojgarHubHome` landing page shown on job portal domain
- All job-related links use dynamic `jobBasePath` (`/jobs` on dedicated domain, `/job-alerts` on main domain)
- Admin can configure domain name, portal name, and tagline in Site Settings

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: express-session with connect-pg-simple
- **Authentication**: Custom session-based auth with bcryptjs
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation

### Core Features
- **Authentication**: Session-based with role-based access control (candidate vs. admin). Supports OTP-based login.
- **Exam Management**: Multi-post exam configurations, category-wise fees, notification PDF uploads.
- **Candidate Profiles**: Comprehensive education profile fields (10th, 12th, Graduation, etc.).
- **Security & Accessibility**: CERT-IN compliance (CSP, HSTS, secure cookies, XSS/CSRF protection, input validation), GIGW 3.0 accessibility (skip link, focus-visible, high contrast, reduced motion, ARIA labels).
- **Admin Panel**: Exam-wise statistics, search/filter for applications, CSV export, admit card generation.
- **Secure Exam Browser (SEB) Integration**: Browser lockdown, webcam proctoring, session management, and secure exam launch flow for real-time exams at centers.
- **Offline Exam Mode**: Supports conducting exams at centers with unreliable internet connectivity, including candidate data upload, shift management, encrypted question papers, and result synchronization.
- **Payment System**: Integrated for application and revaluation fees, ready for Stripe/Razorpay.
- **Certificate Management**: Digital certificate (PROVISIONAL, MARKSHEET, MIGRATION, DEGREE, TRANSCRIPT) generation and public verification with QR codes.
- **MIS Reports & Analytics**: Comprehensive reporting dashboard for application, results, payments, revaluation, and certificate data, with CSV export.
- **Notification System**: Supports SMS and Email notifications (currently in demo mode, logs to console).

### Project Structure
- `client/`: React frontend
- `server/`: Express backend
- `shared/`: Shared code (schemas, routes, models)

### Authentication Pattern
- Session-based authentication stored in PostgreSQL.
- Role-based access control.
- Protected routes use `isAuthenticated` and `isAdmin` middleware.
- Client-side auth state managed via React Query.

### Data Flow Pattern
- API routes defined declaratively in `shared/routes.ts` with Zod schemas.
- Frontend hooks in `client/src/hooks/` for TanStack Query.
- Storage layer in `server/storage.ts` for database operations.
- Type safety from Drizzle schemas through Zod to React components.

## External Dependencies

### Database
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Schema management and query building.
- **connect-pg-simple**: PostgreSQL-backed session storage.

### Cloud Services
- **AWS S3**: For storing media assets (logos, images, documents).
- **AWS Route 53**: DNS management for subdomain configuration.
- **AWS Certificate Manager**: SSL/TLS certificates.
- **AWS Application Load Balancer**: Traffic routing for exam-specific subdomains.

### Third-Party Services
- **Google Fonts**: Inter, Merriweather, and Playfair Display font families.
- **Stripe/Razorpay**: Payment gateway integration (requires API keys).
- **SMS Gateway (e.g., Twilio)**: For OTP and notification (requires API keys).
- **SMTP Service**: For email notifications (requires SMTP credentials).

### Key NPM Packages
- `@tanstack/react-query`
- `bcryptjs`
- `express-session`
- `drizzle-orm` / `drizzle-kit`
- `zod`
- `wouter`
- `framer-motion`
- `date-fns`
- `shadcn/ui`
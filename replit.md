# ChatGrow - מערכת SaaS לניהול עסקים קטנים-בינוניים

## Overview

ChatGrow is a comprehensive backend system designed for managing small to medium-sized businesses. It offers advanced communication capabilities and streamlines core business operations. The system's primary purpose is to provide a robust platform for managing customers, events, appointments, payments, and invoices. It also includes an automated notification system for Email and SMS. ChatGrow aims to enhance business efficiency and customer engagement through integrated management tools and automated communication workflows.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.

## System Architecture

ChatGrow is built with a Node.js and Express.js backend. It leverages a microservices-like approach for various functionalities.

### UI/UX Decisions
- **Frontend Framework**: React 19 with Vite for fast development and build times
- **Styling**: Tailwind CSS v3 with full RTL (Right-to-Left) support for Hebrew interface
- **Architecture**: Single Page Application (SPA) with protected routes
- **Provider Dashboard**: Full-featured admin interface with sidebar navigation for service providers
- **Admin Pages**: Dashboard, Events, Customers, Appointments, and Payments management
- **Authentication UI**: Modern login/register pages with gradient backgrounds and responsive design
- **Components**: Modular layout system with Sidebar, MainLayout, and PrivateRoute components

### Technical Implementations
- **Frontend Stack**:
    - React 19 + Vite for modern development experience
    - Tailwind CSS v3 for utility-first styling with RTL support
    - React Router v6 for client-side routing
    - Axios for API communication with proxy configuration
    - LocalStorage for token and user persistence
- **Authentication**: 
    - JWT for secure user authentication
    - AuthContext for global auth state management
    - Protected routes via PrivateRoute component
    - Login/Register UI with Hebrew language support
- **Notifications**: A `NotificationService` handles automated Email (Nodemailer/SendGrid) and SMS (Twilio) notifications. This service uses a provider pattern for flexibility.
- **Payments & Invoicing**:
    - Uses a `PaymentService` and `InvoiceService` for managing transactions.
    - Supports multiple Israeli payment providers (Cardcom, Meshulam, Tranzila) through a flexible provider pattern.
    - Generates Hebrew PDF invoices using PDFKit.
    - Automates the payment-to-invoice-to-email workflow.
- **CRON Automation**:
    - A `CronService` powered by node-cron handles automated scheduled tasks.
    - **6 Automated Jobs**: Event reminders (hourly), appointment reminders (hourly), automatic payments (daily 10:00), weekly reports (Sunday 20:00), monthly reports (1st 08:00), data cleanup (daily 02:00).
    - Exposed via `/api/cron` endpoints for monitoring job status, viewing schedules, and manual execution.
    - Integrated with NotificationService for automated reminder delivery.
- **Queue System**: Currently uses an in-memory queue with basic queuing and retry logic, with an option to integrate Redis for persistence and enhanced capabilities.
- **Logging**: Implemented with Winston, providing console and file logging, daily rotation, and structured JSON logs.
- **Security**: Incorporates JWT authentication, password hashing (bcrypt), rate limiting, Helmet security headers, CORS protection, and input validation (Joi).

### Feature Specifications
- **Customer Management**: 
    - Full CRUD interface with table view
    - Customer details including name, email, phone, and notes
    - Event attendance tracking
- **Event Management**: 
    - Create, view, and manage events
    - Event details: title, description, date, time, location, max participants, price
    - Status tracking and participant count
- **Appointment Scheduling**: 
    - Book and manage appointments with customers
    - Service type specification
    - Status management (scheduled, completed, cancelled)
- **Dashboard**: 
    - Statistics overview (events, participants, revenue)
    - Quick action buttons for common tasks
    - Upcoming events display
- **Subscriber Management**: Capabilities for handling subscriber lists (Backend only)
- **Health Monitoring**: Endpoints for checking system health and retrieving logs (Backend only)

### System Design Choices
- **Database Strategy**: A hybrid approach using PostgreSQL for user and subscriber data, and MongoDB Atlas for event, customer, appointment, analytics, and WhatsApp connection data.
- **Modularity**: 
    - Backend: Organized into `models`, `routes`, `services`, `providers`, and `middleware` directories
    - Frontend: Component-based architecture with `pages`, `components`, `contexts`, `services`, and `utils` directories
- **Development Setup**:
    - Single workflow (`fullstack`) runs both backend (port 3000) and frontend (port 5000)
    - Vite proxy configuration routes `/api` requests to backend
    - AllowedHosts configured for Replit hosting environment

## External Dependencies

- **PostgreSQL (Neon)**: Used for Subscribers and User data.
- **MongoDB Atlas**: Used for Events, Customers, Appointments, Analytics, and WhatsApp connections.
- **Redis (Optional)**: Can be integrated for caching and background jobs. If not connected, an in-memory queue is used.
- **Nodemailer**: Email provider for `NotificationService`.
- **SendGrid**: Email provider for `NotificationService`.
- **Twilio**: SMS provider for `NotificationService`.
- **Cardcom**: Payment gateway integration.
- **Meshulam (Grow-Meshulam)**: Payment gateway integration.
- **Tranzila**: Payment gateway integration.
- **JWT**: JSON Web Tokens for authentication.
- **Winston**: Logging library.
- **Helmet**: Middleware for setting security headers.
- **CORS**: Middleware for Cross-Origin Resource Sharing.
- **Mongoose**: MongoDB object modeling tool.
- **pg**: PostgreSQL client for Node.js.
- **PDFKit**: Library for PDF generation, specifically used for Hebrew invoices.
- **Bcrypt**: Library for password hashing.
- **Joi**: Schema description language and data validator.
- **React**: Frontend UI library v19
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework v3
- **React Router**: Client-side routing v6
- **Axios**: HTTP client for API requests

## Recent Changes (November 2025)

### Frontend Development Phase 3
- **Complete UI overhaul from Chakra UI v3 to Tailwind CSS v3** due to React 19 compatibility issues
- **Admin Dashboard** with sidebar navigation and statistics overview
- **Events Management Page** with create/edit/delete functionality and modal forms
- **Customers Management Page** with table view and customer details
- **Appointments Management Page** with scheduling and status management
- **Authentication System** with Hebrew RTL login/register pages
- **Protected Routes** with PrivateRoute component and AuthContext
- **Vite Configuration** optimized for Replit with proxy and allowedHosts settings

### Backend API Integration (November 6, 2025)
- **Created MongoDB-backed API endpoints** for Customers and Appointments (replaced HTML-only routes)
- **Full CRUD operations** implemented for both entities with authentication middleware
- **Client-side API integration** - All admin pages now use axios with proper API calls
- **Loading states and error handling** added to all pages (Events, Customers, Appointments)
- **Data persistence verified** - All operations now save to MongoDB and persist across sessions
- **API service layer** expanded in client/src/services/api.js with customersAPI and appointmentsAPI
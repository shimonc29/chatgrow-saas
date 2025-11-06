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
- **Admin Pages**: Dashboard, Events, Customers, Appointments, Payments management with full CRUD operations
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
- **Payment Management**:
    - Full CRUD interface with table view and status tracking
    - Support for multiple payment methods and Israeli payment providers
    - Multi-currency support (ILS, USD, EUR)
    - Payment status management (pending, processing, completed, failed, refunded, cancelled)
    - Customer integration with dropdown selection
    - Provider selection (manual or gateway providers)
- **Subscriber Management**: Capabilities for handling subscriber lists (Backend only)
- **Health Monitoring**: Endpoints for checking system health and retrieving logs (Backend only)

### System Design Choices
- **Database Strategy**: A hybrid approach using PostgreSQL for user and subscriber data, and MongoDB Atlas for event, customer, appointment, payment, invoice, analytics, and WhatsApp connection data.
- **Modularity**: 
    - Backend: Organized into `models`, `routes`, `services`, `providers`, and `middleware` directories
    - Frontend: Component-based architecture with `pages`, `components`, `contexts`, `services`, and `utils` directories
- **Development Setup**:
    - Single workflow (`fullstack`) runs both backend (port 3000) and frontend (port 5000)
    - Vite proxy configuration routes `/api` requests to backend
    - AllowedHosts configured for Replit hosting environment

## External Dependencies

- **PostgreSQL (Neon)**: Used for Subscribers and User data.
- **MongoDB Atlas**: Used for Events, Customers, Appointments, Payments, Invoices, Analytics, and WhatsApp connections.
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

### Authentication System Migration (November 6, 2025)
- **Migrated authentication from in-memory Map to PostgreSQL** for permanent data storage
- **Created ServiceProvider model** with full CRUD operations and password hashing
- **Created service_providers table** in PostgreSQL with proper indexes
- **Updated auth.js routes** to use database instead of temporary storage
- **Verified functionality** - Registration and login now persist across server restarts
- **Fixed JWT middleware mismatch** - Replaced authMiddleware.authenticate() with verifyProviderToken in appointments.js, customers.js, and events.js to use correct JWT secret and token structure
- **Token structure aligned** - All routes now expect {providerId, email, businessName} instead of {userId, sessionId}

### Email/SMS Notification System (Already Implemented)
- **NotificationService** fully operational with multiple provider support
- **Email providers:** SendGrid (production) + Nodemailer (fallback/development)
- **SMS providers:** Twilio (production) + MockSMS (development/testing)
- **Automated notifications:** Event reminders, appointment reminders via CronService
- **Multi-channel support:** Send via Email + SMS simultaneously
- **Template system:** Hebrew RTL email templates for event confirmations and reminders

### Dashboard Statistics & Security Improvements (November 6, 2025)
- **Dashboard Statistics API** (/api/stats) created with real-time data from MongoDB
- **Statistics displayed:** Total events, customers, appointments, revenue calculations
- **Upcoming events & recent customers** shown on Dashboard with proper formatting
- **JWT Security fix:** Replaced hardcoded 'your-secret-key' with process.env.JWT_SECRET across all routes
- **Shared authentication middleware:** stats.js now uses verifyProviderToken from auth.js
- **Error response standardization:** Changed error field from 'error' to 'message' for consistency
- **Environment secrets:** JWT_SECRET now properly stored in Replit Secrets for security

### Payments Management System (November 6, 2025)
- **Payments Routes Security Update**: Updated all payment routes to use verifyProviderToken middleware instead of old authenticate
- **GET /api/payments**: List all payments with filtering by status, date range, and customer
- **POST /api/payments/create**: Create new payment with customer info and payment method
- **Complete Payment Flow**: Integration with PaymentService for Cardcom, Meshulam, Tranzila providers
- **Payments UI Page**: Full-featured Payments.jsx with table view, status badges, and create modal
- **Customer Integration**: Payment creation form includes customer dropdown from MongoDB
- **Payment Methods**: Support for credit card, Bit, bank transfer, cash, and other methods
- **Currency Support**: Multi-currency support (ILS ₪, USD $, EUR €) with proper formatting
- **Status Management**: Track payment status (pending, processing, completed, failed, refunded, cancelled)
- **Provider Selection**: Choose between manual entry or Israeli payment providers
- **Sidebar Navigation**: Added Payments link with 💳 icon
- **API Client**: Expanded paymentsAPI with getAll, create, delete, complete, refund methods
- **MongoDB Integration**: Payment and Invoice models updated to use String businessId for consistency
- **Manual Payment Support**: Added support for manual payments (cash, bank transfer, Bit) that bypass PaymentService
- **Route Ordering Fix**: Fixed /providers route conflict by placing it before /:id parameterized route

### Public Registration System (November 6, 2025)
- **Public API Routes** (/api/public): Created authentication-free endpoints for public event registration and appointment booking
- **GET /api/public/events/:id**: View public event details with availability information
- **POST /api/public/events/:id/register**: Register for events with automatic customer creation and payment integration
- **GET /api/public/appointments/available**: View available appointment time slots
- **POST /api/public/appointments/book**: Book appointments with service selection and payment
- **EventRegistration.jsx**: Full-featured public event registration page with Hebrew RTL, event details display, registration form, and integrated payment options
- **AppointmentBooking.jsx**: Public appointment booking page with service type selection, date/time picker, and payment integration
- **PaymentSuccess.jsx & PaymentError.jsx**: Confirmation pages with Hebrew messaging and next steps after payment
- **Automated Notifications**: Integration with NotificationService for Email + SMS confirmations after successful registration/booking
- **Participant Tracking**: Events now track participants with registration timestamps and payment status
- **Multi-Channel Payment**: Support for both manual payments (immediate confirmation) and gateway payments (redirect to provider)
- **Customer Auto-Creation**: System automatically creates or updates customer records from public registrations
- **Public Routes**: All public pages accessible without authentication at /events/:id/register, /appointments/book, /payment/success, /payment/error
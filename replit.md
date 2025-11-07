# ChatGrow - מערכת SaaS לניהול עסקים קטנים-בינוניים

## Overview

ChatGrow is a comprehensive backend system designed to empower small to medium-sized businesses with advanced communication capabilities and streamlined operational management. Its core purpose is to provide a robust platform for managing customers, events, appointments, payments, and invoices, complemented by an automated Email and SMS notification system. ChatGrow aims to significantly enhance business efficiency, improve customer engagement, and automate critical workflows through its integrated suite of management tools. The project seeks to capture market share in the SMB SaaS space by offering an all-in-one solution for business growth and customer relationship management.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.

## System Architecture

ChatGrow employs a Node.js and Express.js backend, adopting a microservices-like approach for distinct functionalities. The frontend is a React 19 Single Page Application (SPA) built with Vite and styled using Tailwind CSS v3, featuring full RTL support for a Hebrew interface.

### UI/UX Decisions
- **Frontend Framework**: React 19 with Vite.
- **Styling**: Tailwind CSS v3 with full RTL support.
- **Design Theme**: Clean, professional teal-light color scheme across entire application.
  - **Colors**: 
    - BG Light (#F8F9FA) - Soft white primary background, comfortable for the eyes
    - BG Card (#FFFFFF) - Pure white for cards, creating contrast and "floating" effect
    - Accent Teal (#00798C) - Deep blue-green for primary highlights and CTAs, conveys trust and understated luxury
    - Accent Hover (#035368) - Darker teal for hover states, modern click effect
    - Text Primary (#212529) - Near-black dark gray, excellent readability (AAA)
    - Text Secondary (#6C757D) - Medium gray for secondary details
  - **Logo**: Crown icon (👑) representing premium quality
  - **Backgrounds**: Light gradients (from-bg-light via-bg-card to-bg-light)
  - **Cards**: White cards with subtle borders and shadows
  - **Typography**: Teal headings (text-accent-teal), dark content (text-primary)
  - **Buttons**: Teal gradient primary buttons with hover effects
  - **Inputs**: White inputs with gray borders and teal focus rings
  - **Effects**: Subtle shadows, hover animations, professional appearance
- **Architecture**: Single Page Application (SPA) with protected routes.
- **Provider Dashboard**: Admin interface with sidebar navigation for CRUD operations on Dashboard, Events, Customers, Appointments, Payments, Financial Management, Landing Pages, Registration Pages, Payment Settings, and Provider Settings. Clean light theme with teal accents throughout.
- **Authentication UI**: Professional teal-light themed login/register pages with clean design and teal accent buttons.
- **Components**: Modular layout using Sidebar (teal highlights), MainLayout (light background), and PrivateRoute components.
- **Marketing Home Page**: Public marketing page (`/`) designed for conversion with clean teal-light design, featuring a multi-section layout with sticky navigation bar, hero section with teal accents, statistics, benefits, detailed features, a "how it works" section, testimonials, and strong CTAs. Fully responsive with RTL support.
- **Landing Page Builder**: Template-based system for creating marketing landing pages with 5 pre-designed templates, live preview, and customizable content/styling. Includes a light-themed management interface with teal accents for tracking views and conversions, and public routes for published pages.
- **Financial Management**: Unified UI for managing both invoices and receipts with tabs, manual creation capabilities, PDF generation, and email delivery. Clean teal-light themed with comprehensive CRUD operations.

### Technical Implementations
- **Frontend Stack**: React 19, Vite, Tailwind CSS v3, React Router v6, Axios, LocalStorage.
- **Authentication**: JWT for secure user authentication, AuthContext for global state, Protected Routes.
- **Multi-Tenant Provider System**: `ProviderSettings` model allowing each business client to configure their own Email (SendGrid/SMTP), SMS (Twilio), and Payment (Cardcom/GROW) providers with encrypted API credentials.
- **Notifications**: `NotificationService` for Email and SMS with provider-swapping support, template-based messaging, and delivery tracking.
- **Payments & Invoicing**: `PaymentService` and `InvoiceService` supporting Israeli payment providers (Cardcom, GROW). Multi-tenant architecture with per-client configuration. Generates Hebrew PDF invoices and automates payment workflows.
- **Receipt System**: `ReceiptService` for automatic and manual PDF receipt generation in Hebrew with proper RTL formatting and business branding.
- **CRON Automation**: `CronService` (node-cron) handles scheduled tasks including event/appointment reminders, automatic payments, reports, and data cleanup.
- **Queue System**: In-memory queue with basic retry logic, with an option for Redis integration.
- **Logging**: Winston for console and file logging.
- **Security**: JWT authentication, bcrypt password hashing, rate limiting, Helmet, CORS, Joi input validation.
- **Public API Routes**: Secure, authentication-free endpoints for public event registration and appointment booking with server-side validation.
- **Customer Auto-Creation**: System automatically creates or updates customer records from public registrations.
- **Full CRUD Functionality**: Comprehensive create, read, update, and delete operations for all administrative entities (Events, Appointments, Customers, Payments, Invoices, Receipts), including dedicated edit modals and API routes.
- **Financial Management UI**: Unified tabbed interface combining invoice and receipt management:
  - **Invoices Tab**: Create invoices manually or from payments, itemized billing, tax calculation, PDF generation, and email delivery
  - **Receipts Tab**: Generate receipts from payments or manually, PDF download capabilities, and automatic payment-to-receipt linking
- **Registration Page Links**: Quick access functionality to copy unique registration links for events and appointments, including a dedicated "RegistrationPages" tab.
- **Provider Settings UI**: Admin interface for configuring Email, SMS, and Payment provider credentials with test functionality and invoice settings.
- **Landing Page Analytics**: Built-in analytics system for tracking views, conversions, and conversion rates for landing pages.

### Feature Specifications
- **Management**: Comprehensive CRUD operations for Customers, Events, Appointments, Payments, Invoices, and Receipts.
- **Dashboard**: Overview of statistics (events, participants, revenue) and quick actions.
- **Payment Management**: Multi-currency support (ILS, USD, EUR), various payment methods, status tracking, and integration with Israeli payment providers (Cardcom, GROW only).
- **Invoice Management**: Manual and automatic invoice generation from payments, itemized billing, tax calculation, Hebrew PDF generation, and email delivery.
- **Receipt Management**: Automatic receipt generation from completed payments, manual receipt creation, Hebrew PDF formatting with RTL support.
- **Provider Configuration**: Multi-tenant system allowing each business to configure their own Email (SendGrid/SMTP), SMS (Twilio), and Payment (Cardcom/GROW) providers.
- **Subscriber Management**: Backend capabilities for managing subscriber lists.
- **Health Monitoring**: Endpoints for system health checks and log retrieval.
- **Participants View**: Feature to view and manage participants registered for events, including participant details and payment status.

### System Design Choices
- **Database Strategy**: Hybrid approach with PostgreSQL for user/subscriber data and MongoDB Atlas for events, customers, appointments, payments, invoices, analytics, and WhatsApp connections.
- **Modularity**: Backend organized into `models`, `routes`, `services`, `providers`, `middleware`; Frontend into `pages`, `components`, `contexts`, `services`, `utils`.
- **Development Setup**: Single `fullstack` workflow for backend (port 3000) and frontend (port 5000) with Vite proxy.

## External Dependencies

- **Databases**:
    - **PostgreSQL (Neon)**: For Subscribers and User data.
    - **MongoDB Atlas**: For Events, Customers, Appointments, Payments, Invoices, Analytics, and WhatsApp connections.
    - **Redis (Optional)**: For caching and background jobs.
- **Google Calendar Integration**:
    - **OAuth 2.0**: Multi-tenant integration allowing each provider to connect their own Google Calendar.
    - **Requires**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET environment variables.
    - **Tokens**: Encrypted and stored per provider in ProviderSettings.googleCalendar.
    - **Auto-sync**: Appointments automatically create calendar events in provider's Google Calendar.
- **Communication Services**:
    - **Nodemailer**: Email provider.
    - **SendGrid**: Email provider.
    - **Twilio**: SMS provider.
- **Payment Gateways**:
    - **Cardcom**
    - **Meshulam (GROW)**
- **Security & Utilities**:
    - **JWT**: JSON Web Tokens for authentication.
    - **Winston**: Logging library.
    - **Helmet**: Security headers middleware.
    - **CORS**: Cross-Origin Resource Sharing middleware.
    - **Mongoose**: MongoDB object modeling.
    - **pg**: PostgreSQL client.
    - **PDFKit**: PDF generation (for Hebrew invoices).
    - **Bcrypt**: Password hashing.
    - **Joi**: Data validation.
- **Frontend Libraries**:
    - **React**: UI library v19.
    - **Vite**: Build tool and dev server.
    - **Tailwind CSS**: Utility-first CSS framework v3.
    - **React Router**: Client-side routing v6.
    - **Axios**: HTTP client.
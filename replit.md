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
- **Design Theme**: Luxurious navy-copper color scheme across entire application.
  - **Colors**: 
    - App Navy (#0D1117) - Primary background
    - Card Navy (#161B22) - Secondary background / Cards
    - Accent Copper (#B87333) - Primary accent / Premium highlights
    - Action Blue (#3A7CA5) - Buttons / Active elements
    - Text Light (#C9D1D9) - Primary text
    - Text Subtle (#8B949E) - Secondary text / Descriptions
  - **Logo**: Crown icon (👑) representing premium quality
  - **Backgrounds**: Navy gradients (from-app-navy via-card-navy to-app-navy)
  - **Cards**: Dark navy cards with copper borders (border-accent-copper/30) and blue shadows
  - **Typography**: Copper headings (text-accent-copper), light content (text-text-light)
  - **Buttons**: Blue-copper gradient primary buttons with glow effects (shadow-action-blue/50)
  - **Inputs**: Navy inputs with copper borders and blue focus rings
  - **Effects**: Copper/blue blur balls, hover animations, premium shadows
- **Architecture**: Single Page Application (SPA) with protected routes.
- **Provider Dashboard**: Admin interface with sidebar navigation for CRUD operations on Dashboard, Events, Customers, Appointments, Payments, Invoices, Receipts, Landing Pages, Registration Pages, Payment Settings, and Provider Settings. Dark navy theme with copper accents throughout.
- **Authentication UI**: Luxurious navy-copper themed login/register pages with blur effects and gradient buttons.
- **Components**: Modular layout using Sidebar (navy with copper highlights), MainLayout (dark navy background), and PrivateRoute components.
- **Marketing Home Page**: Public marketing page (`/`) designed for conversion with luxury navy-copper design, featuring a multi-section layout with sticky navigation bar, hero section with copper blur effects, statistics, benefits, detailed features, a "how it works" section, testimonials, and strong CTAs. Fully responsive with RTL support.
- **Landing Page Builder**: Template-based system for creating marketing landing pages with 5 pre-designed templates, live preview, and customizable content/styling. Includes a dark-themed management interface with copper accents for tracking views and conversions, and public routes for published pages.
- **Invoice & Receipt Management**: Full UI for managing invoices and receipts with manual creation capabilities, PDF generation, and email delivery. Navy-copper themed with comprehensive CRUD operations.

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
- **Invoice Management UI**: Full-featured interface for creating invoices manually or from payments, with itemized billing, tax calculation, PDF generation, and email delivery.
- **Receipt Management UI**: Comprehensive interface for generating receipts from payments or manually, with PDF download capabilities.
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
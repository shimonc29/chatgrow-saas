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
- **Architecture**: Single Page Application (SPA) with protected routes.
- **Provider Dashboard**: Admin interface with sidebar navigation for CRUD operations on Dashboard, Events, Customers, Appointments, and Payments.
- **Authentication UI**: Modern, responsive login/register pages.
- **Components**: Modular layout using Sidebar, MainLayout, and PrivateRoute components.

### Technical Implementations
- **Frontend Stack**: React 19, Vite, Tailwind CSS v3, React Router v6, Axios, LocalStorage.
- **Authentication**: JWT for secure user authentication, AuthContext for global state, Protected Routes.
- **Notifications**: `NotificationService` for Email (Nodemailer/SendGrid) and SMS (Twilio) using a provider pattern.
- **Payments & Invoicing**: `PaymentService` and `InvoiceService` supporting multiple Israeli payment providers (Cardcom, Meshulam, Tranzila). Generates Hebrew PDF invoices and automates payment workflows.
- **CRON Automation**: `CronService` (node-cron) handles 6 automated scheduled tasks including event/appointment reminders, automatic payments, reports, and data cleanup.
- **Queue System**: In-memory queue with basic retry logic, with an option for Redis integration.
- **Logging**: Winston for console and file logging with daily rotation and structured JSON.
- **Security**: JWT authentication, bcrypt password hashing, rate limiting, Helmet, CORS, Joi input validation.
- **Public API Routes**: Secure, authentication-free endpoints for public event registration and appointment booking with server-side validation for pricing, availability, and capacity.
- **Customer Auto-Creation**: System automatically creates or updates customer records from public registrations.

### Feature Specifications
- **Management**: Comprehensive CRUD operations for Customers, Events, Appointments, and Payments.
- **Dashboard**: Overview of statistics (events, participants, revenue) and quick actions.
- **Payment Management**: Multi-currency support (ILS, USD, EUR), various payment methods, status tracking, and integration with Israeli payment providers.
- **Subscriber Management**: Backend capabilities for managing subscriber lists.
- **Health Monitoring**: Endpoints for system health checks and log retrieval.

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
    - **Meshulam (Grow-Meshulam)**
    - **Tranzila**
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

## Recent Changes

### Edit Functionality & Registration Pages (November 6, 2025)
- **Edit Functionality**: Added full edit capability for all admin entities (Events, Appointments, Customers, Payments)
  - Edit modal opens with pre-filled data from selected entity
  - Update API routes (PUT /:id) working for all entities  
  - Seamless create/edit flow using single form component
  - Edit buttons (✏️) added to all entity cards/tables
- **Registration Page Links**: Quick access buttons to copy registration links
  - Events: Each event card has "🔗 שתף" button to copy unique registration link
  - Appointments: Global "🔗 קישור הזמנה" button in header for business-wide booking
  - One-click copy to clipboard with 2-second visual confirmation ("✓ הועתק!")
- **New RegistrationPages Tab**: Dedicated page (/registration-pages) showing all registration links
  - Card-based UI with gradient backgrounds (green for appointments, purple for events)
  - Each event card displays: name, description, date, participant count, pricing, full registration URL
  - Appointment card shows business-wide booking link with service selection capability
  - Two actions per card: "📋 העתק" (copy to clipboard) & "🔗 פתח" (open in new tab)
  - Info box with detailed usage instructions for sharing links
  - Full Hebrew RTL support with modern, accessible design
  - Added to sidebar navigation with 🔗 icon

### Bug Fixes & Participants View (November 6, 2025)
- **Fixed Appointment Booking Errors**: Resolved 500 errors when booking appointments
  - Added all required fields to Appointment model (serviceName, customer fields, appointmentDate, startTime, endTime)
  - Server now properly validates and extracts date/time components
  - Price and duration always validated from server-side service catalog (security)
- **Fixed Event Status Validation**: Corrected enum validation errors
  - Changed all 'active' references to 'published' to match Event model enum
  - Public routes now correctly filter for published events only
- **Added Participants Array to Event Model**: Events can now track registrations
  - Stores: name, email, phone, registration date, payment status
  - Enables atomic capacity checks to prevent overbooking
- **Participants View UI**: New feature to view event registrations
  - "👥 נרשמים" button on each event card
  - Detailed modal with table showing all participants
  - Displays: name, email, phone, registration date, payment status
  - Empty state when no participants yet
- **Fixed Payment Creation Error (500)**: Resolved validation error when creating manual payments
  - Added required `relatedTo.type` field to payment form
  - Defaults to 'other' for manual payments not linked to specific events/appointments
  - Payment model now properly validates all required fields
- **Fixed React Rendering Error**: Resolved "Objects are not valid as a React child" error
  - Added `getLocation()` helper function to safely render location objects
  - Handles both string locations and complex location objects with address/type
  - Applied fix to Dashboard, Events, and EventRegistration (public) pages
  - Public event registration links now work without white screen errors

### Payment Provider Settings Interface (November 6, 2025)
- **Payment Settings Page**: New admin interface for configuring payment gateway credentials
  - User-friendly UI for setting up GROW (Meshulam), Cardcom, and Tranzila API keys
  - Toggle switches to enable/disable each payment provider
  - Secure password fields for API credentials
  - Settings stored in localStorage (can be upgraded to backend API storage)
  - Comprehensive help section with links to official documentation (https://grow-il.readme.io/)
  - Added "הגדרות תשלום" menu item to sidebar navigation (⚙️ icon)
  - Protected route requiring authentication to access settings
- **Supported Payment Providers**: System now supports three Israeli payment gateways:
  - **GROW (Meshulam)**: Leading Israeli payment gateway with Bit support, installments, and recurring billing
  - **Cardcom**: Credit card processing with multi-currency support
  - **Tranzila**: Fast payment processing solution
- **Payment Integration**: Business owners can now configure payment providers through UI instead of environment variables

### Landing Page Builder System (November 6, 2025)
- **Template-Based Builder**: Create professional marketing landing pages for events and appointments
  - 5 pre-designed templates: Modern (🎨), Classic (📜), Colorful (🌈), Minimal (⚪), Elegant (✨)
  - Each template includes customizable color schemes and styling
  - Live preview panel shows changes in real-time during editing
- **Landing Pages Management**: New admin interface (/landing-pages) for managing all landing pages
  - Dashboard with overview statistics: total pages, published pages, total views, total conversions
  - Grid layout with thumbnail previews of each landing page
  - Quick actions: Edit (✏️), Copy Link (🔗), Preview (👁️), Duplicate (📋), Delete (🗑️)
  - Status badges: Published (green), Draft (yellow), Archived (gray)
  - Analytics per page: views, conversions, conversion rate percentage
- **Landing Page Editor**: Full-featured editor (/landing-pages/:id) with sections
  - **Basic Info**: Page name, status (draft/published/archived), link to event or appointment
  - **Template Selection**: Quick template switcher with one-click theme changes
  - **Hero Section**: Headline, subheadline, background image, CTA button text and color
  - **Features Section**: Add/remove unlimited feature cards with icon (emoji), title, description
  - **Styling**: Color picker for primary, secondary, and background colors
  - **Preview Panel**: Sticky live preview showing hero and features as you edit
- **Public Landing Pages**: Dedicated public route (/landing/:slug) for viewing published pages
  - Fully responsive, RTL-supported design with Hebrew text
  - Hero section with full-screen background image or gradient
  - Linked entity display (shows event or appointment details with date, price)
  - Features section in 3-column grid layout
  - Testimonials section (configurable via API)
  - Final CTA section with primary color background
  - Footer with custom text and links
  - Conversion tracking on CTA button clicks
- **Analytics & Tracking**: Built-in analytics system
  - Automatic view tracking with IP address deduplication (24-hour window)
  - Conversion tracking when users click CTA buttons
  - Conversion rate calculation displayed in management interface
  - All analytics data stored in MongoDB LandingPage model
- **MongoDB Model**: LandingPage schema with comprehensive fields
  - Fields: businessId, name, slug (unique), template (enum), content (hero, about, features, testimonials, footer), styling (colors, fonts), linkedTo (type, id), seo (title, description, keywords, ogImage), status, analytics (views, conversions, uniqueViewers)
  - Methods: generateSlug(), trackView(ipAddress), trackConversion()
  - Automatic slug generation from page name with uniqueness validation
- **API Routes**: Full CRUD operations for landing pages
  - Admin routes: GET /api/landing-pages, POST /api/landing-pages/create, GET /api/landing-pages/:id, PUT /api/landing-pages/:id, DELETE /api/landing-pages/:id, POST /api/landing-pages/:id/duplicate
  - Public routes: GET /api/public/landing/:slug (with view tracking), POST /api/public/landing/:slug/convert (conversion tracking)
  - All admin routes protected with JWT authentication
  - Public routes open for marketing campaigns
- **Sidebar Navigation**: Added "🎨 דפי נחיתה" menu item for easy access to landing page builder
- **Templates Architecture**: Template-based system (not full drag-and-drop) for faster deployment
  - Templates define layout structure and default styling
  - Users customize content, colors, and images within template structure
  - Approach prioritizes speed-to-market over infinite customization
# ChatGrow - מערכת SaaS לניהול קליניקות למאמנים, מטפלים ויועצים

## Overview

ChatGrow is a multi-tenant SaaS platform specifically designed for coaches, therapists, and consultants (מאמנים, מטפלים ויועצים), operating on a freemium model with a 200-customer limit for free users. The platform is positioned as a niche product for appointment-based businesses in the coaching, therapy, and consulting sectors. It offers a React 19 admin dashboard with Hebrew RTL, Google Calendar integration, Object Storage, a landing page builder, an AI Performance Coach for session optimization, Weekly Strategic AI Reports with Redis caching, and a Super Admin panel for analytics and subscription management. The platform aims to be an all-in-one solution for managing client relationships, appointments, payments, and business growth specifically tailored for the coaching/therapy/consulting market.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.

## Recent Changes

**November 23, 2025 - Unified Schedule Interface & Sidebar Cleanup**
- **Removed duplicate menu items**: Deleted separate `/events` and `/appointments` routes from Sidebar - all functionality now unified in `/schedule`
- Simplified navigation: Single entry point "יומן, זמינות ושירותים" for all scheduling needs
- Integrated full Interactive Calendar System into Schedule Manager's "יומן" tab
- Removed placeholder text and replaced with complete weekly calendar view
- Calendar features now accessible from single unified interface at `/schedule`:
  - Weekly calendar grid with 7-day view showing all appointments, events, blocks, and Google Calendar items
  - Dual-mode functionality: appointment booking mode (teal) / time blocking mode (red)
  - Color-coded items by type: appointments (blue), events (green), blocked time (red), availability (emerald), Google Calendar (purple)
  - Interactive cells: click any day to create appointment or block time based on selected mode
  - Click existing items to view details with type-specific actions (cancel, remove, view details)
  - Week navigation: previous week, today, next week
  - Weekly summary statistics by item type
  - Three modals: AppointmentModal for quick creation, BlockTimeModal for time blocking, ItemDetailsModal for item details
- Calendar data loaded via `/api/calendar` endpoint with date range filtering
- Auto-refresh after modal actions (create/edit/delete) updates all related lists
- Maintains backward compatibility with standalone `/calendar` route

**November 23, 2025 - Public Appointment Booking System Upgrade**
- Created new unified booking endpoint `POST /api/public/appointments` using serviceId from Availability model (replaces legacy serviceType system)
- Built 4 new booking UI components: ServiceCard, CalendarPicker, TimeSlotPicker, SuccessMessage
- Completely rewrote AppointmentBooking.jsx with modern 4-step booking flow (Service Selection → Date Selection → Time Selection → Customer Details + Confirmation)
- Integrated with unified availability system: service-specific constraints, conflict detection with appointments/events, server-side price/duration validation
- Enhanced UX: step navigation breadcrumbs, progress tracking, "Add to Google Calendar" button in success message, calendar navigation restrictions matching backend booking windows
- Full source tracking support for acquisition analytics (sourceKey, UTM parameters, referralCode)
- Backward compatibility maintained: legacy `/appointments/book` endpoint still functional for existing integrations
- **Comprehensive Backend Validation**: minAdvanceBookingHours (minimum advance notice), maxAdvanceBookingDays (booking window with nullish coalescing for 0-value support), blocked dates, service-specific allowed days/time ranges with multi-range support for consecutive slots, weekly schedule validation with safe guards for legacy providers without weeklySchedule, and conflict detection with existing appointments/events
- **Security & Data Integrity**: Server-side price/duration enforcement from Availability model (never trust client-supplied values), safe defaults for missing fields (maxAdvanceBookingDays ?? 30, minAdvanceBookingHours ?? 0), and backward compatibility guards for providers without new schema fields

**November 22, 2025 - Unified Schedule & Services Interface**
- Merged Availability/Services/Calendar into single "יומן, זמינות ושירותים" page (`/schedule`)
- Enhanced Availability model with service-specific constraints: `allowedDaysOfWeek` (0-6), `allowedTimeRanges` (HH:MM-HH:MM), `color` (hex)
- Upgraded `/api/public/availability/slots` with smart logic: service constraints, conflict detection, per-slot minAdvance validation
- Legacy routes `/availability` and `/calendar` now redirect to `/schedule`
- Full backward compatibility: old services (without new fields) continue working

## System Architecture

ChatGrow uses a Node.js/Express.js backend with a microservices-like approach and a React 19 SPA frontend built with Vite and Tailwind CSS v3, featuring full Hebrew RTL support.

### UI/UX Decisions
- **Frontend**: React 19 with Vite, Tailwind CSS v3 (RTL).
- **Design Theme**: Clean, professional teal-light color scheme with specific palette (BG Light, BG Card, Accent Teal, Accent Hover, Text Primary, Text Secondary) and a crown logo.
- **Modular Components**: Sidebar, MainLayout, PrivateRoute.
- **Marketing Home Page**: Public marketing page repositioned for coaches/therapists/consultants with sticky nav, hero ("המערכת שממלאת לך את היומן ומפסיקה את ה-No-Show"), problem section addressing no-shows and WhatsApp chaos, solution sections (what ChatGrow does, how it works), main features grid, why different section, pricing (FREE/PREMIUM), FAQ, and CTAs. All copy targets the coaching/therapy/consulting niche.
- **Landing Page Builder**: Template-based with 5 designs, live preview, customizable content/styling, analytics, 8 pre-made color schemes, 6 Hebrew Google Fonts, 5 CTA button styles, MediaPicker integration, and duplicate functionality.
- **Financial UI**: Unified UI for invoices/receipts with manual creation, PDF generation, and email delivery.
- **Public Event Registration**: Teal-light design with 403 error handling.
- **Availability Calendar**: Google Calendar connection management with premium gating.
- **Interactive Calendar Modals**: Three specialized modals built with React and Tailwind CSS:
  - **AppointmentModal**: Quick appointment creation with fields for date, time, duration (15-120 minutes), customer details (name, phone), service name, and notes. Auto-calculates end time based on selected duration.
  - **BlockTimeModal**: Time blocking interface for creating unavailable periods with date, time range (or full day), and customizable reason (vacation, training, break, etc.).
  - **ItemDetailsModal**: Unified details view for all calendar items (appointments, events, blocks, Google Calendar) with type-specific actions (cancel appointment, remove block, view event details).

### Technical Implementations
- **Frontend Stack**: React 19, Vite, Tailwind CSS v3, React Router v6, Axios, LocalStorage.
- **Authentication**: JWT, AuthContext, Protected Routes.
- **Freemium Model**: 200-customer limit enforced by middleware; premium features gated.
- **Marketplace Payments**: 95%/5% split with Cardcom/GROW; 5% platform fee automated via Green Invoice/iCount.
- **Tranzila Integration**: Exclusive payment provider model where providers register, get manual approval, and receive 100% direct payments.
- **Multi-Tenant Provider System**: `ProviderSettings` for per-business Email (SendGrid/SMTP), SMS (Twilio), and Payment (Cardcom/GROW/Tranzila) configuration.
- **Notifications**: `NotificationService` for Email/SMS with provider swapping and templates.
- **Payments & Invoicing**: `PaymentService` and `InvoiceService` for Israeli providers, Hebrew PDF generation.
- **Receipt System**: `ReceiptService` for automatic/manual Hebrew PDF receipts with RTL.
- **CRON Automation**: `CronService` for scheduled tasks (reminders, payments, reports, platform fees).
- **Queue System**: In-memory queue with basic retry logic.
- **Security**: JWT, bcrypt, rate limiting, Helmet, CORS, Joi validation.
- **Public API Routes**: Secure, unauthenticated endpoints for public registrations.
- **Customer Auto-Creation**: Creates/updates customer records from public registrations.
- **AI Performance Coach**: Premium-only feature using OpenAI GPT-4o-mini (via Replit AI Integrations) for pricing, timing, and conversion rate optimization based on historical event data.
- **Weekly Strategic AI Reports**: Premium-only automated reports using OpenAI GPT-4o-mini with Zod validation and multi-tenant Redis caching for pricing recommendations, demand forecasts, and risk identification.
- **Centralized Media Library**: Replit Object Storage integration for image management, including a Media Model, Admin UI, and a reusable MediaPicker component.
- **Super Admin Panel**: Restricted panel for platform owners (`SUPER_ADMIN_EMAILS`) to manage subscriptions, quotas, and customer data system-wide.
- **Growth Module (GET-KEEP-GROW Model)**: Business intelligence system for acquisition (GET - tracking, AI insights), retention (KEEP - RFM analysis, churn prediction, win-back), and expansion (GROW - upselling, cross-selling, package upgrades with 5 detection algorithms).
- **Lead Source Tracking System**: Comprehensive attribution tracking across all customer touchpoints with sourceKey (e.g., `landing-page:slug`, `event:id`, `appointment:businessId`), UTM parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content), and referralCode stored at customer creation. Frontend captures URL parameters via `sourceTracking.js` utility; backend persists in Customer/Registration/Appointment models; growthGetService aggregates by sourceKey for acquisition funnel analytics.
- **Interactive Calendar System**: Full-featured calendar interface with dual-mode functionality (appointment booking / time blocking), modal-based interactions for creating appointments and blocking time, item details view with cancel/delete capabilities and participant display for events, and aggregated view of Appointments, Events, Availability blocks, and Google Calendar events. Supports quick appointment creation via `POST /api/appointments/quick-create`, time blocking via `POST /api/availability/block`, and removal via `DELETE /api/availability/block/:id`. Automatic appointment creation when customers register for events.
- **Public Appointment Booking System**: Customer-facing appointment booking page (`/appointments/book?businessId=X`) with display of existing appointments, available time slots based on provider availability, service catalog integration, automatic customer creation, and payment processing. Supports source tracking for acquisition analytics.

### Feature Specifications
- **Management**: CRUD for Customers, Events, Appointments, Payments, Invoices, Receipts.
- **Dashboard**: Statistics and quick actions.
- **Payment Management**: Multi-currency, Israeli providers.
- **Invoice Management**: Manual/automatic, itemized, tax calculation, Hebrew PDF, email.
- **Receipt Management**: Automatic/manual, Hebrew PDF with RTL.
- **Provider Configuration**: Multi-tenant Email, SMS, Payment setup.
- **Subscriber Management**: Backend for subscriber lists.
- **Super Admin Management**: Full control over subscription plans, quotas, account status, and customer data across the platform.
- **Health Monitoring**: System health checks and logging.
- **Participants View**: Manage event participants.

### System Design Choices
- **Database Strategy**: Hybrid PostgreSQL (users/subscribers) and MongoDB Atlas (events, customers, analytics, etc.).
- **Multi-Tenant Architecture**: Isolated data per business, Super Admin override.
- **Access Control**: FREE (limited), PREMIUM (advanced), Super Admin (system-wide).
- **Business Model**: Freemium (200-customer limit), Tranzila Affiliate Model (direct payments).
- **Modularity**: Structured backend (models, routes, services) and frontend (pages, components, contexts).
- **Development Setup**: Single `fullstack` workflow with Vite proxy (bash start-dev.sh).
- **Production Deployment**: `npm run build` (Vite to `dist/`), `npm start` (serves API and static files from `dist/`), target Reserved VM on port 5000.

## External Dependencies

- **Databases**: PostgreSQL (Neon), MongoDB Atlas, Redis.
- **Google Calendar Integration**: OAuth 2.0.
- **Object Storage**: Replit Object Storage.
- **AI Integration**: Replit AI Integrations (OpenAI GPT-4o-mini).
- **Communication Services**: Nodemailer, SendGrid, Twilio.
- **Payment Gateways**: Cardcom, Meshulam (GROW), Tranzila.
- **Accounting Software**: Green Invoice, iCount.
- **Security & Utilities**: JWT, Winston, Helmet, CORS, Mongoose, pg, PDFKit, Bcrypt, Joi.
- **Frontend Libraries**: React, Vite, Tailwind CSS, React Router, Axios.
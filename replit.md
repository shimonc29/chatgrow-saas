# ChatGrow - מערכת SaaS לניהול קליניקות למאמנים, מטפלים ויועצים

## Overview
ChatGrow is a multi-tenant SaaS platform for coaches, therapists, and consultants, offering a freemium model with a 200-customer limit. It provides a React 19 admin dashboard with Hebrew RTL, Google Calendar integration, Object Storage, a landing page builder, an AI Performance Coach, Weekly Strategic AI Reports with Redis caching, and a Super Admin panel. The platform aims to be an all-in-one solution for managing client relationships, appointments, payments, and business growth tailored for the coaching/therapy/consulting market.

## User Preferences
I want iterative development.
Ask before making major changes.
I prefer detailed explanations.

## System Architecture
ChatGrow uses a Node.js/Express.js backend with a microservices-like approach and a React 19 SPA frontend built with Vite and Tailwind CSS v3, featuring full Hebrew RTL support.

### UI/UX Decisions
- **Frontend**: React 19 with Vite, Tailwind CSS v3 (RTL), Chakra UI v2.
- **Design Theme**: Clean, professional light blue color scheme (gray.50 backgrounds, white cards, gray text hierarchy, brand.500/600 blue).
- **Modular Components**: Sidebar, MainLayout, PrivateRoute.
- **Marketing Home Page**: Public marketing page targeting coaches/therapists/consultants with sticky nav, hero section, problem/solution, features, pricing, FAQ, and CTAs.
- **Landing Page Builder**: Template-based with 5 designs, live preview, customizable content/styling, analytics, color schemes, Google Fonts, CTA styles, MediaPicker integration.
- **Financial UI**: Unified UI for invoices/receipts with manual creation, PDF generation, and email delivery.
- **Public Event Registration**: Teal-light design.
- **Availability Calendar**: Google Calendar connection management with premium gating.
- **Interactive Calendar Modals**: AppointmentModal, BlockTimeModal, ItemDetailsModal for quick creation, time blocking, and viewing/managing calendar items.

### Technical Implementations
- **Frontend Stack**: React 19, Vite, Tailwind CSS v3, React Router v6, Axios, LocalStorage.
- **Authentication**: JWT, AuthContext, Protected Routes.
- **Freemium Model**: 200-customer limit enforced, premium features gated.
- **Multi-Tenant Provider System**: `ProviderSettings` for per-business Email (SendGrid/SMTP), SMS (Twilio), and Payment (Cardcom/GROW/Tranzila) configuration.
- **Notifications**: `NotificationService` for Email/SMS with provider swapping and templates.
- **Payments & Invoicing**: `PaymentService` and `InvoiceService` for Israeli providers, Hebrew PDF generation.
- **Receipt System**: `ReceiptService` for automatic/manual Hebrew PDF receipts with RTL.
- **CRON Automation**: `CronService` for scheduled tasks.
- **Queue System**: In-memory queue with basic retry logic.
- **Security**: JWT, bcrypt, rate limiting, Helmet, CORS, Joi validation.
- **Customer Auto-Creation**: Creates/updates customer records from public registrations.
- **AI Performance Coach**: Premium-only feature using OpenAI GPT-4o-mini for session optimization.
- **Weekly Strategic AI Reports**: Premium-only automated reports using OpenAI GPT-4o-mini with Zod validation and multi-tenant Redis caching.
- **Centralized Media Library**: Replit Object Storage integration for image management, Media Model, Admin UI, and MediaPicker component.
- **Super Admin Panel**: Restricted panel for platform owners to manage subscriptions, quotas, and customer data.
- **Growth Module (GET-KEEP-GROW Model)**: Business intelligence system for acquisition (tracking, AI insights), retention (RFM analysis, churn prediction), and expansion (upselling, cross-selling with 5 detection algorithms).
- **Lead Source Tracking System**: Comprehensive attribution tracking via `sourceKey`, UTM parameters, and `referralCode` stored in customer/registration/appointment models.
- **Interactive Calendar System**: Full-featured calendar interface with dual-mode (appointment booking / time blocking), modal-based interactions, and aggregated view of Appointments, Events, Availability blocks, and Google Calendar events.
- **Public Appointment Booking System**: Customer-facing booking page with service catalog, availability display, automatic customer creation, payment processing, and source tracking.

### Feature Specifications
- **Management**: CRUD for Customers, Events, Appointments, Payments, Invoices, Receipts.
- **Dashboard**: Statistics and quick actions.
- **Payment Management**: Multi-currency, Israeli providers.
- **Invoice Management**: Manual/automatic, itemized, tax calculation, Hebrew PDF, email.
- **Receipt Management**: Automatic/manual, Hebrew PDF with RTL.
- **Provider Configuration**: Multi-tenant Email, SMS, Payment setup.
- **Subscriber Management**: Backend for subscriber lists.
- **Super Admin Management**: Full control over subscription plans, quotas, account status, and customer data.
- **Health Monitoring**: System health checks and logging.
- **Participants View**: Manage event participants.

### System Design Choices
- **Database Strategy**: Hybrid PostgreSQL (users/subscribers) and MongoDB Atlas (events, customers, analytics).
- **Multi-Tenant Architecture**: Isolated data per business, Super Admin override.
- **Access Control**: FREE (limited), PREMIUM (advanced), Super Admin (system-wide).
- **Business Model**: Freemium (200-customer limit), Tranzila Affiliate Model (direct payments).
- **Modularity**: Structured backend (models, routes, services) and frontend (pages, components, contexts).
- **Development Setup**: Single `fullstack` workflow with Vite proxy.
- **Production Deployment**: Serves API and static files from `dist/` on port 5000.

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
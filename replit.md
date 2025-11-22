# ChatGrow - מערכת SaaS לניהול קליניקות למאמנים, מטפלים ויועצים

## Overview

ChatGrow is a multi-tenant SaaS platform specifically designed for coaches, therapists, and consultants (מאמנים, מטפלים ויועצים), operating on a freemium model with a 200-customer limit for free users. The platform is positioned as a niche product for appointment-based businesses in the coaching, therapy, and consulting sectors. It offers a React 19 admin dashboard with Hebrew RTL, Google Calendar integration, Object Storage, a landing page builder, an AI Performance Coach for session optimization, Weekly Strategic AI Reports with Redis caching, and a Super Admin panel for analytics and subscription management. The platform aims to be an all-in-one solution for managing client relationships, appointments, payments, and business growth specifically tailored for the coaching/therapy/consulting market.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.

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
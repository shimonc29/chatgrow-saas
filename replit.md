# ChatGrow - מערכת SaaS לניהול עסקים קטנים-בינוניים

## Overview

ChatGrow is a multi-tenant SaaS platform designed for managing small-to-medium businesses, operating on a freemium model with a 200-customer limit for free users. It incorporates marketplace-style payment splitting, where the platform takes a 5% fee. Key features include a React 19 admin dashboard with Hebrew RTL support, Google Calendar integration, Object Storage, a landing page builder, a Super Admin panel for analytics, and comprehensive subscription management. The platform aims to be an all-in-one solution for business growth and customer relationship management in the SMB SaaS market.

## User Preferences

I want iterative development.
Ask before making major changes.
I prefer detailed explanations.

## System Architecture

ChatGrow utilizes a Node.js and Express.js backend with a microservices-like approach, and a React 19 SPA frontend built with Vite and Tailwind CSS v3, featuring full Hebrew RTL support.

### UI/UX Decisions
- **Frontend Framework**: React 19 with Vite.
- **Styling**: Tailwind CSS v3 with full RTL.
- **Design Theme**: Clean, professional teal-light color scheme.
- **Key Admin Pages**: Payment Onboarding, Subscription Management, Platform Fees Dashboard (Super Admin only).
- **Color Palette**: BG Light (#F8F9FA), BG Card (#FFFFFF), Accent Teal (#00798C), Accent Hover (#035368), Text Primary (#212529), Text Secondary (#6C757D).
- **Logo**: Crown icon (👑).
- **Components**: Modular layout using Sidebar, MainLayout, and PrivateRoute.
- **Marketing Home Page**: Public marketing page with a clean teal-light design, sticky navigation, hero section, statistics, benefits, features, testimonials, and CTAs.
- **Landing Page Builder**: Template-based system with 5 pre-designed templates, live preview, and customizable content/styling, including analytics. Image upload integrated via ImageUploader component for Hero, About, and SEO OG images.
- **Financial Management UI**: Unified UI for managing invoices and receipts with manual creation, PDF generation, and email delivery.

### Technical Implementations
- **Frontend Stack**: React 19, Vite, Tailwind CSS v3, React Router v6, Axios, LocalStorage.
- **Authentication**: JWT for security, AuthContext, Protected Routes.
- **Freemium Model**: Enforced 200-customer limit for FREE users via middleware; premium features (Google Calendar, SMS, reports) gated for TRIAL/ACTIVE subscribers.
- **Marketplace Payments**: 95%/5% split logic with Cardcom/GROW integration; 5% platform fee applied when `user.paymentProviderId` exists. Platform fees are automated monthly via Green Invoice/iCount.
- **Multi-Tenant Provider System**: `ProviderSettings` model allows per-business configuration of Email (SendGrid/SMTP), SMS (Twilio), and Payment (Cardcom/GROW) providers.
- **Notifications**: `NotificationService` for Email and SMS with provider-swapping, templates, and delivery tracking.
- **Payments & Invoicing**: `PaymentService` and `InvoiceService` support Israeli providers (Cardcom, GROW), generate Hebrew PDF invoices, and automate workflows.
- **Receipt System**: `ReceiptService` for automatic and manual Hebrew PDF receipt generation with RTL support.
- **CRON Automation**: `CronService` (node-cron) handles scheduled tasks like reminders, payments, reports, and platform fee invoicing.
- **Queue System**: In-memory queue with basic retry logic.
- **Security**: JWT, bcrypt, rate limiting, Helmet, CORS, Joi validation.
- **Public API Routes**: Secure, unauthenticated endpoints for public event registration and appointment booking.
- **Customer Auto-Creation**: Creates/updates customer records from public registrations.
- **Full CRUD Functionality**: Comprehensive operations for all administrative entities.
- **Image Upload System**: Replit Object Storage integration for landing page images via ImageUploader component. Supports Hero background, About section image, and SEO Open Graph images.
- **Super Admin Panel**: Restricted panel for platform owner (via `SUPER_ADMIN_EMAILS`) displaying system-wide statistics and subscriber analytics with full management capabilities:
  - **Subscription Management**: Update subscription status (FREE/TRIAL/ACTIVE), modify customer quotas, suspend/activate accounts, delete subscribers
  - **Customer Management**: Add customers manually to any business, delete customers across businesses, transfer customers between businesses
  - **Platform Fees**: Track 5% marketplace fees, view onboarded businesses, monthly/yearly revenue analytics

### Feature Specifications
- **Management**: CRUD for Customers, Events, Appointments, Payments, Invoices, Receipts.
- **Dashboard**: Overview of statistics and quick actions.
- **Payment Management**: Multi-currency, various payment methods, integration with Israeli providers.
- **Invoice Management**: Manual/automatic generation, itemized billing, tax calculation, Hebrew PDF, email delivery.
- **Receipt Management**: Automatic/manual generation, Hebrew PDF with RTL.
- **Provider Configuration**: Multi-tenant Email, SMS, Payment provider setup.
- **Subscriber Management**: Backend for subscriber lists.
- **Super Admin Management**: Comprehensive subscriber and customer management:
  - Upgrade/downgrade subscription plans (FREE/TRIAL/ACTIVE)
  - Modify customer quotas (200 default for FREE, unlimited for ACTIVE)
  - Suspend/activate accounts
  - Delete subscribers with cascade deletion of all related data
  - Add customers manually to specific businesses
  - Delete customers from any business
  - Transfer customers between businesses
  - View all customers across the platform
- **Health Monitoring**: System health checks and log retrieval.
- **Participants View**: View and manage event participants.

### System Design Choices
- **Database Strategy**: Hybrid with PostgreSQL (users/subscribers) and MongoDB Atlas (events, customers, appointments, payments, invoices, analytics, WhatsApp).
- **Multi-Tenant Architecture**: Isolated data per business client, with Super Admin system-wide access.
- **Access Control**: Three tiers: FREE (200 customer limit, basic), PREMIUM (unlimited customers, advanced features), Super Admin (system-wide access).
- **Business Model**: Freemium (200-customer limit), Marketplace Revenue (5% platform fee), automated platform fee billing.
- **Modularity**: Structured backend (models, routes, services) and frontend (pages, components, contexts).
- **Development Setup**: Single `fullstack` workflow with Vite proxy.

## External Dependencies

- **Databases**: PostgreSQL (Neon), MongoDB Atlas, Redis (Optional).
- **Google Calendar Integration**: OAuth 2.0 (requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
- **Object Storage**: Replit Object Storage (requires `PRIVATE_OBJECT_DIR`).
- **Super Admin Access Control**: `SUPER_ADMIN_EMAILS` environment variable.
- **Communication Services**: Nodemailer, SendGrid, Twilio.
- **Payment Gateways**: Cardcom, Meshulam (GROW).
- **Accounting Software Integration**: Green Invoice, iCount.
- **Security & Utilities**: JWT, Winston, Helmet, CORS, Mongoose, pg, PDFKit, Bcrypt, Joi.
- **Frontend Libraries**: React, Vite, Tailwind CSS, React Router, Axios.
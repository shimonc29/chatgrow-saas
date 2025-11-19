# ChatGrow - מערכת SaaS לניהול עסקים קטנים-בינוניים

## Overview

ChatGrow is a multi-tenant SaaS platform designed for managing small-to-medium businesses, operating on a freemium model with a 200-customer limit for free users. It incorporates marketplace-style payment splitting, where the platform takes a 5% fee. Key features include a React 19 admin dashboard with Hebrew RTL support, Google Calendar integration, Object Storage, a landing page builder, AI Performance Coach for event optimization, Weekly Strategic AI Reports with multi-tenant Redis caching, a Super Admin panel for analytics, and comprehensive subscription management. The platform aims to be an all-in-one solution for business growth and customer relationship management in the SMB SaaS market.

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
- **Key Admin Pages**: Payment Onboarding (Tranzila only - registration request form), Subscription Management, Platform Fees Dashboard (Super Admin only).
- **Color Palette**: BG Light (#F8F9FA), BG Card (#FFFFFF), Accent Teal (#00798C), Accent Hover (#035368), Text Primary (#212529), Text Secondary (#6C757D).
- **Logo**: Crown icon (👑).
- **Components**: Modular layout using Sidebar, MainLayout, and PrivateRoute.
- **Marketing Home Page**: Public marketing page with a clean teal-light design, sticky navigation, hero section, statistics, benefits, features, testimonials, and CTAs.
- **Landing Page Builder**: Template-based system with 5 pre-designed templates, live preview, and customizable content/styling, including analytics. Enhanced design tools include:
  - **Pre-made Color Schemes**: 8 professional color palettes (Professional, Fresh, Bold, Elegant, Calm, Sunset, Ocean, Forest)
  - **Hebrew Fonts**: 6 Google Fonts options (Heebo, Assistant, Rubik, Varela Round, Alef, Open Sans)
  - **Button Styles**: 5 CTA button styles (rounded-full, rounded-lg, rounded-none, shadow, gradient)
  - **Image Selection**: MediaPicker integration for Hero, About, and SEO OG images
  - **Duplicate Functionality**: One-click page cloning for faster workflow
- **Financial Management UI**: Unified UI for managing invoices and receipts with manual creation, PDF generation, and email delivery.
- **Public Event Registration**: Clean teal-light design for public event registration pages with clear 403 error handling and user-friendly messaging for inactive/unpublished events.
- **Availability Calendar UI**: Integrated Google Calendar connection management with premium gating, status display, and clear upgrade prompts for FREE users.

### Technical Implementations
- **Frontend Stack**: React 19, Vite, Tailwind CSS v3, React Router v6, Axios, LocalStorage.
- **Authentication**: JWT for security, AuthContext, Protected Routes.
- **Freemium Model**: Enforced 200-customer limit for FREE users via middleware; premium features (Google Calendar, SMS, reports) gated for TRIAL/ACTIVE subscribers.
- **Marketplace Payments**: 95%/5% split logic with Cardcom/GROW integration; 5% platform fee applied when `user.paymentProviderId` exists. Platform fees are automated monthly via Green Invoice/iCount.
- **Tranzila Integration**: Exclusive payment provider model where providers submit registration requests through the platform. After manual approval and terminal setup, providers receive 100% of payments directly without platform fee splitting. Registration requests are saved in `user.profile.tranzilaRequest` and processed manually by the platform team.
- **Multi-Tenant Provider System**: `ProviderSettings` model allows per-business configuration of Email (SendGrid/SMTP), SMS (Twilio), and Payment (Cardcom/GROW/Tranzila) providers.
- **Notifications**: `NotificationService` for Email and SMS with provider-swapping, templates, and delivery tracking.
- **Payments & Invoicing**: `PaymentService` and `InvoiceService` support Israeli providers (Cardcom, GROW, Tranzila), generate Hebrew PDF invoices, and automate workflows.
- **Receipt System**: `ReceiptService` for automatic and manual Hebrew PDF receipt generation with RTL support.
- **CRON Automation**: `CronService` (node-cron) handles scheduled tasks like reminders, payments, reports, and platform fee invoicing.
- **Queue System**: In-memory queue with basic retry logic.
- **Security**: JWT, bcrypt, rate limiting, Helmet, CORS, Joi validation.
- **Public API Routes**: Secure, unauthenticated endpoints for public event registration and appointment booking.
- **Customer Auto-Creation**: Creates/updates customer records from public registrations.
- **Full CRUD Functionality**: Comprehensive operations for all administrative entities.
- **AI Performance Coach**: Premium-only feature powered by OpenAI GPT-4o-mini via Replit AI Integrations. Analyzes historical event data (last 10 events + platform averages) to provide:
  - **Pricing Optimizer**: Data-driven recommendations for optimal ticket pricing
  - **Timing Optimizer**: Insights on best days/times for events based on attendance patterns
  - **Conversion Rate Optimizer**: Specific actionable suggestions to improve registration page performance
  - **Services**: `aiService.js` (OpenAI integration), `eventDataService.js` (analytics aggregation)
  - **Route**: `/api/events/:eventId/ai-insights` (protected by isPremium middleware)
  - **UI**: `AIInsightsCard.jsx` with premium gating (FREE users see upgrade prompt)
- **Weekly Strategic AI Reports**: Premium-only automated business intelligence system generating comprehensive weekly reports every Monday at 02:00 AM. Powered by OpenAI GPT-4o-mini with Zod schema validation and multi-tenant Redis caching:
  - **Pricing Recommendations**: Current pricing analysis with category-specific optimization suggestions and expected revenue impact
  - **Demand Forecast**: Weekly attendance trends by day, seasonal patterns analysis, and upcoming opportunities identification
  - **Key Risks**: Multi-category risk identification (financial, operational, competitive) with severity levels and mitigation strategies
  - **Architecture**: Multi-tenant data isolation (MongoDB businessId filtering, Redis tenant-scoped key prefixing), batch processing with concurrency limits (5 concurrent reports), graceful AI fallback on errors
  - **Services**: `strategicReportService.js` (AI generation with Zod validation), `dataBrokerService.js` (multi-source aggregation), `redisClient.js` (tenant-isolated caching)
  - **Model**: `StrategicReport.js` (MongoDB with indexed businessId, status tracking, AI metadata)
  - **Cron**: Weekly automation in `cronService.js` (Monday 02:00 AM) with distributed tenant processing
  - **Routes**: `/api/strategic-reports` (GET /latest, GET /:reportId, POST /generate, DELETE /cache) - all protected by authenticateToken + isPremium
  - **Caching**: 6-day Redis TTL per tenant, automatic cache invalidation on manual generation
  - **Security**: Strict tenant authorization validation, no cross-tenant data leakage, tenant key validation against injection
- **Centralized Media Library System**: Replit Object Storage integration with centralized media management. Features include:
  - **Media Model**: MongoDB-based media storage with metadata (filename, URL, size, type, tags, user reference)
  - **Media Library Page**: Admin UI for uploading, managing, and deleting images with search and filtering
  - **MediaPicker Component**: Reusable modal for selecting images from library across the platform
  - **Landing Page Integration**: MediaPicker used in landing page builder for Hero, About, and SEO OG images
  - **Upload System**: Multer-based file upload with Object Storage backend (/api/media routes)
- **Super Admin Panel**: Restricted panel for platform owner (via `SUPER_ADMIN_EMAILS`) displaying system-wide statistics and subscriber analytics with full management capabilities:
  - **Subscription Management**: Update subscription status (FREE/TRIAL/ACTIVE), modify customer quotas, suspend/activate accounts, delete subscribers
  - **Customer Management**: Add customers manually to any business, delete customers across businesses, transfer customers between businesses

### Feature Specifications
- **Management**: CRUD for Customers, Events, Appointments, Payments, Invoices, Receipts.
- **Dashboard**: Overview of statistics and quick actions.
- **Payment Management**: Multi-currency, various payment methods, integration with Israeli providers (Cardcom, GROW, Tranzila).
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
- **Business Model**: Freemium (200-customer limit), Affiliate Model (Tranzila - 100% direct payments to business owners).
- **Modularity**: Structured backend (models, routes, services) and frontend (pages, components, contexts).
- **Development Setup**: Single `fullstack` workflow with Vite proxy (bash start-dev.sh).
- **Production Deployment**: 
  - Build: `npm run build` (Vite builds frontend to `dist/`)
  - Run: `npm start` (NODE_ENV=production, serves both API and static files)
  - Backend serves static files from `dist/` when NODE_ENV=production
  - Deployment target: Reserved VM (vm)
  - Port: 5000 (automatically set by Replit in production)

## External Dependencies

- **Databases**: PostgreSQL (Neon), MongoDB Atlas, Redis (Optional).
- **Google Calendar Integration**: OAuth 2.0 (requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
- **Object Storage**: Replit Object Storage (requires `PRIVATE_OBJECT_DIR`).
- **Super Admin Access Control**: `SUPER_ADMIN_EMAILS` environment variable.
- **Replit AI Integrations**: Built-in OpenAI integration for AI Performance Coach (no API key required - billed to Replit credits).
- **Communication Services**: Nodemailer, SendGrid, Twilio.
- **Payment Gateways**: Cardcom, Meshulam (GROW), Tranzila (Affiliate Model - direct payments, no platform fee).
- **Accounting Software Integration**: Green Invoice, iCount.
- **Security & Utilities**: JWT, Winston, Helmet, CORS, Mongoose, pg, PDFKit, Bcrypt, Joi.
- **Frontend Libraries**: React, Vite, Tailwind CSS, React Router, Axios.
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
The system includes a provider dashboard with an HTML UI for service providers to manage their operations.

### Technical Implementations
- **Authentication**: JWT for secure user authentication.
- **Notifications**: A `NotificationService` handles automated Email (Nodemailer/SendGrid) and SMS (Twilio) notifications. This service uses a provider pattern for flexibility.
- **Payments & Invoicing**:
    - Uses a `PaymentService` and `InvoiceService` for managing transactions.
    - Supports multiple Israeli payment providers (Cardcom, Meshulam, Tranzila) through a flexible provider pattern.
    - Generates Hebrew PDF invoices using PDFKit.
    - Automates the payment-to-invoice-to-email workflow.
- **Queue System**: Currently uses an in-memory queue with basic queuing and retry logic, with an option to integrate Redis for persistence and enhanced capabilities.
- **Logging**: Implemented with Winston, providing console and file logging, daily rotation, and structured JSON logs.
- **Security**: Incorporates JWT authentication, password hashing (bcrypt), rate limiting, Helmet security headers, CORS protection, and input validation (Joi).

### Feature Specifications
- **Customer Management**: Tools for handling customer data.
- **Event Management**: Functionality for creating and managing events.
- **Appointment Scheduling**: System for booking and managing appointments.
- **Subscriber Management**: Capabilities for handling subscriber lists.
- **Health Monitoring**: Endpoints for checking system health and retrieving logs.

### System Design Choices
- **Database Strategy**: A hybrid approach using PostgreSQL for user and subscriber data, and MongoDB Atlas for event, customer, appointment, analytics, and WhatsApp connection data.
- **Modularity**: The project structure is organized into `models`, `routes`, `services`, `providers`, and `middleware` directories, promoting separation of concerns.

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
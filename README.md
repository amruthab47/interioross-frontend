# InteriorOS

<p align="center">
  <h2 align="center">Design. Build. Deliver.</h2>

  <p align="center">
    An AI-powered project management platform for interior design and construction firms.
  </p>
</p>

---

## Overview

InteriorOS is a modern full-stack platform that centralizes every aspect of an interior design and construction business into one application.

Instead of managing projects across spreadsheets, messaging apps, and disconnected software, InteriorOS provides a unified workspace for project management, client collaboration, finance, workforce management, AI-assisted snag detection, and real-time communication.

Built with React, Node.js, MongoDB, and AI integrations, the platform supports multiple user roles while providing a seamless experience across the entire project lifecycle.

---

# Application

## Landing Experience

<p align="center">
<img src="screenshots/readme/homepage.png" width="95%">
</p>

The landing page introduces InteriorOS through a modern animated interface inspired by premium SaaS products, highlighting the platform's vision of simplifying interior project management.

---

## Authentication

| Login |
|-------|
| <img src="screenshots/readme/login.png"> |

Secure authentication with role-based access for administrators, designers, supervisors, clients, and vendors.

---

## Business Dashboard

| Dashboard |
|-----------|
| <img src="screenshots/readme/dashboard.png"> |

The dashboard provides a real-time overview of:

- Active projects
- Revenue & expenses
- Attendance
- Pending invoices
- Project analytics
- Revenue trends
- Business insights

---

## Finance Management

| Finance |
|----------|
| <img src="screenshots/readme/finance.png"> |

InteriorOS includes a complete finance module featuring:

- Revenue tracking
- Expense management
- Payroll
- Quotations
- Purchase orders
- Budget vs Actual analysis
- Invoice management
- Payment tracking

---

## AI Construction Assistant

InteriorOS integrates AI to improve quality assurance during construction.

Features include:

- Construction snag detection
- Image analysis
- Automatic issue categorization
- AI-generated descriptions
- Severity estimation
- Inspection assistance

---

## Project Management

The platform supports the complete project lifecycle.

- Project creation
- Task management
- Attendance
- Calendar scheduling
- Timeline tracking
- Documentation
- Client collaboration
- Vendor coordination

---

## Collaboration

Designed for multiple stakeholders, InteriorOS enables seamless collaboration between:

- Administrators
- Designers
- Supervisors
- Clients
- Vendors

Every role has a dedicated dashboard with permissions tailored to its workflow.

---

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Socket.IO
- Cloudinary
- Razorpay
- Groq AI

---

## Folder Structure

```text
src/
├── api/
├── assets/
├── components/
├── context/
├── hooks/
├── pages/
├── socket/
├── styles/
└── utils/
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/amruthab47/interioross.git
```

Install dependencies

```bash
npm install
```

Configure environment variables

```env
VITE_API_URL=http://localhost:5000
VITE_GROQ_API_KEY=YOUR_KEY
```

Start the development server

```bash
npm run dev
```

---

## Backend Repository

The backend source code is available here:

https://github.com/amruthab47/interioross-backend

---

## Highlights

- AI-powered snag detection
- Multi-role authentication
- Real-time messaging
- Project lifecycle management
- Financial management
- Client collaboration
- Responsive interface
- Modern SaaS-inspired UI
- Interactive dashboards
- Intelligent workflow automation

---

## License

This project was developed for portfolio, educational, and demonstration purposes.

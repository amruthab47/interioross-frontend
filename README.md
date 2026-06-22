# InteriorOS Frontend

<p align="center">
  <img src="screenshots/readme/homepage.png" width="100%" alt="InteriorOS Landing Page">
</p>

<h3 align="center">Design. Build. Deliver.</h3>

<p align="center">
A modern React-based frontend for InteriorOS, an AI-powered project management platform designed for interior design firms and construction teams.
</p>

---

## Overview

InteriorOS Frontend is the client application for the InteriorOS platform. Built with React and Vite, it provides an intuitive, responsive, and role-based interface that enables administrators, designers, supervisors, clients, and vendors to manage every stage of an interior design project.

The application brings together project management, financial tracking, AI-assisted snag detection, collaboration, document management, and design workflows into a unified experience.

---

# Features

### Project Management

- Project Dashboard
- Task Management
- Timeline Tracking
- Attendance Management
- Calendar
- Document Management
- Site Gallery

### AI Assistant

- AI-powered construction snag detection
- Image upload interface
- AI issue analysis
- Automatic issue descriptions
- Severity classification

### Financial Management

- Revenue Dashboard
- Expense Tracking
- Quotations
- Purchase Orders
- Invoices
- Payments
- Payroll
- Financial Analytics

### Design Studio

- Interactive floor planning
- Room management
- Building layouts
- Material planning
- PDF export
- Client-ready design workflow

### Collaboration

- Real-time messaging
- Client collaboration
- Vendor management
- Notifications

### Multi-Role Experience

Dedicated interfaces for:

- Administrator
- Designer
- Supervisor
- Client
- Vendor

---

# Application Preview

## Landing Page

<p align="center">
<img src="screenshots/readme/homepage.png" width="100%">
</p>

The landing page introduces InteriorOS with a modern SaaS-inspired design, highlighting the platform's vision of simplifying project management for interior design firms.

---

## Login

<p align="center">
<img src="screenshots/readme/login.png" width="85%">
</p>

Secure authentication with role-based access for different users of the platform.

---

## Administrator Dashboard

<p align="center">
<img src="screenshots/readme/dashboard.png" width="100%">
</p>

The administrator dashboard provides an overview of:

- Active projects
- Revenue & expenses
- Team attendance
- Pending invoices
- Business analytics
- Performance metrics

---

## Design Studio

<p align="center">
<img src="screenshots/readme/design-studio.png" width="100%">
</p>

The interactive Design Studio enables designers to organize floor plans and collaborate throughout the design process.

Features include:

- Floor planning
- Room organization
- Building layouts
- Material planning
- PDF export
- Client sharing

---

## Finance Dashboard

<p align="center">
<img src="screenshots/readme/finance.png" width="100%">
</p>

A comprehensive finance module that helps manage:

- Revenue
- Expenses
- Budget vs Actual
- Payroll
- Invoices
- Quotations
- Payments

---

# Technology Stack

## Framework

- React 19
- Vite

## Styling

- Tailwind CSS
- CSS Modules

## Routing

- React Router DOM

## API Communication

- Axios

## Real-Time Communication

- Socket.IO Client

## Data Visualization

- Recharts

## Build Tools

- ESLint
- PostCSS

---

# Project Structure

```text
src/
├── api/
├── assets/
├── components/
├── context/
├── data/
├── hooks/
├── pages/
├── socket/
├── styles/
└── utils/

public/
screenshots/
```

---

# Getting Started

## Clone the repository

```bash
git clone https://github.com/amruthab47/interioross.git
```

## Install dependencies

```bash
npm install
```

## Configure Environment Variables

Create a `.env` file in the project root.

```env
VITE_API_URL=http://localhost:5000
```

Update the API URL if your backend is hosted elsewhere.

---

## Run the development server

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

# Backend

The frontend communicates with a separate Node.js backend.

Backend Repository:

**https://github.com/amruthab47/interioross-backend**

Please set up and run the backend before starting the frontend.

---

# Highlights

- Modern responsive UI
- AI-assisted snag detection workflow
- Interactive Design Studio
- Multi-role dashboards
- Financial analytics
- Real-time messaging
- Role-based navigation
- Clean and scalable React architecture
- REST API integration
- Responsive layouts for desktop and tablet



# License

This project was developed for educational, portfolio, and demonstration purposes.

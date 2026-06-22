# InteriorOSS — Frontend

## Overview

InteriorOSS is a modern, AI-powered construction and interior project management platform designed to streamline collaboration between administrators, supervisors, designers, clients, and vendors.

The application combines project management, communication, financial tracking, AI-assisted snag detection, document management, and design collaboration into a single web platform.

This repository contains the React + Vite frontend application.

---

## Features

### Multi-Role Dashboard

* Administrator Dashboard
* Supervisor Dashboard
* Designer Dashboard
* Client Dashboard

Each role has dedicated pages, permissions, and workflows tailored to their responsibilities.

---

### Project Management

* Create and manage projects
* Project timelines
* Task tracking
* Progress monitoring
* Team assignment

---

### AI Snag Detection

* Upload construction site photographs
* AI-assisted defect analysis
* Automatic snag categorization
* Suggested issue descriptions
* Streamlined snag reporting workflow

---

### Design Collaboration

* Client feedback
* Design approvals
* Collaborative review
* Material selection
* Marketplace integration

---

### Financial Management

* Budget overview
* Project finance tracking
* Payroll management
* Purchase orders
* Vendor quotations

---

### Communication

* Real-time chat
* Notifications
* Team collaboration
* Client communication

---

### Additional Modules

* Calendar
* Attendance
* Reports
* Documents
* Vendor Management
* Client Management
* Analytics

---

## Tech Stack

* React
* Vite
* JavaScript
* Tailwind CSS
* Socket.IO Client
* REST APIs

---

## Project Structure

```
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

## Getting Started

### Clone

```bash
git clone https://github.com/amruthab47/interioross.git
cd interioross
```

### Install

```bash
npm install
```

### Configure Environment

Create a `.env` file in the project root.

Example:

```env
VITE_API_URL=http://localhost:5000
VITE_GROQ_API_KEY=your_api_key
```

> Replace the values with your own configuration.

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## Backend

The backend for this project is available here:

**https://github.com/amruthab47/interioross-backend**

---

## Screenshots

The repository includes screenshots demonstrating:

* Landing page
* Authentication
* Admin Dashboard
* Designer Workspace
* Client Portal
* AI Snag Detection
* Finance
* Chat
* Reports
* Calendar
* Project Management

---

## Disclaimer

This project was developed as a full-stack demonstration of modern project management software for the interior design and construction industry.

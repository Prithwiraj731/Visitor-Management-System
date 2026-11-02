# 🏢 Visitor Management System (VMS)

A comprehensive, full-stack Visitor Management System designed to streamline visitor registration, tracking, and security operations for organizations of all sizes. Built with modern web technologies, VMS provides real-time visitor monitoring, role-based access control, and detailed analytics to enhance facility security and visitor experience.

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## ✨ Feature Highlights

- **Visitor Pre-Registration** — Hosts can pre-register visitors with expected arrival times and purpose of visit
- **Real-Time Check-In / Check-Out** — Guards can process visitor arrivals and departures instantly
- **Badge Generation** — Automatic visitor badge creation with QR codes for quick identification
- **Role-Based Access Control** — Distinct dashboards and permissions for Admins, Guards, and Hosts
- **Visitor Analytics & Reporting** — Interactive charts and exportable reports on visitor traffic patterns
- **Multi-Location Support** — Manage visitors across multiple buildings or campuses
- **Notification System** — Email and in-app notifications for hosts when their visitors arrive
- **Blocklist Management** — Maintain a blocklist of denied visitors for enhanced security
- **Audit Trail** — Complete, immutable log of all visitor activities and system actions
- **Responsive Design** — Fully optimized for desktop, tablet, and kiosk displays

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20.x or higher
- **PostgreSQL** v16 or higher
- **npm** v10.x or higher (or **yarn**)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/visitor-management-system.git
cd visitor-management-system
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set Up PostgreSQL Database

```sql
-- Connect to PostgreSQL and create the database
CREATE DATABASE vms_db;
CREATE USER vms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE vms_db TO vms_user;
```

### 4. Configure Environment Variables

```bash
# From the project root
cp .env.example server/.env

# Edit server/.env with your actual database credentials and secrets
```

### 5. Run Migrations and Seeders

```bash
cd server

# Run database migrations
npm run db:migrate

# Seed initial data (admin user, default settings)
npm run db:seed
```

### 6. Start Development Servers

```bash
# Start the backend server (from /server)
npm run dev

# In a new terminal, start the frontend (from /client)
cd client
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api/v1

---

## 📜 Available Scripts

### Server (`/server`)

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload (nodemon) |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint source files with ESLint |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:migrate:undo` | Rollback the last migration |
| `npm run db:seed` | Seed the database with initial data |
| `npm run db:reset` | Drop, recreate, migrate, and seed the database |

### Client (`/client`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint source files with ESLint |
| `npm test` | Run test suite with Vitest |

---

## 📁 Project Structure

```
VMS/
├── client/                     # React frontend (Vite)
│   ├── public/                 # Static assets
│   └── src/
│       ├── assets/             # Images, icons, fonts
│       ├── components/
│       │   ├── common/         # Reusable UI components (Button, Modal, Table, etc.)
│       │   ├── layout/         # Layout components (Header, Sidebar, Footer)
│       │   ├── dashboard/      # Dashboard widgets and charts
│       │   ├── visitors/       # Visitor-related components
│       │   ├── guards/         # Guard-specific components
│       │   └── admin/          # Admin panel components
│       ├── pages/              # Page-level components / route views
│       ├── hooks/              # Custom React hooks
│       ├── context/            # React Context providers
│       ├── services/           # API service modules (axios instances)
│       ├── utils/              # Helper / utility functions
│       ├── constants/          # App-wide constants and enums
│       └── styles/             # Global styles, Tailwind config overrides
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── config/             # Database, auth, app configuration
│   │   ├── controllers/        # Route handler / controller functions
│   │   ├── middleware/         # Express middleware (auth, validation, error handling)
│   │   ├── models/             # Sequelize / database models
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic services
│   │   ├── utils/              # Server-side utility functions
│   │   └── validators/         # Request validation schemas (Joi / Zod)
│   ├── migrations/             # Database migration files
│   └── seeders/                # Database seed files
│
├── docs/                       # Project documentation
│   ├── API_DESIGN.md           # Complete API reference
│   ├── DATABASE_SCHEMA.md      # Database schema and ERD
│   ├── ARCHITECTURE.md         # System architecture overview
│   └── SECURITY.md             # Security practices documentation
│
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 📖 API Documentation

Full API reference with request/response examples, authentication flows, and error codes is available in:

📄 **[docs/API_DESIGN.md](docs/API_DESIGN.md)**

### Quick API Overview

| Resource | Endpoint | Description |
|---|---|---|
| Auth | `POST /api/v1/auth/login` | User authentication |
| Visitors | `GET /api/v1/visitors` | List / search visitors |
| Check-In | `POST /api/v1/visits/check-in` | Process visitor check-in |
| Check-Out | `PATCH /api/v1/visits/:id/check-out` | Process visitor check-out |
| Users | `GET /api/v1/users` | Manage system users (Admin) |
| Reports | `GET /api/v1/reports/summary` | Visitor analytics & reports |

---

## 🔒 Security Practices

- **JWT Authentication** with short-lived access tokens (15 min) and secure refresh tokens (7 days)
- **Password Hashing** using bcrypt with configurable salt rounds
- **Rate Limiting** on authentication endpoints to prevent brute-force attacks
- **Account Lockout** after configurable failed login attempts
- **Input Validation** on all API endpoints using Joi / Zod schemas
- **SQL Injection Prevention** via parameterized queries and ORM usage
- **XSS Protection** through content sanitization and security headers (Helmet.js)
- **CORS Configuration** restricted to allowed origins only
- **HTTPS Enforcement** in production environments
- **Audit Logging** of all sensitive operations with IP tracking

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Visitor Management System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Contributors

| Name | Role | GitHub |
|---|---|---|
| Project Lead | Architecture & Backend | [@lead](https://github.com/lead) |
| Frontend Dev | UI/UX & React | [@frontend](https://github.com/frontend) |
| Backend Dev | API & Database | [@backend](https://github.com/backend) |
| QA Engineer | Testing & Security | [@qa](https://github.com/qa) |

Want to contribute? Please read our [Contributing Guidelines](CONTRIBUTING.md) and submit a pull request.

---

<p align="center">
  Built with ❤️ for safer, smarter visitor management
</p>

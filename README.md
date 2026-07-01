# HostelEase (Online Hostel Allocation System)

HostelEase is an automated, secure, role-based housing management portal designed for higher education institutions. This system streamlines room bookings, maintains real-time physical occupancy tracking, matches student gender allocations, processes simulated card payments, and displays high-fidelity visual statistics.

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [Project Documentation Links](#-project-documentation-links)
3. [Technology Stack](#-technology-stack)
4. [File & Directory Structure](#-file--directory-structure)
5. [Database Architecture](#-database-architecture)
6. [Getting Started](#-getting-started)
7. [System Development Scripts](#-system-development-scripts)

---

## 🌟 Core Features

- **Role-Based Authentication (RBAC):** Restricts page routes and server-side actions depending on authorization credentials (Students, Hostel Admins, and System Admins).
- **Interactive Bento Dashboard:** Serves real-time analytical grids utilizing `recharts` for visual breakdowns of housing statuses and university revenue matrices.
- **Physical Room Management:** Dynamic status controls to set room capacities, update occupied beds, and manage maintenance states.
- **Gender-Policy Enforced Pipeline:** Automatically screens student profiles and filters eligible hostels (Male blocks, Female blocks, Unisex villas) to enforce university housing guidelines.
- **Simulated Payment Gateway:** Immersive card billing simulation that securely secures bed slots and completes allocations upon financial authorization.
- **Live Notifications and Audits:** Real-time personal alerts on active status changes and administrative comments.

---

## 📂 Project Documentation Links

This project contains high-fidelity design specifications written in compliance with academic final-year software engineering criteria:
- [Software Requirements Specification (SRS) - IEEE Std 830-1998](./docs/SRS.md)
- [MongoDB Database Design Specification](./docs/DATABASE_DESIGN.md)
- [UML Diagrams Specifications](./docs/UML_DIAGRAMS.md)
- [UI/UX Design System & Screen Specifications](./docs/UI_UX_DESIGN.md)

---

## 🛠️ Technology Stack

- **Frontend Core:** React (v19) configured with Vite (v6).
- **Styling Framework:** Tailwind CSS with modern, high-contrast, eye-safe midnight themes.
- **Backend Environment:** Node.js + Express.js API routers.
- **Visual Analytics:** `recharts` for interactive charts and `d3` for math interpolations.
- **Vector Iconography:** `lucide-react` with thin custom strokes.
- **Database Model:** Transactional local JSON Database Ledger simulating MongoDB document models with schema safety, single-field indices, and relational object referencing.

---

## 🗂️ File & Directory Structure

```
├── assets/                     # Physical asset templates
├── data/                       # JSON database ledger storage
│   └── db.json                 # Persistent local document database
├── docs/                       # Academic design and specification papers
│   ├── DATABASE_DESIGN.md      # Schema definitions, validations, and indexes
│   ├── SRS.md                  # Software Requirements Specification (IEEE)
│   ├── UI_UX_DESIGN.md         # Theme typography and screen metrics
│   └── UML_DIAGRAMS.md         # Use Case, Class, Activity, Sequence models
├── src/                        # Main React/Vite/Express codebase
│   ├── App.tsx                 # Client routing, layout core, and UI switcher
│   ├── api.ts                  # REST API communication client helper
│   ├── types.ts                # TypeScript data interfaces and metrics
│   ├── index.css               # Global tailwind styles & fonts import
│   ├── main.tsx                # React browser initialization file
│   ├── controllers/            # Express endpoint logics
│   │   ├── authController.ts   # Session logins and registrations
│   │   ├── hostelController.ts # Hostel and Room creations and list lookups
│   │   ├── applicationController.ts # Applications, approvals, and checkouts
│   │   └── statsController.ts  # System analytics aggregates and notifications
│   ├── db/
│   │   └── db.ts               # Transactional local document database driver
│   └── middleware/
│       └── authMiddleware.ts   # Session validation and RBAC guards
├── .env.example                # Template for server-side secret keys
├── .eslintrc.json              # Code quality checks
├── .gitignore                  # File exclusions patterns
├── .prettierrc                 # Unified code formatter styles
├── index.html                  # Core HTML5 visual entry canvas
├── package.json                # Project dependencies and operational scripts
├── server.ts                   # Main server entry and Vite integration file
├── tsconfig.json               # TypeScript compiler config
└── vite.config.ts              # Vite server and module path aliasing
```

---

## 🗄️ Database Architecture

HostelEase maps relationships through transactional document linking:
* **Users** (holds standard profile attributes, password hashes, and RBAC categories).
* **Hostels** (manages macro block details like location, type rules, and overall capacity).
* **Rooms** (contains details on individual room bed counts, pricing, and occupied slots).
* **Applications** (manages allocation progress, linked through `studentId` and `roomId` object references).
* **Notifications** (handles persistent personal system alerts).

Refer to [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) for detailed Mongoose schemas and compound indexes.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the latest stable version of Node.js (v18+) and npm installed.

### 2. Set Up Environment Variables
Copy `.env.example` to create a local `.env` configuration:
```bash
cp .env.example .env
```
Ensure required secrets (like `GEMINI_API_KEY`) are populated appropriately.

---

## 💻 System Development Scripts

These standard commands are declared in `package.json` to manage development and production lifecycles:

* **Start Development Mode:**
  ```bash
  npm run dev
  ```
  Runs the server-side Express runtime via `tsx`, mounting Vite middleware dynamically to serve frontend assets on port `3000`.

* **Build Production Assets:**
  ```bash
  npm run build
  ```
  Generates minified static React bundles into `/dist` and compiles `/server.ts` into a fast, unified CommonJS file (`/dist/server.cjs`) using `esbuild`.

* **Launch Production Server:**
  ```bash
  npm run start
  ```
  Launches the standalone compiled production server.

* **Run Syntactic Quality Audit:**
  ```bash
  npm run lint
  ```
  Performs complete strict TypeScript type validation checks.

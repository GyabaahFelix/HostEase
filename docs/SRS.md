# Software Requirements Specification (SRS)
## Project: HostelEase (Online Hostel Allocation System)
### Document Version: 1.0.0
### Date: July 1, 2026
### Standard: IEEE Std 830-1998

---

## 1. Introduction

### 1.1 Document Purpose
This Software Requirements Specification (SRS) document defines the comprehensive software requirements for **HostelEase (Design and Implementation of an Online Hostel Allocation System)**. This document serves as the single source of truth for engineering teams, university administrators, software developers, QA teams, and university lecturers grading this final-year software engineering project.

### 1.2 Project Scope
HostelEase is an automated, responsive, full-stack, secure, role-based platform designed to manage and streamline hostel operations within higher education institutions. The system replaces manual hostel allocation processes, which are prone to paper errors, queue bottlenecking, lack of gender enforcement, and inadequate reporting. 

HostelEase facilitates:
*   Real-time hostel and room availability tracking.
*   Secure student self-registration and profile management.
*   Automated, rule-based housing application submissions.
*   Administrator-guided room space allocation and status updates.
*   Secure simulated student payment/billing settlement to secure allocated spaces.
*   System analytics, notifications, and visual performance reporting.

### 1.3 Intended Audience
This document is structured for:
*   **Project Supervisors & University Lecturers:** For validation of software engineering best practices, design constraints, and academic project criteria.
*   **Engineering & Development Teams:** For implementation guidelines adhering strictly to the architectural constraints.
*   **System and Hostel Administrators:** To understand portal functionality and operational boundaries.

### 1.4 Definitions, Acronyms, and Abbreviations
*   **SRS:** Software Requirements Specification
*   **IEEE:** Institute of Electrical and Electronics Engineers
*   **MVC:** Model-View-Controller
*   **REST:** Representational State Transfer
*   **JWT:** JSON Web Token
*   **role-based access control (RBAC):** Restricting system access to authorized users based on designated privileges.
*   **Matric Number:** Matriculation number, a unique student identifier in universities.

---

## 2. Overall Description

### 2.1 Product Perspective
HostelEase is an independent, self-contained full-stack application operating with an integrated client-side single-page application (SPA) front-end built in React and a server-side API back-end built in Node.js/Express. It employs a file-based transactional ledger engine mimicking MongoDB collections to ensure instant previewing, persistence, and zero-configuration setups in sandboxed and deployed cloud environments.

### 2.2 Product Functions
The core capabilities of the system are grouped as follows:
*   **User Identity Management:** Registering students, logging in users, verifying session validity.
*   **Inventory Tracking:** Registering hostel blocks, designating gender rules (male, female, unisex), and setting capacities.
*   **Room Allocation Ledger:** Managing beds, tracking occupied slots, and setting room pricing tiers.
*   **Application Pipeline:** Submitting applications, matching gender rules, approving/rejecting requests, and assigning room numbers.
*   **Simulated Payment Terminal:** Settling balances online to secure bed spaces.
*   **System Diagnostics & Reporting:** Occupancy heatmaps, gender breakdown distributions, revenue tracking, and live audit notification feeds.

### 2.3 User Classes and Characteristics
The system supports three user roles, each with strict operational boundaries:
1.  **Student:**
    *   Can register profiles with their legal name, matriculation number, gender, and department.
    *   Can browse available hostels matching their gender profile.
    *   Can submit one active application per academic session.
    *   Can pay for approved allocations to lock in their bed slot.
    *   Can read personal notification alerts.
2.  **Hostel Administrator:**
    *   Can manage hostels (create, update description, image, location).
    *   Can configure rooms (set capacity, bed counts, status, pricing).
    *   Can review student application logs.
    *   Can allocate specific rooms and approve/reject requests.
    *   Can review occupancy status feeds.
3.  **System Administrator:**
    *   Holds superuser access over all configurations.
    *   Can inspect and override any hostel, room, or application state.
    *   Can view global analytics reports, financial ledger totals, and revenue metrics.

### 2.4 Design and Implementation Constraints
*   **Port Constraints:** The dev server must bind to host `0.0.0.0` and port `3000` for sandboxed cloud ingress routing.
*   **HMR Constraint:** Hot Module Replacement is disabled (`DISABLE_HMR=true`) inside the sandbox environment; the app's routing and states must be fully stable under full-page reloads.
*   **Dependency Constraints:** The application must utilize only pre-approved components (`lucide-react` for graphics, standard Tailwind for visual grids, native styling).

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
*   **Desktop-First Fluid Grid with Adaptive Mobile Framework:** The app is styled using a modern "Sophisticated Dark" editorial design featuring high-contrast slate and indigo accents, Georgia/Playfair display typography, and Inter/Plus Jakarta Sans reading lines.
*   **Response Panels:** Consistent visual status badges (e.g., green-glowing live markers, amber alerts, crimson tags for failed states).

#### 3.1.2 Software Interfaces
*   **RESTful APIs:** Serve JSON data structures.
*   **Persistence Layer:** Encapsulated local JSON tables with schema constraints on users, hostels, rooms, applications, and notifications.

---

### 3.2 Functional Requirements

#### 3.2.1 Module: Authentication (AUTH-F01)
*   **AUTH-F01-REQ1:** Students must register with name, email, username, matriculation number, gender, phone, and password.
*   **AUTH-F01-REQ2:** Passwords must be hashed using highly secure SHA-256 techniques on the server.
*   **AUTH-F01-REQ3:** The system must generate custom unique token keys upon login, which are stored in the client's `localStorage` for session persistence.
*   **AUTH-F01-REQ4:** The application must support a "Quick Account Switcher" for university grading panels to test different permission levels seamlessly.

#### 3.2.2 Module: Hostel & Room Management (HST-F02)
*   **HST-F02-REQ1:** Administrators can register a hostel block with capacity, location, gender category, and custom banner image.
*   **HST-F02-REQ2:** Administrators can register rooms under a hostel, setting bed counts, pricing tiers, and current operational status.
*   **HST-F02-REQ3:** The system must enforce that room capacities and occupied counts never violate physical limitations (e.g., occupied <= capacity).
*   **HST-F02-REQ4:** Prevents deletion of a hostel or room if it currently holds students who have paid for their rooms.

#### 3.2.3 Module: Application Pipeline (APP-F03)
*   **APP-F03-REQ1:** Students can select a hostel block and submit an application for an academic year.
*   **APP-F03-REQ2:** **Gender-Policy Guard:** Students can ONLY apply to hostels matching their registered gender profile (e.g., male students can only apply to Male or Unisex blocks).
*   **APP-F03-REQ3:** Students cannot submit multiple pending or approved requests for the same academic year.
*   **APP-F03-REQ4:** Administrators can inspect pending applications, choose a room from the target hostel, add administrative comments, and approve or reject the request.

#### 3.2.4 Module: Payments & Secure Settle (PAY-F04)
*   **PAY-F04-REQ1:** Upon approval of an application, the student's dashboard must prompt for card billing.
*   **PAY-F04-REQ2:** The student must complete payment details (card number, expiration, CVV).
*   **PAY-F04-REQ3:** Once submitted, the system marks the application as "paid", increments the room's occupied slot count, and updates its availability status.

#### 3.2.5 Module: Analytics & Diagnostics (ANA-F05)
*   **ANA-F05-REQ1:** Admin screens must display aggregated stats: Total Students, Hostel Count, Global Rooms, Pending Backlog, and Occupancy Rate.
*   **ANA-F05-REQ2:** Generate interactive bento-grid charts representing:
    *   **Capacity vs. Occupancy Rates** per hostel block.
    *   **Application Pipeline Distribution** (Pending vs. Approved vs. Rejected).
    *   **Gender-Categorized Registrations** for housing.
    *   **Institutional Revenue Matrices** based on paid room fees.

---

### 3.3 Non-Functional Requirements

#### 3.3.1 Security
*   **Encryption-at-Rest:** All user passwords hashed using server-side cryptography.
*   **Role Isolation:** Endpoints must reject requests if a user is not authorized. For example, trying to create hostels using student credentials must return `403 Forbidden`.
*   **No API Key Exposure:** Server-side logic must manage backend state, keeping client-side scripts free of credentials.

#### 3.3.2 Reliability & Fault Tolerance
*   **Zero-State Safety:** Form fields must prevent empty string entries.
*   **Session Longevity:** Auth sessions survive browser tab close, keeping state unless explicitly logged out.

#### 3.3.3 Usability
*   **Theme Continuity:** Strictly styled with a dark UI palette utilizing off-blacks (#0A0A0B), rich card outlines, and glowing typography to reflect the "Sophisticated Dark" design system.

---

## 4. Use Case Scenarios

### 4.1 Use Case 1: Student Hostel Allocation Process
*   **Actor:** Student (e.g., Jane Smith)
*   **Preconditions:** Student is authenticated and profile gender is defined.
*   **Main Flow:**
    1.  Student selects the "Apply Hostel" tab.
    2.  System presents only hostels whose gender matches the student's profile.
    3.  Student inputs comments and clicks "Apply".
    4.  System logs application as "pending" and alerts the administrators.
*   **Postconditions:** Application is lodged in Student Affairs dashboard for decision.

### 4.2 Use Case 2: Administrator Room Matching
*   **Actor:** Hostel Administrator
*   **Preconditions:** Active pending applications exist.
*   **Main Flow:**
    1.  Administrator selects the "Applications Desk" tab.
    2.  System displays pending entries with corresponding student gender.
    3.  Administrator selects "Review", views available matching rooms in that hostel block, selects a room, and clicks "Approve".
    4.  System updates application status and sends an alert to the student.
*   **Postconditions:** Space is reserved, awaiting student payment.

---

## 5. Technology Stack & Architectural Patterns
*   **Frontend Library:** React (v19) configured with Vite.
*   **Styling Engine:** Tailwind CSS with fluid grid layout parameters.
*   **Routing System:** Condition-driven, single-page state machine preventing broken client-side histories.
*   **Server Framework:** Node.js + Express.js.
*   **State Containers:** React Context + local component-level state variables.
*   **Documentation Format:** IEEE-compliant markdown documentation.

---

## 6. Project Assumptions & Future Enhancements
*   **Assumptions:** It is assumed that user authentication remains active for a 24-hour cycle or until local storage is manually purged.
*   **Future Enhancements:**
    1.  **Biometric Check-In System:** QR code integration for physical hostel access and room entry verification.
    2.  **Roommate Compatibility AI Engine:** Powered by Gemini models to match roommates based on study habits, sleep schedules, and interest profiles.
    3.  **Real-Time Live Chat:** Secure peer-to-peer messaging between roommates and hostel managers.

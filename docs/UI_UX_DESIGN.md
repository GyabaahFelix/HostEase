# UI/UX Design System & Screen Specifications
## Project: HostelEase (Online Hostel Allocation System)
### Document Version: 1.0.0
### Theme: Sophisticated Dark

This document specifies the exact design tokens, structural layouts, and interactive behavior rules for HostelEase, establishing a high-end, responsive, accessible, and editorial aesthetic.

---

## 1. Design System & Style Tokens

To avoid default layouts and "AI slop," HostelEase uses a **Sophisticated Dark** aesthetic. It blends editorial sophistication (serif headings, spacious negative space, thin borders) with functional precision (monospaced data grids, clear status rings).

### 1.1 Color Palette
The theme uses off-blacks, slate grays, and highly-saturated accent colors acting as glowing active indicators:

| Token Name | Hex Value | Tailwind Class Equivalent | Purpose / Application |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#0A0A0B` | `bg-[#0A0A0B]` | Main workspace backing |
| **Surface Card** | `#0F0F12` | `bg-[#0F0F12]` | Secondary panel backgrounds, dialog boards, modals |
| **Primary Accent** | `#6366F1` | `text-indigo-400` / `bg-indigo-600` | CTA buttons, active state markers, focused elements |
| **System Active** | `#10B981` | `text-green-400` / `bg-green-500/10` | "Live" indicators, completed payments, approved slots |
| **System Pending** | `#F59E0B` | `text-amber-400` / `bg-amber-500/10` | Under review applications, pending payment bills |
| **System Error** | `#EF4444` | `text-red-400` / `bg-red-500/10` | Full capacity, maintenance holds, rejected applications |
| **Text Primary** | `#FFFFFF` | `text-white` | Editorial titles, table headers, critical figures |
| **Text Secondary** | `#CBD5E1` | `text-slate-300` | Standard description paragraphs, subheaders |
| **Text Muted** | `#64748B` | `text-slate-500` | Labels, timestamps, supplementary captions |
| **Thin Border** | `rgba(255,255,255,0.05)` | `border-white/5` | Panel dividers, structural dividers, table row grids |

---

### 1.2 Typography
We combine a timeless literary serif with an elegant modern sans-serif and high-contrast monospaced font:

*   **Display Headings (H1, H2, H3, Hero Titles):** **Playfair Display** (Serif)
    *   *Usage:* `font-serif italic tracking-tight font-medium text-white`
    *   *Vibe:* Classic, institutional, trustworthy, and crafted.
*   **Body & UI Text (Inputs, Labels, Descriptions):** **Plus Jakarta Sans** or **Inter** (Sans-serif)
    *   *Usage:* `font-sans antialiased text-slate-300 tracking-normal`
    *   *Vibe:* Legible, clean, modern, and highly legible.
*   **System Codes, Ledger ID, Counters:** **JetBrains Mono** (Monospace)
    *   *Usage:* `font-mono text-xs uppercase text-slate-500`
    *   *Vibe:* Analytical, technical, precise.

---

### 1.3 Spacing & Layout Rhythm
Avoid uniform density across all panels. Rhythm is created using spacious structural gaps and compact utility clusters:
*   **Outer Page Margins:** `p-6 md:p-12` (provides breathing room on large screens)
*   **Grid Gaps:** `gap-6` or `gap-8` for layout grids
*   **Card Inner Padding:** `p-6` or `p-8` for visual containment
*   **Input & Button Padding:** `px-4 py-3` (respecting a 44px minimum touch target)

---

### 1.4 Interactive Component Library Styles

#### 1.4.1 Primary Buttons
*   **Base Style:** Rounded, medium-bold, uppercase track.
*   **Tailwind Class:** `bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/10 transition-all`
*   **Interaction Feedback:** Subtle hover scale up (`hover:-translate-y-0.5 hover:shadow-indigo-500/20`), active click compression.

#### 1.4.2 Secondary Outline Buttons
*   **Base Style:** Thin border, transparent backing.
*   **Tailwind Class:** `border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-xl bg-transparent transition-all`
*   **Interaction Feedback:** Border opacity glows brighter on mouse hover.

#### 1.4.3 Input Form Fields
*   **Base Style:** Deep charcoal fill with thin focus border transition.
*   **Tailwind Class:** `w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans`
*   **States:** Disabled inputs switch to low opacity (`opacity-50 cursor-not-allowed`).

#### 1.4.4 Card Container Containers
*   **Base Style:** Flat dark surfaces framed by microscopic borders.
*   **Tailwind Class:** `bg-[#0F0F12] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden`

#### 1.4.5 Table Structure
*   **Header Style:** `text-[10px] uppercase tracking-widest text-slate-500 bg-white/[0.01] px-6 py-4`
*   **Row Style:** `border-b border-white/5 hover:bg-white/[0.02] transition-colors`
*   **Cell Style:** `px-6 py-4 text-xs font-normal text-slate-300`

---

### 1.5 Icons (Lucide-React Usage Policy)
All iconography must utilize `lucide-react` icons. Maintain a standard stroke width of `1.75` for consistency:
*   `Building2`: Hostel blocks and physical infrastructure
*   `Layers`: Room divisions and bed availability tiers
*   `ClipboardList`: Housing application pipeline and desk review
*   `BarChart3`: Performance analytics and financial ledger tracking
*   `Bell`: System notifications, payment reminders, allocation status updates
*   `Shield`: RBAC classifications, secure session status tags
*   `CreditCard`: Checkout and payment transaction actions

---

## 2. Platform Page Specifications

### 2.1 Public Pages

#### 2.1.1 Landing / Portal Entry Page
*   **Purpose:** Welcomes visitors, outlines the three available portal segments, and hosts the login panel interface.
*   **Core UI Components:**
    *   **Hero Billboard:** Massive Playfair Display italic heading introducing HostelEase with subtitle: "University Housing Automation Suite."
    *   **Operational Live Feed (Status Banner):** Glowing marker showing "System Live" and "Current Session: 2025/2026".
    *   **Security Access Card:** Integrated login block containing email/password forms and registration routing buttons.
    *   **Bento Grid Introduction Blocks:** Highlight system values (Zero Paperwork, Instantly Secured Allocations, Verified Academic Credentials).
*   **User Interactions:**
    *   Toggle auth panels between Login and Student Registration modes.
    *   Input institutional credentials.
    *   Click "Authenticate Securely" button to process token validation.
*   **Responsive Behavior:** On desktop, splits screen horizontally (Billboard left, Security card right). On tablets and mobile, stacks vertically into a clean scrolling column, wrapping input inputs into full width.
*   **Accessibility & Contrast:**
    *   Passes WCAG AA standards (text color contrast is minimum 4.5:1 against the background).
    *   Supports keyboard navigation (`Tab` index moves smoothly from inputs to submit CTAs).
    *   Screen readers explicitly state form field instructions (labels linked via `htmlFor`).

---

### 2.2 Authentication & Demo Utility Pages

#### 2.2.1 Quick Switch Account Utility Panel (Grading & Testing Tool)
*   **Purpose:** Positioned at the footer or drawer, this panel allows grading lecturers, professors, and QA engineers to switch user roles instantly without manually registering accounts.
*   **Core UI Components:**
    *   **Quick Swap Tray:** Compact horizontal bar with four action buttons: `Student (Male)`, `Student (Female)`, `Hostel Admin`, and `System Admin`.
    *   **User Persona Card:** Briefly displays the currently loaded credentials (e.g., "Logged in as: Prof. Charles Xavier (System Admin)").
*   **User Interactions:**
    *   Clicking a persona logs out the active session, inserts the pre-seeded account token automatically, and reloads the respective workspace.
*   **Responsive Behavior:** Positioned fixed at the bottom of the screen. Hides on small mobile devices to avoid UI clutter, displaying only on medium and large tablet/desktop viewports.
*   **Accessibility Considerations:** Buttons contain aria labels explaining switch behavior.

---

### 2.3 Student Workspace Pages

#### 2.3.1 Student Dashboard (Main Hub)
*   **Purpose:** Consolidated profile overview showing the student's active application status and required actions.
*   **Core UI Components:**
    *   **Greetings Header:** Displays student name, matriculation number, and registered gender (Male/Female).
    *   **Active Allocation Status Card:** Displays application state (`Pending`, `Approved`, `Rejected`).
        *   If `Pending`: Displays an orange caution warning indicating the request is under review.
        *   If `Approved` (Unpaid): Displays a green success tag and a glowing **Pay Room Fees** button.
        *   If `Approved` (Paid): Displays a secure badge showing their assigned Room Number, price point, and Hostel block.
    *   **Academic Session Metric Cards:** Quick numbers representing total applications, current term (2025/2026), and gender category lock.
*   **User Interactions:**
    *   Clicking "Pay Room Fees" opens the Secure Checkout Drawer.
    *   Reviewing feedback from Student Affairs administrators.
*   **Responsive Behavior:** Grid adapts from 1 column on mobile to 3 columns on desktop. Text sizes scale down fluidly.
*   **Accessibility Considerations:** Screen readers announce state transitions clearly using semantic status labels.

#### 2.3.2 Apply for Housing Panel
*   **Purpose:** Allows students to submit a new allocation request.
*   **Core UI Components:**
    *   **Gender Guard Warning:** Top-docked notification panel reminding the student that they can only apply to hostels corresponding to their registered profile gender.
    *   **Allocation Selector:** Dropdown displaying eligible hostels, locations, description details, and vacancy stats.
    *   **Academic Year Selector:** Locked to "2025/2026" to prevent multi-year errors.
    *   **Special Request Input Box:** Text field for entering medical requirements (e.g., lower-bunk preference, accessibility needs).
*   **User Interactions:**
    *   Selecting a hostel dynamically updates card visuals displaying hostel location and capacity metrics.
    *   Clicking "Submit Application" records the request.
*   **Responsive Behavior:** Two-column split on desktop (form on left, target hostel highlights on right). Single column on mobile.
*   **Accessibility Considerations:** Dropdowns are fully keyboard traversable. Error validation states are announced out loud using standard web alerts.

#### 2.3.3 Secure Payment Checkout Drawer
*   **Purpose:** A secure checkout interface mimicking payment gateways (e.g., Paystack/Stripe) to let students pay room fees and finalize allocations.
*   **Core UI Components:**
    *   **Receipt Panel:** Displays room number, price per academic year, and transaction fees.
    *   **Credit Card Form:** Includes Card Number input, Expiry Date input, and secure CVV input.
    *   **SSL Secure Certificate Badge:** Subtle reassuring seal ("256-bit encrypted bank connection").
*   **User Interactions:**
    *   Input card details.
    *   Click "Secure Settle Payment" to execute transaction.
*   **Responsive Behavior:** Slides up as an immersive full-screen modal drawer on mobile, and standard overlay box on desktop.
*   **Accessibility Considerations:** Inputs restrict numeric inputs only where appropriate, supporting clear error labels for screen readers.

---

### 2.4 Administrative Workspace Pages

#### 2.4.1 General Analytics Desk (System Admin)
*   **Purpose:** Provides structural statistics, financial ledgers, and capacity metrics.
*   **Core UI Components:**
    *   **Macro Stats Cards:** Big, thin numerals showing:
        *   Total Registered Students
        *   Active Hostel blocks
        *   Physical rooms
        *   Bed Occupancy Rate percentage
    *   **Bento Grid Charts (Recharts Powered):**
        *   *Chart 1 (Bar):* Hostel Allocation Status (Capacity vs. Active Occupancy).
        *   *Chart 2 (Pie):* Application Pipeline Status Distribution (Pending, Approved, Rejected).
        *   *Chart 3 (Pie):* Gender distribution of student applicants.
        *   *Chart 4 (Area):* Institutional Revenue streams per Hostel block.
*   **User Interactions:**
    *   Hover over chart segments to display dynamic tooltip tags containing exact figures.
*   **Responsive Behavior:** Bento grid re-orders elements. Column count shifts from 1 (mobile) to 2 (tablet) to 4 (desktop).
*   **Accessibility Considerations:** Charts utilize distinct SVG patterns and high-contrast labels to remain usable by colorblind administrators.

#### 2.4.2 Hostel Blocks Controller
*   **Purpose:** Registers, updates, and deletes physical hostel facilities.
*   **Core UI Components:**
    *   **Hostels Grid:** Visual catalog cards of each block, featuring image, location, gender designation, and room counters.
    *   **Add Hostel Form Drawer:** Fields for Name, Capacity, Location, Gender eligibility (`Male` / `Female` / `Unisex`), and Description.
*   **User Interactions:**
    *   Clicking "Add Hostel Block" opens the form panel.
    *   Clicking "Delete" on a card triggers a confirmation check.
*   **Responsive Behavior:** Cards scale from single-column on mobile to three columns on desktop.
*   **Accessibility Considerations:** Interactive image tags include descriptive `alt` captions.

#### 2.4.3 Room Allocation Ledger
*   **Purpose:** Manages specific rooms, pricing, bed counts, and operational statuses.
*   **Core UI Components:**
    *   **Hostel Block Selector Tabs:** Tabbed row allowing admins to filter rooms by active Hostel.
    *   **Add Room Form:** Single-line inline form to quickly add room numbers, bed capacities, and pricing.
    *   **Room Directory Table:** Directory showing Room Number, pricing, capacity ratio bar (e.g., `2/4 full`), and status badge.
*   **User Interactions:**
    *   Clicking on room rows reveals quick status toggle action controls (`Available`, `Maintenance`, `Full`).
*   **Responsive Behavior:** Table is fully scrollable horizontally on mobile viewports to prevent data compression, and is fully displayed on desktop.
*   **Accessibility Considerations:** Table columns use specific header descriptors (`scope="col"`).

#### 2.4.4 Application Desk Review
*   **Purpose:** Reviewed by student affairs officers to match student requests with vacant rooms.
*   **Core UI Components:**
    *   **Applications Ledger Table:** Displays applicant name, matriculation number, gender, requested hostel block, and submission date.
    *   **Action Decision Dialog:** Opens upon selecting "Review" on a row:
        *   Displays student requests and medical concerns.
        *   **Room Match Selector Dropdown:** Automatically filters and suggests only *available* and *matching* rooms in the requested hostel block.
        *   **Administrative Comment Input Box:** For recording allocation notes.
        *   **Decision CTA Buttons:** High-contrast Approve and Reject buttons.
*   **User Interactions:**
    *   Selecting an application populates the decision panel.
    *   Choosing a matching room and clicking Approve updates the allocation state.
*   **Responsive Behavior:** Immersive modal dialog on smaller screens, split layout pane on desktop.
*   **Accessibility Considerations:** Traps keyboard focus within active dialog panels, supporting `Escape` key dismissal.

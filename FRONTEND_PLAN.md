# Hospital Information System (HIS) - Frontend Implementation Plan

## 1. Frontend Architecture & Tech Stack

### Core Stack
- **Framework**: React.js (v18+) with Vite (for fast build/dev experience).
- **Language**: JavaScript (ES6+).
- **State Management**: Redux Toolkit (Global State) + React Query (Server State/Caching).
- **Routing**: React Router DOM (v6).
- **Styling**: Tailwind CSS (for layout/spacing) + ShadcnUI/HeadlessUI (for unstyled, accessible components) or Material-UI (customized for modern look). *Recommendation: Tailwind CSS for maximum customizability and modern aesthetic.*
- **Icons**: Lucide React or Heroicons.
- **HTTP Client**: Axios (with interceptors for JWT).
- **Forms**: React Hook Form + Zod (validation).

### Directory Structure
```
src/
├── assets/             # Static assets (images, fonts)
├── components/         # Reusable UI components
│   ├── common/         # Buttons, Inputs, Modals, etc.
│   ├── layout/         # Sidebar, Header, Footer
│   └── guards/         # ProtectedRoute, RoleGuard
├── config/             # App configuration (routes, constants)
├── features/           # Feature-based modules (slices, components)
│   ├── auth/
│   ├── patient/
│   ├── opd/
│   └── ...
├── hooks/              # Custom React hooks (useAuth, useDebounce)
├── layouts/            # Page layouts (DashboardLayout, AuthLayout)
├── pages/              # Page components (routed)
├── services/           # API service calls
├── store/              # Redux store setup
├── styles/             # Global styles, Tailwind config
└── utils/              # Helper functions, formatters
```

---

## 2. User Roles & Access Control

Access control is strictly enforced via `rbac.middleware.js` roles.

| Role | Access Level |
| :--- | :--- |
| **Admin** | Full access to all modules and system configurations. |
| **Doctor** | Patient records, OPD/IPD, EMR, Prescriptions, Lab/Radio Orders. |
| **Nurse** | Patient Vitals, Ward Management, Sample Collection, Administration. |
| **Receptionist** | Registration, Appointments, Billing, Queues. |
| **Lab Tech** | Lab Work Queue, Result Entry. |
| **Radiologist** | Radiology Work Queue, Report Entry. |
| **Pharmacist** | Pharmacy Queue, Dispensing, Inventory. |
| **Billing** | Invoicing, Payments, Insurance. |
| **Insurance** | Claims processing. |

---

## 3. detailed Page Plan & API Mapping

### A. Authentication Module
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | User authentication. | All (Public) | `POST /api/auth/login` | Dashboard |
| **Forgot Password** | Password recovery. | All (Public) | `POST /api/auth/forgot-password` | Login |
| **Reset Password** | Set new password. | All (Public) | `POST /api/auth/reset-password` | Login |

### B. Dashboard Module
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Main Dashboard** | Role-specific KPIs, shortcuts, and alerts. | All (Context aware) | `GET /api/analytics/executive-dashboard`, `GET /api/notifications` | Any Module |

### C. Patient Management (Reception/Front Desk)
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Patient Registration** | Register new patient (demographics). | Reception, Admin | `POST /api/patients` | Patient Profile |
| **Patient Search** | Find existing patients. | All | `GET /api/patients/search` | Patient Profile |
| **Patient Profile** | View demographics, history, active visits. | All | `GET /api/patients/:id`, `GET /api/patients/:id/history` | Edit / Appointment |

### D. OPD (Out-Patient Department)
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Appointment Booking** | Schedule doctor visits. | Reception, Admin | `POST /api/opd/appointments` | Appointment Slip |
| **OPD Queue** | Live waitlist for doctors/nurses. | Doctor, Nurse, Reception | `GET /api/opd/queue` | Consultation |
| **Consultation Screen** | Doctor enters diagnosis, Rx, orders. | Doctor | `GET/PUT /api/opd/appointments/:id`, `POST /api/prescriptions` | Dashboard |

### E. EMR & Clinical
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Vitals Entry** | Record BP, Temp, Weight, etc. | Nurse, Doctor | `POST /api/emr/:visitId/vitals` | Queue |
| **EMR Viewer** | Timeline view of patient history. | Doctor, Nurse | `GET /api/emr/patient/:id` | - |

### F. Lab & Radiology
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Lab Order List** | Pending tests to perform. | Lab Tech | `GET /api/lab/orders` | Result Entry |
| **Lab Result Entry** | Input test parameter values. | Lab Tech | `PUT /api/lab/orders/:id/results` | Print / Verify |
| **Radiology Queue** | Pending scans (X-Ray, MRI). | Radiologist | `GET /api/radiology/orders` | Report Entry |
| **Report Entry** | Write findings/impression. | Radiologist | `PUT /api/radiology/orders/:id/report` | Print |

### G. Pharmacy
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Dispensing Queue** | Prescriptions waiting for meds. | Pharmacist | `GET /api/pharmacy/pending` | Dispense |
| **Dispense Screen** | Verify stock and handover meds. | Pharmacist | `POST /api/pharmacy/dispense`, `GET /api/inventory/check` | Billing |

### H. Billing & Insurance
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Bill Generation** | Create invoice for services/meds. | Billing | `POST /api/billing/generate` | Payment |
| **Payments** | Collect Cash/Card/UPI. | Billing | `POST /api/payments` | Receipt Print |
| **Insurance Claims** | Manage approvals/claims. | Insurance | `GET /api/insurance/claims` | Claims Detail |

### I. IPD (In-Patient)
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Admission** | Admit patient to Ward/Bed. | Reception, Admin | `POST /api/ipd/admit`, `GET /api/beds/available` | Patient Card |
| **Bed View** | Graphic view of ward occupancy. | Nurse, Admin | `GET /api/beds/map` | Transfer/Discharge |
| **Discharge** | Generate discharge summary/bill. | Doctor, Billing | `POST /api/ipd/discharge` | Billing |

### J. AI & Analytics
| Page | Purpose | Roles | APIs Used | Next Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Revenue Leakage** | AI alerts for missing charges. | Admin, Billing | `GET /api/ai/anomalies` | Bill Audit |
| **Predictive Stats** | Forecast OPD footfall/Bed usage. | Admin | `GET /api/ai/predictions` | Staff Planning |

---

## 4. State Management Strategy

1.  **Auth State (Redux)**:
    *   Store `user`, `token`, `role`, `permissions`.
    *   Persist in `localStorage` (via redux-persist) to survive refreshes.

2.  **Server State (React Query)**:
    *   All API data (`patients`, `appointments`, `labResults`) should use React Query.
    *   Benefits: Auto-caching, auto-refetching, background updates, easy loading/error states.

3.  **UI State (Local useState)**:
    *   Form inputs, modal open/close states, active tab indices.

---

## 5. Navigation Flow

1.  **Public Layer**:
    *   Login -> (Success) -> Determine Role -> Redirect to Role Dashboard.

2.  **Protected Layer (Dashboard Layout)**:
    *   **Sidebar**: Dynamic based on User Role.
    *   **Header**: User profile, Logout, Notifications.
    *   **Content Area**: Renders the active module.

3.  **Action Logic**:
    *   *Create Patient* -> Success Toast -> Redirect to *Patient Profile*.
    *   *Book Appointment* -> Success Toast -> Print Slip -> Stay on Page (for next booking).
    *   *Error Handling*: 401 (Auth) -> Redirect Login. 403 (Forbidden) -> Show "Access Denied".

---

## 6. Design Philosophy & System (The "Hospital Calm" Directive)

### Core User Experience Goal
**"Would a tired doctor or anxious admin feel calmer using this?"**
*   **Cognitive Load**: Absolute minimum.
*   **Vibe**: Trust, Hygiene, Stability. Not electric, not playful.
*   **Structure**: White space is structure. No heavy borders.

### Color Palette
*This palette relies on neutrality to reduce eye fatigue during long shifts.*

*   **Primary Action**: `Soft Teal` or `Muted Blue` (e.g., `#0D9488` or `#475569`). *Never neon.*
*   **Background**: `Off-White` / `#F9FAFB` (Tailwind `bg-gray-50`). *Never pure white `#FFFFFF` for main backgrounds.*
*   **Surface/Cards**: `White` / `#FFFFFF` with minimal border/shadow.
*   **Text**: `Dark Gray` / `#1F2937` (Tailwind `text-gray-800`). *Never pure black.*
*   **Accent (Use Sparingly)**: A single color for Active States/CTAs.

### Typography
*   **Font Family**: **Inter** (Primary choice) or SF Pro.
*   **Weights**: Two max. Regular (400) for body, Semibold (600) for headers.
*   **Hierarchy**: Achieved via **size** and **spacing**, not color screaming.
    *   *Headings*: Confident.
    *   *Body*: Calm.

### Layout Language
*   **Minimalism**: Lives in **spacing** (padding/margin), not lack of features.
*   **Card-Based**: Every card answers one question.
*   **Depth**: Flat design. Shadows must be "barely visible" (e.g., `shadow-sm`).
*   **Icons**: **Line Icons** only (Lucide React / Heroicons Outline). No filled icons (except active states if needed).

### Animations
*   **Philosophy**: "A heartbeat, not a festival LED strip."
*   **Usage**:
    *   Page Transitions: Very subtle fade.
    *   Loading: Thin, slow-moving skeletons.
    *   Micro-interaction: Slow fade on button hover.

## 7. Edge Cases & Empty States

*   **No Data**: Minimalist line illustration. "No Appointments Today".
*   **Loading**: Pulse skeletons (gray-200) matching layout.
*   **Unauthorized**: Calm 403 page explaining access rights.

# Frontend Folder & File Structure Strategy

## 1. /src/pages
*Route-level views. Grouped by feature module for scalability.*

*   **landing/**
    *   `LandingPage.jsx`: Public marketing/welcome page (Heartbeat animation).
*   **auth/**
    *   `Login.jsx`: User login screen (using AuthLayout).
    *   `ForgotPassword.jsx`: Request password reset link.
    *   `ResetPassword.jsx`: Enter new password.
    *   `Unauthorized.jsx`: Static 403 Forbidden page.
*   **dashboard/**
    *   `Dashboard.jsx`: Main landing after login. Loads widgets based on User Role.
*   **patient/**
    *   `PatientList.jsx`: Searchable, paginated table of all patients.
    *   `PatientRegistration.jsx`: Comprehensive form to register new patients.
    *   `PatientProfile.jsx`: Detail view (Demographics + Tabs for History, Vitals, EMR).
*   **opd/**
    *   `AppointmentBooking.jsx`: Form to schedule doctor visits.
    *   `OpdQueue.jsx`: Live list of waiting patients (Doctor/Nurse view).
    *   `Consultation.jsx`: The Doctor's main workspace (Diagnosis, Rx, Orders).
*   **ipd/**
    *   `WardView.jsx`: Visual map of beds (Occupied/Available/Cleaning).
    *   `AdmissionForm.jsx`: Process patient admission (Select Ward/Bed).
    *   `DischargeSummary.jsx`: Generate discharge papers and trigger final bill.
*   **billing/**
    *   `BillGenerator.jsx`: Create invoices for services/medicines.
    *   `TransactionHistory.jsx`: List of daily/past payments.
*   **lab/**
    *   `TestQueue.jsx`: List of pending tests for Lab Technicians.
    *   `ResultEntry.jsx`: Form to input test parameters and values.
*   **admin/**
    *   `UserManagement.jsx`: CRUD for staff accounts.
    *   `AuditLogs.jsx`: Security and action logs viewer.

## 2. /src/components
*Reusable UI elements. Split into "dumb" UI and "smart" common components.*

*   **ui/** (Atomic Design System - "Hospital Calm" styling)
    *   `Button.jsx`: variants: primary (Teal), secondary (Gray), ghost, dangerous (Red).
    *   `Input.jsx`: Standard text field with label and error text support.
    *   `Card.jsx`: White container with subtle shadow and rounded corners.
    *   `Modal.jsx`: Reusable accessible dialog overlay.
    *   `Badge.jsx`: Status indicators (e.g., Green for "Paid", Yellow for "Pending").
    *   `Spinner.jsx`: Minimalist loading indicator.
    *   `DataTable.jsx`: Reusable table with sorting, pagination, and empty states.
    *   `Alert.jsx`: Contextual feedback banners (Success/Error/Info).
*   **common/** (Business-logic aware or Complex components)
    *   `Sidebar.jsx`: Main navigation menu (Renders links based on User Role).
    *   `Header.jsx`: Top bar containing User Profile, Notifications, and Breadcrumbs.
    *   `ConfirmDialog.jsx`: Pre-configured Modal for "Are you sure?" actions.
    *   `RoleGuard.jsx`: Wrapper component to hide/show children based on permissions.

## 3. /src/layouts
*Top-level wrappers defining the page skeleton.*

*   `MainLayout.jsx`: Authenticated Shell. Grid layout with Sidebar (Left) and Header (Top).
*   `AuthLayout.jsx`: Centered, distraction-free layout for Login (Off-white background).
*   `PublicLayout.jsx`: Minimal wrapper for Landing page (Navbar + Footer).

## 4. /src/services
*API interaction layer (Axios + Endpoints).*

*   `api.js`: Central Axios instance (Interceptors for Bearer Token injection & Error handling).
*   `auth.service.js`: Login, Logout, RefreshToken, GetMe.
*   `patient.service.js`: Patient CRUD, History, Search.
*   `opd.service.js`: Appointments, Queue, Consultation saves.
*   `billing.service.js`: Invoice generation, Payment recording.
*   `lab.service.js`: Test orders, Result updates.
*   `admin.service.js`: User management, System configs.

## 5. /src/hooks
*Custom React logic reuse.*

*   `useAuth.js`: Access user context (user, role, login(), logout()).
*   `useAxiosPrivate.js`: Returns axios instance with attached interceptors for automatic token refresh.
*   `useDebounce.js`: Delays execution (critical for Real-time Patient Search).
*   `useRole.js`: Helper to check "can this user do X?".

## 6. /src/store
*Global State Management (Redux Toolkit).*

*   `store.js`: Redux store configuration.
*   `slices/`
    *   `authSlice.js`: Stores User, Token, Role, isAuthenticated.
    *   `uiSlice.js`: Global UI states (Sidebar open/close, Global Loading overlay).

## 7. /src/utils
*Stateless helper functions and constants.*

*   `constants.js`: Enums (USER_ROLES, STATUS_TYPES, API_BASE_URL).
*   `helpers.js`: Generic small helpers (text truncation, ID generation).
*   `dateUtils.js`: Date formatting (DD-MMM-YYYY) and Age calculation.
*   `currencyUtils.js`: Money formatting (INR/USD) with symbol.
*   `validators.js`: Schema validations (Email regex, Phone number, Password strength).

## 8. /src/routes
*Routing configuration.*

*   `AppRoutes.jsx`: Main Router definition mapping Paths to Pages.
*   `ProtectedRoute.jsx`: Wrapper that redirects to /login if unauthenticated.
*   `RoleRoute.jsx`: Wrapper that redirects to /unauthorized if role doesn't match.

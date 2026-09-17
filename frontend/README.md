# BidSure AI — Frontend Architecture & Developer Guide

## 1. Overview & Purpose
BidSure AI is an autonomous, evidence-first public procurement compliance and tender evaluation platform. The frontend serves as the unified operating console for both **Procurement Officers** and **Authorized Bidders**.

> [!IMPORTANT]
> **Core Architectural Invariants**:
> 1. **The frontend is NOT the security boundary**: All permissions and access control are enforced authoritatively by the backend.
> 2. **The frontend is NOT the compliance engine**: The frontend never calculates deterministic compliance verdicts (PASS/FAIL), risk scores, or qualification decisions locally. It renders and orchestrates backend truth.
> 3. **The frontend preserves uncertainty**: States such as `REVIEW_REQUIRED`, `UNABLE_TO_VERIFY`, `EVIDENCE_MISSING`, and `CONFLICTING_EVIDENCE` are first-class citizen statuses, never collapsed into naive binary pass/fail.
> 4. **AI is advisory**: AI proposals are clearly labeled as "AI-assisted / Suggested" — the Procurement Officer remains the final decision authority.

---

## 2. Technology Stack
- **Core Runtime**: React 19, TypeScript (Strict), Vite 8
- **Styling & UI**: Tailwind CSS 4, shadcn/ui design patterns, Lucide React icons
- **Client Routing**: React Router v7 (role-aware officer/bidder layouts)
- **Server State**: TanStack Query (React Query v5)
- **Forms & Validation**: React Hook Form with Zod schema resolvers
- **HTTP Client**: Centralized Axios client with automatic `x-request-id` injection and error normalization
- **Testing**: Vitest, React Testing Library, Playwright E2E

---

## 3. Directory Architecture

```text
frontend/
│
├── src/
│   ├── app/                         # Application composition layer
│   │   ├── App.tsx                  # Root component
│   │   ├── router.tsx               # Central route definitions
│   │   ├── providers.tsx            # QueryClient & ErrorBoundary providers
│   │   └── error-boundary.tsx       # Global fallback error boundary
│   │
│   ├── assets/                      # Static branding and image assets
│   │
│   ├── components/                  # Generic, reusable presentation UI
│   │   ├── ui/                      # Base primitives (Button, Card, Badge, StatusIndicator)
│   │   ├── layout/                  # Layout shells (OfficerLayout, BidderLayout, AuthLayout)
│   │   ├── navigation/              # Navigation bars (Topbar, OfficerSidebar, BidderSidebar)
│   │   ├── feedback/                # Feedback states (ErrorFallback, LoadingSpinner)
│   │   └── data-display/            # Data tables, summary cards, badge clusters
│   │
│   ├── features/                    # Domain-specific vertical feature slices
│   │   ├── auth/                    # Login, registration, profile
│   │   ├── dashboard/               # Officer and bidder console overviews
│   │   ├── tenders/                 # Tender creation, specs, and clause browser
│   │   ├── bids/                    # Bid submission, package overview, and review
│   │   ├── documents/               # Document vault and upload management
│   │   ├── evidence/                # Extracted facts and OCR provenance viewer
│   │   ├── requirements/            # Deterministic requirement matrix
│   │   ├── verification/            # Registry verification (GST, PAN, Udyam)
│   │   ├── compliance/              # Deterministic compliance rule evaluation
│   │   ├── findings/                # Red flags, discrepancies, and audit findings
│   │   ├── risk/                    # Multi-factor risk assessments
│   │   ├── decisions/               # Officer review, override, and final sign-off
│   │   ├── clarifications/          # Vendor queries and tender addenda
│   │   ├── reports/                 # Audit-ready compliance reports
│   │   ├── audit/                   # Cryptographic, immutable audit log viewer
│   │   └── settings/                # System policies and organization settings
│   │
│   ├── hooks/                       # Shared utility hooks
│   ├── lib/                         # Core utilities (cn, env config)
│   ├── services/                    # External communication abstractions
│   │   ├── api/                     # Central HTTP client and service endpoints
│   │   ├── auth/                    # Auth session helpers
│   │   └── storage/                 # Local/session storage wrappers
│   │
│   ├── stores/                      # Ephemeral UI client state (sidebar, modal states)
│   ├── types/                       # Shared domain & API TypeScript interfaces
│   ├── constants/                   # Fixed statuses, domain categories, and roles
│   └── styles/                      # Tailwind 4 global tokens and theme variables
│
├── tests/                           # Testing infrastructure
│   ├── unit/                        # Unit tests (services, utils)
│   ├── components/                  # Component tests (UI primitives)
│   ├── integration/                 # Integration tests (App shell & routing)
│   └── e2e/                         # Playwright end-to-end specifications
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 4. Getting Started

### Prerequisites
- Node.js LTS (v20+ or v22+)
- npm v10+

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```env
VITE_API_BASE_URL=/api/v1
```

### Running the Development Server
```bash
npm run dev
```
The frontend starts on `http://localhost:5173`.
All requests to `/api` are proxied to the backend at `http://localhost:3000`.

### Running Tests
```bash
# Run unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Production Build
```bash
npm run build
```
Generates optimized, type-checked production bundle in `dist/`.

---

## 5. Architectural Communication Flow

```text
React Component
      │
      ▼
Feature Hook (useQuery / useMutation)
      │
      ▼
API Service (e.g. healthService.getHealth)
      │
      ▼
Central HTTP Client (Axios with x-request-id & standard error mapping)
      │
      ▼
Express Backend (/api/v1/*)
```

**Rule**: Never write `fetch()` or raw `axios` calls inside UI presentation components. All network requests must flow through the centralized service layer.

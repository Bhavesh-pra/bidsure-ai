# BidSure AI — Development Guidelines & Workflow

## 1. Branching Naming Conventions

All developers must create feature branches from `develop`. Direct pushes to `main` or `develop` are restricted.

Pattern: `feature/c<cycle_number>-<short_description>`

Examples:
- `feature/c1-backend-models`
- `feature/c1-api-contracts`
- `feature/c1-qa-docs`
- `feature/c2-auth-rbac`

---

## 2. Commit Message Standards

Use standard conventional commit messages:

- `feat(backend): add SQLAlchemy core models`
- `feat(api): implement standard response wrapper`
- `docs(qa): add development guidelines and integration checklist`
- `fix(auth): correct token expiration handling`

---

## 3. Pull Request (PR) & Review Process

1. Every PR must be linked to a Cycle issue.
2. PR reviews follow cross-team ownership:
   - Python code $\rightarrow$ Reviewed by **Main Dev 1**
   - Backend/API/DB code $\rightarrow$ Reviewed by **Main Dev 2**
   - Frontend/UI code $\rightarrow$ Reviewed by **Main Dev 3**
3. At least one approval is required before merging into `develop`.

---

## 4. Cycle 1 GitHub Issues Checklist

For Partial Dev 3 setup:
- [ ] `C1-001`: Create Flask backend application skeleton & entry point (`run.py`)
- [ ] `C1-002`: Set up PostgreSQL database connection & SQLAlchemy base configuration
- [ ] `C1-003`: Define REST API contracts & standard response wrapper in `docs/API.md`
- [ ] `C1-004`: Define Python domain schemas (`tender`, `evidence`, `verification`, `risk`)
- [ ] `C1-005`: Create React + Vite + TypeScript application skeleton
- [ ] `C1-006`: Build reusable frontend UI primitives (`StatusBadge`, `Button`, `Card`)
- [ ] `C1-007`: Generate synthetic mock datasets (`tenders`, `bidders`, `evidence`)
- [ ] `C1-008`: Add documentation (`README`, `ARCHITECTURE`, `DEVELOPMENT`, `CHECKLIST`)

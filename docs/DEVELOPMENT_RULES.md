# BidSure AI — Development Rules & Governance

All developers must follow these strict rules during Cycle 2 and subsequent cycles.

---

## 1. Branching & Git Strategy

- **No Direct Pushes**: Nobody pushes directly to `main` or `develop`.
- **Base Branch**: Pull the latest `develop` before starting work.
  ```bash
  git checkout develop
  git pull origin develop
  ```
- **Feature Branches**: Name feature branches according to role and task:
  - `feature/cycle2-db-foundation`
  - `feature/cycle2-python-contracts`
  - `feature/cycle2-react-foundation`
  - `feature/cycle2-test-data`
  - `feature/cycle2-qa-docs`

---

## 2. API Contract Freeze Rule

- **Frozen Core Contracts**: Domain models, REST API response structures, and TypeScript types are frozen before dependent feature modules are built.
- **Contract Mismatch Prevention**: API contracts and domain schemas cannot be changed unilaterally. Any contract modification requires team consensus and alignment across backend, frontend, and data roles.

---

## 3. Secret & Credential Governance

- **No Committed Secrets**: Never commit `.env` or real API keys/credentials to Git.
- **Environment Template**: Update `.env.example` when new configuration options are added.
- **Placeholder Values**: Use explicit placeholders (e.g. `your-api-key-here`) in example files.

---

## 4. Standard API Envelope Compliance

Every API endpoint must respond using the standard team-wide envelope:

### Success Format (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {},
  "request_id": "REQ-123"
}
```

### Error Format (`400`, `401`, `403`, `404`, `422`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters"
  },
  "request_id": "REQ-123"
}
```

---

## 5. Pull Request & Testing Requirements

- **Pull Requests Required**: All changes must be submitted via PR targeting `develop`.
- **Review Requirement**: Minimum 1 peer review approval required.
- **Build & Test Verification**: Code must compile/run cleanly and pass test matrix criteria before merging.

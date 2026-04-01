# ADR: User Management Design

## Decision
We use Laravel Sanctum for authentication.

---

## Why
- Lightweight
- API-friendly
- Secure token-based auth

---

## Alternatives Considered
- Passport (too heavy)
- JWT (manual complexity)

---

## Outcome
Sanctum selected for scalability and simplicity.
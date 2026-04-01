# Chapter 3: Architecture Design

## System Architecture
- Laravel Backend (API-first)
- Frontend (React/Vue/Blade)
- Database (MySQL/PostgreSQL)
- Queue system (Redis)

---

## Layers

### Presentation Layer
Controllers, Views, Inertia pages

### Application Layer
Services, Actions, DTOs

### Domain Layer
Business rules, entities

### Infrastructure Layer
Database, external APIs

---

## Rules
- Controllers must remain thin
- Business logic MUST NOT be in HTTP layer
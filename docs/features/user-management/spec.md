# Feature Spec: User Management

## Overview
Handles registration, login, profile, and user roles.

---

## Functional Requirements
- User registration
- Login/logout
- Profile update
- Role assignment

---

## API Endpoints
- POST /api/v1/register
- POST /api/v1/login
- GET /api/v1/user

---

## Business Rules
- Email must be unique
- Password must be hashed
- Role-based access control required
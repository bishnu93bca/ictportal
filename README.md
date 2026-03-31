# ICT Portal Management System




<div align="center">

[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat-square&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A modern full-stack **Laravel 13 + React (Vite)** based **Role-Based Access Control (RBAC)** ICT Portal Management System with API versioning, modular architecture, and scalable frontend integration.

[🚀 Live Demo](#) • [📖 API Docs](#-api-reference) • [🐛 Report Bug](../../issues) • [✨ Request Feature](../../issues)

</div>

---

## 🚀 Tech Stack

### Backend

* Laravel 13.x
* PHP 8.2+
* MySQL / PostgreSQL
* REST API Architecture
* API Versioning: `/api/v1/`
* Laravel Sanctum / JWT Authentication

### Frontend

* React (Vite)
* Tailwind CSS
* Axios (API Communication)
* React Router DOM
* Redux Toolkit / Zustand (optional)

---

## 📁 Project Structure

## 1. Laravel Backend (Core Project)

```
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── AuthController.php
│   │   │           ├── UserController.php
│   │   │           ├── RoleController.php
│   │   │           └── DashboardController.php
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Role.php
│   │   └── Permission.php
│   ├── Providers/
│
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── web.php
│   ├── api.php
│   └── api/
│       └── v1.php
├── resources/
│   ├── views/                 # Blade (optional)
│   └── js/                    # React entry (Vite)
├── storage/
├── tests/
├── vendor/
├── .env
├── composer.json
└── vite.config.js
```

---

## 2. React Frontend (Inside Laravel /resources/js)

```
├── resources/js/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Application pages
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── roles/
│   ├── services/          # Axios API services
│   ├── router/            # React Router config
│   ├── store/             # Redux Toolkit / Zustand
│   ├── hooks/             # Custom hooks
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── node_modules/
```

---

## 3. Build & Tooling

```
vite.config.js
postcss.config.js
tailwind.config.js
webpack.mix.js (legacy optional)
public/                   # Compiled assets output
```

---

## 🔐 Role-Based Access Control (RBAC)

### Roles

* Super Admin
* Admin
* Manager
* Staff
* Viewer

### Permissions Example

* user.create
* user.read
* user.update
* user.delete
* role.manage
* report.view

### Middleware Example

```php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
```

---

## 📡 API Reference

**Base URL:** `http://localhost:8000/api/v1`

**Headers for protected routes:**
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

**Standard response envelope:**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Paginated response:**
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 72 }
  }
}
```

---

### 🔐 Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | ❌ | Returns Bearer token |
| POST | `/auth/register` | ❌ | Register user |
| POST | `/auth/logout` | ✅ | Invalidate token |
| GET | `/auth/me` | ✅ | Current user + permissions |
| PUT | `/auth/profile` | ✅ | Update profile |
| POST | `/auth/change-password` | ✅ | Change password |
| POST | `/auth/forgot-password` | ❌ | Send OTP to email |
| POST | `/auth/reset-password` | ❌ | Reset with OTP |

<details>
<summary>📄 Login example</summary>

**Request:**
```json
POST /auth/login
{ "email": "admin@sms.com", "password": "password" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "1|abc123xyz...",
    "user": {
      "id": 1, "name": "Admin", "email": "admin@sms.com",
      "role": "admin",
      "permissions": ["view-students", "create-students", "view-teachers", ...]
    }
  }
}
```
</details>

---

## 🧠 Architecture Overview

### Backend

* MVC Architecture (Laravel)
* Service Layer (Recommended)
* Repository Pattern (Optional)
* API Resource Transformers
* Middleware-based Security

### Frontend

* Component-based React UI
* Protected Routes (RBAC)
* Centralized API Layer (Axios)
* Lazy Loading Pages
* State Management (Redux Toolkit / Zustand)

---

## 🔐 Authentication Flow

1. User logs in via `/api/v1/auth/login`
2. Server returns Sanctum/JWT token
3. Token stored in localStorage or cookies
4. Axios attaches token in headers
5. Backend middleware validates request
6. RBAC controls access

---

## 📊 Core Modules

* Authentication Module
* User Management Module
* Role & Permission Module
* ICT Asset Management Module
* Reports & Analytics Module
* Dashboard Module

---

## 🧪 Testing Strategy

### Backend

* PHPUnit
* Pest PHP (optional)
* API testing via Postman / Swagger

### Frontend

* React Testing Library
* Component Testing

---

## 🛠️ Setup Instructions

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Environment Configuration

### Backend (.env)

```
APP_NAME="ICT Portal Management System"
APP_URL=http://localhost:8000
DB_DATABASE=ict_portal
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🚀 Deployment Structure (Production)

* Laravel served via Apache/Nginx
* React built using Vite (`npm run build`)
* Built assets served from `/public/build`
* Secure API with HTTPS

---

## 📌 Future Enhancements

* Multi-tenant architecture
* Real-time notifications (WebSockets / Pusher)
* Audit logs system
* Advanced analytics dashboard
* Mobile app (React Native)
* AI-based reporting system

---

## 📄 License

MIT License

---

## 👨‍💻 Developer Notes

This project follows modern **Laravel 13 + React Vite architecture** with strict **API versioning (/api/v1)** and enterprise-grade **RBAC security model** for scalable ICT portal management.

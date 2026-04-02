import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import UsersListPage from '@/pages/UsersListPage'
import UserDetailPage from '@/pages/UserDetailPage'
import CreateUserPage from '@/pages/CreateUserPage'
import TrashedUsersPage from '@/pages/TrashedUsersPage'
import ProfilePage from '@/pages/ProfilePage'
import ComplaintsPage from '@/pages/ComplaintsPage'
import ComplaintFormPage from '@/pages/ComplaintFormPage'
import ManageComplaintsPage from '@/pages/ManageComplaintsPage'
import CategoriesPage from '@/pages/CategoriesPage'
import RolesPage from '@/pages/RolesPage'
import AuditLogsPage from '@/pages/AuditLogsPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Layout
import MainLayout from '@/layouts/MainLayout'

/* ─── Guards ─────────────────────────────────────────────────── */

function ProtectedRoute() {
  const { token, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading…</span>
      </div>
    )
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />
}

function GuestRoute() {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export function RoleGuard({ roles = [] }) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

/* ─── Router ──────────────────────────────────────────────────── */

const router = createBrowserRouter([
  // Public
  { path: '/', element: <LandingPage /> },

  // Guest-only
  {
    element: <GuestRoute />,
    children: [
      { path: '/login',            element: <LoginPage /> },
      { path: '/forgot-password',  element: <ForgotPasswordPage /> },
    ],
  },

  // Authenticated
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile',   element: <ProfilePage /> },

          // ── Complaints: all authenticated users can file ──────────────
          { path: '/complaints',        element: <ComplaintsPage /> },
          { path: '/complaints/create', element: <ComplaintFormPage /> },
          { path: '/complaints/:id/edit', element: <ComplaintFormPage /> },

          // ── Complaint management: admin / super_admin ─────────────────
          {
            element: <RoleGuard roles={['super_admin', 'admin']} />,
            children: [
              { path: '/complaints/manage', element: <ManageComplaintsPage /> },
            ],
          },

          // ── User management: admin / super_admin / manager ────────────
          {
            element: <RoleGuard roles={['super_admin', 'admin', 'manager']} />,
            children: [
              { path: '/users',     element: <UsersListPage /> },
              { path: '/users/:id', element: <UserDetailPage /> },
            ],
          },

          // ── Create user: super_admin only ─────────────────────────────
          {
            element: <RoleGuard roles={['super_admin']} />,
            children: [
              { path: '/users/create', element: <CreateUserPage /> },
            ],
          },

          // ── Trashed users: super_admin only ───────────────────────────
          {
            element: <RoleGuard roles={['super_admin']} />,
            children: [
              { path: '/users/trashed', element: <TrashedUsersPage /> },
            ],
          },

          // ── Categories: super_admin + district admin (read/manage per API) ──
          {
            element: <RoleGuard roles={['super_admin', 'admin']} />,
            children: [
              { path: '/categories', element: <CategoriesPage /> },
            ],
          },

          // ── Roles + Audit Logs: super_admin only ───────────────────────
          {
            element: <RoleGuard roles={['super_admin']} />,
            children: [
              { path: '/roles',      element: <RolesPage /> },
              { path: '/audit-logs', element: <AuditLogsPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <NotFoundPage /> },
])

export default router

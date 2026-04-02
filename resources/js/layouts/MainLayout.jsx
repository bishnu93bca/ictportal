import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  UserCircle,
  MessageSquareWarning,
  ClipboardList,
  Users,
  Trash2,
  FolderTree,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Menu,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import Avatar from '@/components/ui/Avatar'
import BrandLogo from '@/components/BrandLogo'
import { MANAGEMENT_ROLES } from '@/constants/user'

export default function MainLayout() {
  const navigate         = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully.')
    navigate('/login', { replace: true })
  }

  const isManagement = user && MANAGEMENT_ROLES.includes(user.role)
  const isAdmin      = user && ['super_admin', 'admin'].includes(user.role)
  const isSuperAdmin = user?.role === 'super_admin'

  const navItems = [
    { path: '/dashboard',          label: 'Dashboard',          Icon: LayoutDashboard },
    { path: '/profile',            label: 'My Profile',         Icon: UserCircle },
    { path: '/complaints',         label: 'My Complaints',      Icon: MessageSquareWarning },
    ...(isAdmin      ? [{ path: '/complaints/manage', label: 'Manage Complaints', Icon: ClipboardList }] : []),
    ...(isManagement ? [{ path: '/users',             label: 'Users',             Icon: Users }]         : []),
    ...(isSuperAdmin ? [{ path: '/users/trashed',     label: 'Deleted Users',     Icon: Trash2 }]        : []),
    ...(isAdmin ? [{ path: '/categories',        label: 'Categories',          Icon: FolderTree   }] : []),
    ...(isSuperAdmin ? [{ path: '/roles',             label: 'Roles & Permissions', Icon: ShieldCheck  }] : []),
    ...(isSuperAdmin ? [{ path: '/audit-logs',        label: 'Audit Logs',          Icon: ShieldAlert  }] : []),
  ]

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-100">
        <BrandLogo size="md" />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path !== '/complaints'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition">
          <Avatar name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-100 hidden md:flex flex-col fixed inset-y-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100 flex flex-col z-40 transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content — offset for sidebar */}
      <div className="flex-1 flex flex-col md:ml-60 min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            className="md:hidden btn btn-ghost btn-icon mr-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm flex items-center gap-1.5">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

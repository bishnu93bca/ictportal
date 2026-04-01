import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import {
  Users, UserCheck, UserX, ShieldAlert,
  MessageSquareWarning, Clock, CheckCircle2, XCircle,
  GraduationCap, Briefcase, BookOpen, Heart,
  TrendingUp, LayoutDashboard,
} from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth'
import { RoleBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

/* ─── Palette ─────────────────────────────────────────────────── */
const COLORS = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#f59e0b',
  red:    '#ef4444',
  purple: '#8b5cf6',
  cyan:   '#06b6d4',
  orange: '#f97316',
  pink:   '#ec4899',
}

const PIE_PALETTE = Object.values(COLORS)

const COMPLAINT_STATUS_COLORS = {
  pending:      COLORS.yellow,
  under_review: COLORS.blue,
  resolved:     COLORS.green,
  rejected:     COLORS.red,
}

const ROLE_COLORS = {
  super_admin: COLORS.purple,
  admin:       COLORS.blue,
  manager:     COLORS.cyan,
  teacher:     COLORS.green,
  staff:       COLORS.orange,
  student:     COLORS.yellow,
  parent:      COLORS.pink,
  guest:       '#94a3b8',
}

/* ─── Small helpers ──────────────────────────────────────────── */

function StatCard({ label, value, Icon, color = 'blue', sub }) {
  const palettes = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'bg-blue-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'bg-green-100' },
    yellow: { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'bg-amber-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-500',    icon: 'bg-red-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-600',   icon: 'bg-cyan-100' },
  }
  const p = palettes[color] ?? palettes.blue

  return (
    <div className={`card p-5 flex items-start gap-4 ${p.bg}`}>
      {Icon && (
        <div className={`rounded-xl p-2.5 ${p.icon} shrink-0`}>
          <Icon className={`w-5 h-5 ${p.text}`} strokeWidth={1.75} />
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${p.text}`}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? p.fill }} className="flex items-center gap-1">
          <span className="font-semibold">{p.value}</span>
          <span className="text-slate-500">{p.name}</span>
        </p>
      ))}
    </div>
  )
}

function EmptyChart({ message = 'No data yet' }) {
  return (
    <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
      {message}
    </div>
  )
}

/* ─── Pie / Donut label ──────────────────────────────────────── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (value === 0) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {value}
    </text>
  )
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-2">
      <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats]       = useState(null)
  const [isLoading, setLoading] = useState(true)

  const isAdmin      = user && ['super_admin', 'admin'].includes(user?.role)
  const isManager    = user?.role === 'manager'

  useEffect(() => {
    api.get('/v1/dashboard/stats')
      .then(({ data }) => setStats(data.stats))
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
        <LayoutDashboard className="w-8 h-8 animate-pulse" />
        <p className="text-sm">Loading dashboard…</p>
      </div>
    )
  }

  /* ── transform API data → chart shapes ── */
  const usersByRoleData = stats?.users_by_role
    ? Object.entries(stats.users_by_role).map(([role, count]) => ({
        name: role.replace(/_/g, ' '),
        value: count,
        fill: ROLE_COLORS[role] ?? '#94a3b8',
      }))
    : []

  const complaintStatusData = stats?.complaints_by_status
    ? Object.entries(stats.complaints_by_status).map(([status, count]) => ({
        name: status.replace(/_/g, ' '),
        value: count,
        fill: COMPLAINT_STATUS_COLORS[status] ?? '#94a3b8',
      }))
    : []

  const complaintCategoryData = stats?.complaints_by_category
    ? Object.entries(stats.complaints_by_category).map(([cat, count], i) => ({
        name: cat,
        count,
        fill: PIE_PALETTE[i % PIE_PALETTE.length],
      }))
    : []

  const myComplaint = stats?.my_complaints ?? {}

  return (
    <div className="space-y-6">

      {/* ── Welcome ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Here's what's happening in the portal today.</p>
        </div>
        <span className="text-xs text-slate-400 mt-1 hidden sm:block">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* ════════════════════ ADMIN / SUPER-ADMIN VIEW ════════════════════ */}
      {isAdmin && (
        <>
          {/* ── User KPI Cards ── */}
          <SectionTitle icon={Users} title="User Overview" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users"  value={stats?.total_users}     Icon={Users}       color="blue" />
            <StatCard label="Active"       value={stats?.active_users}    Icon={UserCheck}   color="green" />
            <StatCard label="Inactive"     value={stats?.inactive_users}  Icon={UserX}       color="yellow" />
            <StatCard label="Suspended"    value={stats?.suspended_users} Icon={ShieldAlert} color="red" />
          </div>

          {/* ── Complaint KPI Cards ── */}
          <SectionTitle icon={MessageSquareWarning} title="Complaint Overview" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Complaints" value={stats?.complaint_stats?.total}        Icon={MessageSquareWarning} color="blue" />
            <StatCard label="Pending"          value={stats?.complaint_stats?.pending}       Icon={Clock}                color="yellow" />
            <StatCard label="Under Review"     value={stats?.complaint_stats?.under_review}  Icon={TrendingUp}           color="cyan" />
            <StatCard label="Resolved"         value={stats?.complaint_stats?.resolved}      Icon={CheckCircle2}         color="green" />
          </div>

          {/* ── Charts Row 1: Trends ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard
              title="User Registrations"
              subtitle="New users — last 6 months"
              action={<Link to="/users" className="text-xs text-blue-600 hover:underline">View all →</Link>}
            >
              {stats?.monthly_registrations?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.monthly_registrations} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLORS.blue} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Users" stroke={COLORS.blue} fill="url(#regGrad)" strokeWidth={2} dot={{ r: 3, fill: COLORS.blue }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            <ChartCard
              title="Complaint Submissions"
              subtitle="Complaints filed — last 6 months"
              action={<Link to="/complaints/manage" className="text-xs text-blue-600 hover:underline">Manage →</Link>}
            >
              {stats?.monthly_complaints?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.monthly_complaints} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="cmpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLORS.orange} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Complaints" stroke={COLORS.orange} fill="url(#cmpGrad)" strokeWidth={2} dot={{ r: 3, fill: COLORS.orange }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* ── Charts Row 2: Distributions ── */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Users by Role — Donut */}
            <ChartCard title="Users by Role" subtitle="Current role distribution">
              {usersByRoleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={usersByRoleData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {usersByRoleData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend
                      formatter={(value) => <span className="text-xs text-slate-600 capitalize">{value}</span>}
                      iconSize={8} iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Complaints by Status — Donut */}
            <ChartCard title="Complaints by Status" subtitle="Current breakdown">
              {complaintStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={complaintStatusData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {complaintStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      formatter={(value) => <span className="text-xs text-slate-600 capitalize">{value}</span>}
                      iconSize={8} iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Complaints by Category — Bar */}
            <ChartCard title="Complaints by Category" subtitle="All-time totals">
              {complaintCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={complaintCategoryData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                      {complaintCategoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* ── Recent activity tables ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent Registrations */}
            <ChartCard
              title="Recent Registrations"
              subtitle="Latest 5 users"
              action={<Link to="/users" className="text-xs text-blue-600 hover:underline">View all →</Link>}
            >
              <div className="space-y-3">
                {stats?.recent_registrations?.map((u) => (
                  <Link key={u.id} to={`/users/${u.id}`} className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded-lg transition">
                    <Avatar name={u.name} src={u.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                  </Link>
                ))}
              </div>
            </ChartCard>

            {/* Recent Complaints */}
            <ChartCard
              title="Recent Complaints"
              subtitle="Latest 5 submissions"
              action={<Link to="/complaints/manage" className="text-xs text-blue-600 hover:underline">Manage →</Link>}
            >
              <div className="space-y-3">
                {stats?.recent_complaints?.map((c) => {
                  const statusColor = {
                    pending:      'bg-amber-100 text-amber-700',
                    under_review: 'bg-blue-100 text-blue-700',
                    resolved:     'bg-green-100 text-green-700',
                    rejected:     'bg-red-100 text-red-700',
                  }[c.status] ?? 'bg-slate-100 text-slate-600'
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <Avatar name={c.user?.name} src={c.user?.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                        <p className="text-xs text-slate-400 capitalize">{c.category}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* ════════════════════ MANAGER VIEW ════════════════════ */}
      {isManager && (
        <>
          <SectionTitle icon={Users} title="Staff Overview" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Teachers" value={stats?.teacher_count} Icon={GraduationCap} color="green" />
            <StatCard label="Staff"    value={stats?.staff_count}   Icon={Briefcase}     color="blue" />
            <StatCard label="Students" value={stats?.student_count} Icon={BookOpen}      color="yellow" />
            <StatCard label="Parents"  value={stats?.parent_count}  Icon={Heart}         color="purple" />
          </div>

          <ChartCard title="Staff Distribution" subtitle="Breakdown by role">
            {stats?.teacher_count !== undefined ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'Teachers', count: stats.teacher_count, fill: COLORS.green },
                    { name: 'Staff',    count: stats.staff_count,   fill: COLORS.blue },
                    { name: 'Students', count: stats.student_count, fill: COLORS.yellow },
                    { name: 'Parents',  count: stats.parent_count,  fill: COLORS.purple },
                  ]}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                    {[COLORS.green, COLORS.blue, COLORS.yellow, COLORS.purple].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </>
      )}

      {/* ════════════════════ MY COMPLAINTS (all roles) ════════════════════ */}
      <SectionTitle icon={MessageSquareWarning} title="My Complaints" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Filed"  value={myComplaint.total}        Icon={MessageSquareWarning} color="blue" />
        <StatCard label="Pending"      value={myComplaint.pending}       Icon={Clock}                color="yellow" />
        <StatCard label="Under Review" value={myComplaint.under_review}  Icon={TrendingUp}           color="cyan" />
        <StatCard label="Resolved"     value={myComplaint.resolved}      Icon={CheckCircle2}         color="green" />
      </div>

      {/* My complaints mini chart */}
      {myComplaint.total > 0 && (
        <ChartCard title="My Complaint Statuses" subtitle="Your filing breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              layout="vertical"
              data={[
                { name: 'Pending',      count: myComplaint.pending,      fill: COLORS.yellow },
                { name: 'Under Review', count: myComplaint.under_review, fill: COLORS.blue },
                { name: 'Resolved',     count: myComplaint.resolved,     fill: COLORS.green },
                { name: 'Rejected',     count: myComplaint.rejected,     fill: COLORS.red },
              ].filter((d) => d.count > 0)}
              margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Complaints" radius={[0, 4, 4, 0]}>
                {[myComplaint.pending, myComplaint.under_review, myComplaint.resolved, myComplaint.rejected]
                  .filter((_, i) => [myComplaint.pending, myComplaint.under_review, myComplaint.resolved, myComplaint.rejected][i] > 0)
                  .map((_, i) => {
                    const fills = [COLORS.yellow, COLORS.blue, COLORS.green, COLORS.red]
                    return <Cell key={i} fill={fills[i]} />
                  })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex justify-end">
            <Link to="/complaints" className="text-xs text-blue-600 hover:underline">
              View my complaints →
            </Link>
          </div>
        </ChartCard>
      )}

      {/* ── My Account card ── */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">My Account</h3>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="md" />
          <div>
            <p className="font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <RoleBadge role={user?.role} />
              {stats?.my_profile?.last_login_at && (
                <span className="text-xs text-slate-400">
                  Last login {stats.my_profile.last_login_at}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Link to="/profile" className="btn btn-ghost btn-sm">
            Edit Profile →
          </Link>
          <Link to="/complaints" className="btn btn-ghost btn-sm">
            My Complaints →
          </Link>
        </div>
      </div>

    </div>
  )
}

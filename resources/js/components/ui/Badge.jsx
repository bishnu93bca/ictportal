const ROLE_STYLES = {
  super_admin: 'badge-red',
  admin:       'badge-blue',
  manager:     'badge-yellow',
  teacher:     'badge-green',
  staff:       'badge-gray',
  student:     'badge-blue',
  parent:      'badge-gray',
  guest:       'badge-gray',
}

const STATUS_STYLES = {
  active:    'badge-green',
  inactive:  'badge-gray',
  suspended: 'badge-red',
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${ROLE_STYLES[role] ?? 'badge-gray'}`}>
      {role?.replace('_', ' ')}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? 'badge-gray'}`}>
      {status}
    </span>
  )
}

export default function Badge({ children, variant = 'gray' }) {
  return (
    <span className={`badge badge-${variant}`}>{children}</span>
  )
}

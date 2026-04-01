export default function Avatar({ src, name = '', size = 'md' }) {
  const sizeClass = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg' }[size] ?? 'avatar-md'

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar ${sizeClass} object-cover`}
      />
    )
  }

  return (
    <div
      className={`avatar ${sizeClass} bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold select-none`}
    >
      {initials || '?'}
    </div>
  )
}

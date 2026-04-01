import { Link } from 'react-router-dom'

/**
 * Site-wide brand — matches admin & login: blue-600 title, slate tagline, icon on blue-600.
 * @param {'default' | 'light'} variant — default for light backgrounds; light for dark hero (white title)
 */
export default function BrandLogo({
  variant = 'default',
  size = 'md',
  asLink = false,
  showTagline = true,
  /** Override default "Management System" (e.g. login page). */
  tagline,
  taglineClassName,
  className = '',
}) {
  const isLight = variant === 'light'

  const titleSize = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-xl md:text-2xl font-bold',
  }[size]

  const taglineClass = isLight ? 'text-white/65' : 'text-slate-400'
  const titleClass = isLight ? 'text-white' : 'text-blue-600'

  const iconBox = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-10 h-10 md:w-11 md:h-11 rounded-xl',
  }[size]

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={`${iconBox} bg-blue-600 flex items-center justify-center shadow-sm shrink-0`} aria-hidden>
        <svg className="w-[55%] h-[55%] text-white" viewBox="0 0 32 32" fill="none">
          <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" d="M16 7v3M11 12h10M9 25V14.5L16 11l7 3.5V25" />
          <path stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" d="M12 17v6M16 17v6M20 17v6" />
          <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M7 25h18" />
        </svg>
      </span>
      <span className="min-w-0 text-left">
        <span className={`block ${titleSize} ${titleClass} font-headline tracking-tight`}>
          ICT Portal
        </span>
        {showTagline && (
          <span
            className={
              taglineClassName
                ?? `block text-[10px] sm:text-xs ${taglineClass} mt-0.5`
            }
          >
            {tagline ?? 'Management System'}
          </span>
        )}
      </span>
    </span>
  )

  if (asLink) {
    return (
      <Link to="/" className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 rounded-lg">
        {inner}
      </Link>
    )
  }

  return inner
}

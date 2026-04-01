import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogIn } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

const navLinks = [
  { label: 'Home',         href: '#hero' },
  { label: 'What we do',   href: '#features' },
  { label: 'How it works', href: '#about' },
  { label: 'Modules',      href: '#modules' },
  { label: 'Contact',      href: '#contact' },
]

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const scrollTo = (href) => {
    const id = href.replace('#', '')
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-slate-900/5 border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            <BrandLogo
              asLink
              variant={scrolled ? 'default' : 'light'}
              size="md"
            />

            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => scrollTo(link.href)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    scrolled
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-xl ${
                  scrolled ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50' : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Link>
              <Link
                to="/login"
                className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:-translate-y-0.5 ${
                  scrolled
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-blue-600/90 border border-blue-400/40 backdrop-blur-sm hover:bg-blue-600'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Staff portal
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              className={`md:hidden p-2 rounded-xl transition-colors ${
                scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          mobileOpen ? 'visible' : 'invisible'
        }`}
      >
        <div
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />

        <div
          className={`absolute top-0 right-0 h-full w-[min(100%,320px)] bg-white border-l border-slate-100 shadow-2xl transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <BrandLogo variant="default" size="md" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-3">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Staff portal
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

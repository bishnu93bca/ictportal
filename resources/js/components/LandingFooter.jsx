import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

const footerLinks = [
  {
    heading: 'On this page',
    links: [
      { label: 'Capabilities', href: '#features' },
      { label: 'How it works', href: '#about' },
      { label: 'Modules', href: '#modules' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    heading: 'Access',
    links: [
      { label: 'Staff sign in', href: '/login', route: true },
      { label: 'Forgot password', href: '/forgot-password', route: true },
    ],
  },
]

const scrollTo = (href) => {
  const id = href.replace('#', '')
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          <div className="lg:col-span-2">
            <div className="mb-5">
              <BrandLogo asLink variant="light" size="md" />
            </div>

            <p className="text-sm leading-relaxed max-w-md text-slate-400">
              A district education ICT workspace for grievance redressal, user administration, and audit-friendly
              operations — implemented as a Laravel API with a React single-page application.
            </p>

            <div className="mt-6 space-y-2.5">
              <a
                href="mailto:sunulcool@gmail.com"
                className="flex items-center gap-2.5 text-sm hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                info@ictportal.com
              </a>
              <a
                href="tel:+918882303885"
                className="flex items-center gap-2.5 text-sm hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                +91 (888) 230-3885
              </a>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Configure your organisation address in deployment settings.</span>
              </div>
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-widest">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.route ? (
                      <Link
                        to={link.href}
                        className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => scrollTo(link.href)}
                        className="text-sm text-slate-400 hover:text-blue-400 transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ICT Portal. For authorised use by education ICT teams.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              <span className="text-blue-400 font-medium">Laravel 12</span>
              <span className="mx-1">·</span>
              <span className="text-blue-300 font-medium">React</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

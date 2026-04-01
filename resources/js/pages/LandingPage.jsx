import { Link } from 'react-router-dom'
import LandingNavbar from '@/components/LandingNavbar'
import LandingFooter from '@/components/LandingFooter'
import {
  MessageSquare,
  ShieldCheck,
  BarChart3,
  Users,
  FolderTree,
  MapPin,
  FileText,
  Layers,
  Lock,
  ScrollText,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  LogIn,
  LayoutDashboard,
  ClipboardList,
  Landmark,
  Eye,
} from 'lucide-react'

/* ─── Content: district education ICT & grievance portal ─────────── */

const pillars = [
  { label: 'Role-based access',  hint: 'Super admin, admin, manager, teacher & more' },
  { label: 'District-aware data', hint: 'Scoped visibility for field teams' },
  { label: 'Complaint workflow',  hint: 'File, categorise, track & resolve' },
  { label: 'Audit-ready',         hint: 'Key actions logged for accountability' },
]

const features = [
  {
    icon: MessageSquare,
    color: 'blue',
    title: 'Complaints & grievances',
    description:
      'Raise ICT-related issues with categories, sub-categories, and attachments. Track status from submission through resolution.',
    bullets: ['Structured intake', 'File uploads', 'Status visibility for staff'],
  },
  {
    icon: FolderTree,
    color: 'indigo',
    title: 'Categories & taxonomy',
    description:
      'Maintain a clear hierarchy so complaints route to the right teams and reports stay meaningful.',
    bullets: ['Category / sub-category model', 'Admin-configurable', 'Consistent reporting'],
  },
  {
    icon: Users,
    color: 'violet',
    title: 'Users & roles',
    description:
      'Provision staff with UDISE or email login. Assign roles and districts so everyone sees only what they should.',
    bullets: ['District-scoped admins', 'Role guards on sensitive routes', 'Profile & access control'],
  },
  {
    icon: LayoutDashboard,
    color: 'cyan',
    title: 'Dashboard & operations',
    description:
      'A single place to monitor workload, navigate modules, and move between complaint management and user administration.',
    bullets: ['Role-aware navigation', 'Operational overview', 'Fast client-side navigation'],
  },
  {
    icon: Lock,
    color: 'emerald',
    title: 'Secure authentication',
    description:
      'API-first access with token-based sessions, hardened CORS, and policies on every sensitive action.',
    bullets: ['Laravel Sanctum', 'Policy checks', 'Session-aware SPA'],
  },
  {
    icon: ScrollText,
    color: 'amber',
    title: 'Activity & audit trail',
    description:
      'Super administrators can review authentication events and important changes for transparency.',
    bullets: ['Centralised audit log', 'Filterable history', 'Accountability by design'],
  },
]

const capabilities = [
  { icon: ClipboardList, label: 'Complaint intake & tracking',   color: 'blue',    desc: 'End-to-end lifecycle for reported issues' },
  { icon: FolderTree,    label: 'Category administration',      color: 'indigo',  desc: 'Keep taxonomies aligned with field reality' },
  { icon: Users,         label: 'User directory & roles',       color: 'violet',  desc: 'Provision and assign roles by mandate' },
  { icon: MapPin,        label: 'District context',             color: 'cyan',    desc: 'Data scoped where policies require it' },
  { icon: ShieldCheck,   label: 'RBAC & permissions',           color: 'emerald', desc: 'Fine-grained gates for each module' },
  { icon: BarChart3,     label: 'Reporting-ready structure',    color: 'amber',   desc: 'Built for exports and future analytics' },
]

const steps = [
  {
    step: '01',
    title: 'Authorised access',
    desc: 'Accounts are issued by administrators. Sign in with your email or UDISE code as provisioned.',
  },
  {
    step: '02',
    title: 'File or manage complaints',
    desc: 'Teachers and staff log issues with categories and evidence; admins triage and update status.',
  },
  {
    step: '03',
    title: 'Govern with confidence',
    desc: 'Roles, districts, and audit logs work together so leadership can trust the process.',
  },
]

const trustPoints = [
  {
    title: 'Built for the field',
    body: 'Designed around how district education ICT teams actually work — not generic SaaS fluff.',
    icon: Landmark,
  },
  {
    title: 'Transparent by design',
    body: 'Important actions leave a trace so oversight and improvement stay practical.',
    icon: Eye,
  },
  {
    title: 'Modern stack',
    body: 'Laravel API plus a React SPA: maintainable, fast, and straightforward to extend.',
    icon: Layers,
  },
]

/* ─── Color maps ────────────────────────────────────────────────── */

const iconBg = {
  blue:    'bg-blue-50   text-blue-600',
  indigo:  'bg-indigo-50 text-indigo-600',
  violet:  'bg-violet-50 text-violet-600',
  cyan:    'bg-cyan-50   text-cyan-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50  text-amber-600',
  orange:  'bg-orange-50 text-orange-600',
}

const gradientBorder = {
  blue:    'from-blue-500/20  to-blue-500/5',
  indigo:  'from-indigo-500/20 to-indigo-500/5',
  violet:  'from-violet-500/20 to-violet-500/5',
  cyan:    'from-cyan-500/20  to-cyan-500/5',
  emerald: 'from-emerald-500/20 to-emerald-500/5',
  amber:   'from-amber-500/20 to-amber-500/5',
}

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-widest">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
      {children}
    </span>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden">
      <LandingNavbar />

      {/* HERO */}
      <section
        id="hero"
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(37,99,235,0.35),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="absolute top-1/3 left-0 w-[420px] h-[420px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-white/85 text-xs font-semibold tracking-wide mb-8">
            <Landmark className="w-3.5 h-3.5 opacity-90" />
            District education ICT &amp; grievance redressal
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight text-balance font-headline">
            One portal for{' '}
            <span className="bg-gradient-to-r from-sky-300 via-white to-cyan-200 bg-clip-text text-transparent">
              ICT operations
            </span>{' '}
            and complaints
          </h1>

          <p className="mt-7 text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A secure workspace for education departments: file and track ICT-related grievances, manage users and
            categories by role, and keep accountability with structured access and audit visibility — not a generic
            school product brochure.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="group btn btn-primary px-7 py-3.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/25"
            >
              <LogIn className="w-4 h-4" />
              Staff sign in
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-white/10 backdrop-blur-sm border border-blue-400/35 text-white font-semibold rounded-xl hover:bg-white/15 transition-all duration-200 text-sm"
            >
              What this portal does
            </a>
          </div>

          <p className="mt-8 text-xs text-slate-500 max-w-md mx-auto">
            Complaint filing and management require an authorised account issued by your administrator.
          </p>
        </div>
      </section>

      {/* PILLARS */}
      <section className="bg-slate-900 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-10 md:py-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {pillars.map(({ label, hint }) => (
            <div key={label} className="text-center md:text-left">
              <p className="text-sm font-bold text-white font-headline">{label}</p>
              <p className="text-xs text-slate-400 mt-1 leading-snug">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 md:py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Capabilities</SectionLabel>
            <h2 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 font-headline">
              Built for{' '}
              <span className="text-blue-600">accountability</span>
              <br className="hidden sm:block" />
              <span className="text-slate-800"> and day-to-day ICT work</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-base md:text-lg">
              These are the real pillars of the application — aligned with how your team serves schools and districts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="relative card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                >
                  <div
                    className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${gradientBorder[f.color]} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg[f.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{f.description}</p>

                  <ul className="space-y-1.5">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="about" className="py-20 md:py-24 px-4 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 font-headline">
              From access to{' '}
              <span className="text-blue-600">resolution</span>
            </h2>
          </div>

          <div className="relative grid md:grid-cols-3 gap-10 md:gap-8">
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-blue-200 via-slate-200 to-blue-200" />

            {steps.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div
                  className={`relative z-10 w-[4.5rem] h-[4.5rem] rounded-2xl flex flex-col items-center justify-center mb-5 shadow-lg font-headline text-white text-xl font-black ${
                    i === 0
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-900/20'
                      : i === 1
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-900/20'
                        : 'bg-gradient-to-br from-cyan-600 to-teal-700 shadow-teal-900/20'
                  }`}
                >
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section id="modules" className="py-20 md:py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>At a glance</SectionLabel>
            <h2 className="mt-5 text-3xl md:text-5xl font-black text-slate-900 font-headline">
              Modules that match{' '}
              <span className="text-blue-600">your mandate</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto text-base md:text-lg">
              Focused building blocks — not a laundry list of unrelated products.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {capabilities.map(({ icon: Icon, label, color, desc }) => (
              <div
                key={label}
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg[color]} group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{label}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all"
            >
              Open the application after sign-in
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-20 md:py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Why teams use it</SectionLabel>
            <h2 className="mt-5 text-3xl md:text-4xl font-black text-slate-900 font-headline">
              Clarity over marketing noise
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {trustPoints.map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-white p-6 hover:border-blue-100 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="relative py-24 md:py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <FileText className="w-10 h-10 text-blue-300 mx-auto mb-6" />

          <h2 className="text-3xl md:text-5xl font-black text-white font-headline leading-tight">
            Ready to work inside the portal?
          </h2>
          <p className="mt-5 text-slate-300 text-base md:text-lg leading-relaxed">
            Use your issued credentials. For access requests or technical issues, contact your district ICT
            coordinator or the helpdesk channel your organisation has published.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="group flex items-center gap-2.5 px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-all duration-200 text-sm"
            >
              Go to sign in
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="mailto:info@ictportal.com"
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-blue-400/40 text-white font-semibold rounded-xl hover:bg-white/15 transition-all duration-200 text-sm"
            >
              Email helpdesk
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-slate-400 text-xs">
            {['No public self-registration', 'Role-based routes', 'Audit visibility for super admins'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

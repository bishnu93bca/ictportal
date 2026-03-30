import React from "react";
import ReactDOM from "react-dom/client";
import "../css/app.css";
function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-8 py-5 bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0">
        <h1 className="text-2xl font-bold tracking-wide text-cyan-400">ICT Portal</h1>
        <nav className="hidden md:flex space-x-8 text-sm text-gray-300">
          <a href="#features" className="hover:text-cyan-400">Features</a>
          <a href="#stats" className="hover:text-cyan-400">Stats</a>
          <a href="#about" className="hover:text-cyan-400">About</a>
          <a href="#contact" className="hover:text-cyan-400">Contact</a>
        </nav>
        <button className="bg-cyan-500 hover:bg-cyan-600 px-5 py-2 rounded-xl font-medium">
          Login
        </button>
      </header>

      {/* Hero */}
      <section className="relative text-center px-6 py-28 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,cyan,transparent)]"></div>
        <h2 className="text-5xl md:text-7xl font-extrabold leading-tight">
          Smart Digital
          <span className="text-cyan-400"> ICT Portal</span>
        </h2>
        <p className="mt-6 text-gray-400 max-w-2xl mx-auto">
          A modern unified platform for analytics, management, automation and secure digital services.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <button className="bg-cyan-500 px-6 py-3 rounded-xl hover:bg-cyan-600">
            Get Started
          </button>
          <button className="border border-gray-600 px-6 py-3 rounded-xl hover:border-cyan-400">
            Explore
          </button>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="grid md:grid-cols-4 gap-6 px-8 py-16 text-center">
        {[
          { label: "Users", value: "10K+" },
          { label: "Projects", value: "500+" },
          { label: "Uptime", value: "99.9%" },
          { label: "Security", value: "A+" },
        ].map((s, i) => (
          <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <h3 className="text-3xl font-bold text-cyan-400">{s.value}</h3>
            <p className="text-gray-400 mt-2">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20 bg-black/60">
        <h3 className="text-3xl font-bold text-center mb-12">Core Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "AI Dashboard", desc: "Real-time insights with smart analytics engine." },
            { title: "Secure Access", desc: "Role-based authentication with encryption." },
            { title: "Cloud Ready", desc: "Scalable architecture for modern applications." },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500 transition">
              <h4 className="text-xl font-semibold text-cyan-300">{f.title}</h4>
              <p className="text-gray-400 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-8 py-20 text-center">
        <h3 className="text-3xl font-bold mb-4">About ICT Portal</h3>
        <p className="text-gray-400 max-w-3xl mx-auto">
          ICT Portal is a next-generation digital system designed for scalability, automation, and enterprise-grade performance with a modern user experience.
        </p>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <h3 className="text-3xl font-bold">Ready to upgrade your system?</h3>
        <p className="text-gray-400 mt-3">Start using ICT Portal today and transform your workflow.</p>
        <button className="mt-6 bg-cyan-500 px-6 py-3 rounded-xl hover:bg-cyan-600">
          Launch Now
        </button>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center border-t border-white/10 text-gray-500">
        © {new Date().getFullYear()} ICT Portal. Built with modern tech.
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);

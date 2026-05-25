import { Link } from 'react-router-dom'
import logo from '../assets/Logo.png'
import heroImage from '../assets/Full_Image.png'

function SignIn() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-night-900 text-slate-200">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-hero opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-graph opacity-70" />
      <main className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_1.1fr]">
        <div className="glass-card p-8">
          <Link className="text-sm text-cyan-300" to="/">
            Back to dashboard
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10">
              <img src={logo} alt="FinPulse logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">FinPulse</p>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                AI Market Pulse
              </p>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your watchlists, alerts, and personalized briefings.
          </p>
          <form className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@finpulse.ai"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/60 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/60 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input type="checkbox" name="remember" className="h-4 w-4" />
                Remember me
              </label>
              <button
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2 text-sm font-semibold text-night-950 shadow-glow"
                type="submit"
              >
                Sign in
              </button>
            </div>
            <button
              className="w-full rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/60"
              type="button"
            >
              Continue with Google
            </button>
          </form>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 shadow-glass">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        </div>
      </main>
    </div>
  )
}

export default SignIn

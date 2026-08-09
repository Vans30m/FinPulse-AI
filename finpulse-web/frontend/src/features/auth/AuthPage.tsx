import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication and route back to dashboard
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-night-900 text-slate-900 dark:text-slate-200 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Grid Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-grid opacity-60 dark:opacity-40" />

      {/* Top Navigation Bar (Minimal) */}
      <div className="absolute top-0 w-full p-6 z-20 flex justify-between items-center">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Centered Auth Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-0 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 dark:bg-cyan-400 text-white dark:text-night-900 shadow-lg mb-4">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome to FinPulse<span className="text-blue-600 dark:text-cyan-400">.ai</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {isSignUp ? 'Create your account to start trading.' : 'Sign in to access your dashboard.'}
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-slate-100 dark:bg-night-800/80 pl-10 pr-4 py-2.5 text-sm rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {!isSignUp && (
                  <a href="#" className="text-xs font-medium text-blue-600 dark:text-cyan-400 hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-100 dark:bg-night-800/80 pl-10 pr-10 py-2.5 text-sm rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-night-900 shadow-md transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 hover:shadow-lg hover:-translate-y-0.5 mt-2"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Social Logins Divider */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          {/* OAuth Placeholder Button */}
          <button className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-800/50 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-white/5">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
        </div>

        {/* Toggle Sign Up / Login */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Create one'}
          </button>
        </div>

        {/* Security Trust Badge */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Bank-level 256-bit encryption</span>
        </div>

      </div>
    </div>
  );
}
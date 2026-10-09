import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Github,
  ShieldAlert,
  Mail,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';

// Explicit interfaces for clean sitemap mapping
interface FooterLink {
  label: string;
  to: string;
  isExternal?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export default function Footer() {
  const location = useLocation();
  const isScreener = location.pathname.startsWith('/screener');
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Organized Information Architecture (Simplified)
  const sitemap: FooterSection[] = [
    {
      title: "Product",
      links: [
        { label: "Pulse Dashboard", to: "/pulse" },
        { label: "Stock Screener", to: "/screener" },
        { label: "Portfolio", to: "/portfolio" },
        { label: "Performance", to: "/performance" },
        { label: "Watchlists", to: "/watchlist" },
        { label: "News", to: "/news" },
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About FinPulse", to: "/about" },
        { label: "Contact Support", to: "/contact" },
        { label: "System Status", to: "/status" },
        { label: "API Documentation", to: "/api-docs" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Terms of Service", to: "/terms" },
        { label: "Cookie Policy", to: "/cookies" },
        { label: "Risk Disclosure", to: "/risk-disclosure" }
      ]
    }
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setStatus('error');
    }
  };

  return (
    <footer className="w-full border-t border-slate-200 dark:border-[#242424] bg-white dark:bg-[#080808] mt-auto transition-colors duration-300">
      <div className={`mx-auto pt-10 pb-6 sm:px-6 lg:px-8 ${isScreener ? 'max-w-none px-4 sm:px-8' : 'max-w-[1440px] px-4'}`}>

        {/* Upper Master Grid */}
        <div className="grid grid-cols-1 gap-10 pb-10 lg:grid-cols-5 lg:gap-8">

          {/* Brand & Value Proposition Column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                FinPulse<span className="text-blue-600 dark:text-cyan-400">.ai</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-[#a3a3a3] max-w-sm">
              Empowering algorithmic traders and institutional investors with secure, real-time computational market sentiment intelligence.
            </p>

            <form onSubmit={handleSubscribe} className="max-w-sm space-y-2.5">
              <label htmlFor="footer-email" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-[#737373]">
                <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" /> Market brief
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={status === 'loading' || status === 'success'}
                  className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-[#242424] dark:bg-[#111111] dark:text-[#f5f5f5] dark:placeholder:text-[#737373] dark:focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="footer-newsletter-submit inline-flex min-h-9 min-w-[68px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white opacity-100 transition-colors hover:bg-blue-500 dark:bg-cyan-500 dark:text-[#07110a] dark:hover:bg-cyan-400 disabled:cursor-default disabled:opacity-100"
                >
                  {status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  {status === 'success' ? 'Joined' : status === 'loading' ? '...' : 'Join'}
                </button>
              </div>
              {status === 'error' && <p className="text-[10px] text-rose-500">Subscription failed. Please try again.</p>}
              {status === 'success' && <p className="text-[10px] text-blue-600 dark:text-cyan-400">You are on the market brief list.</p>}
            </form>

            {/* Social Interactivity Cluster */}
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <a href="https://github.com/Vans30m/FinPulse-AI.git" target="_blank" rel="noreferrer" className="rounded-md border border-slate-200 p-2 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-600 dark:border-[#242424] dark:hover:border-cyan-400/40 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 transition-all duration-200" aria-label="GitHub Repository">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Dynamic Sitemap Navigation Links */}
          <div className="grid grid-cols-3 gap-6 lg:col-span-3">
            {sitemap.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-900 dark:text-[#f5f5f5]">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.isExternal ? (
                        <a
                          href={link.to}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-1 py-1.5 text-sm text-slate-500 hover:text-blue-600 dark:text-[#a3a3a3] dark:hover:text-cyan-400 transition-colors duration-200"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          className="group inline-flex items-center gap-1 py-1.5 text-sm text-slate-500 hover:text-blue-600 dark:text-[#a3a3a3] dark:hover:text-cyan-400 transition-colors duration-200"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>



        {/* Lower Regulatory & Regulatory Compliance Asset Section */}
        <div className="pt-8 space-y-6">
          <div className="flex items-start gap-3.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.05] dark:bg-amber-500/[0.04] p-4 sm:p-5 text-xs leading-relaxed text-slate-500 dark:text-[#a3a3a3] max-w-6xl mx-auto shadow-sm">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/10">
              <ShieldAlert className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p>
                <span className="font-bold text-slate-800 dark:text-[#f5f5f5]">SEBI Regulatory Compliance Statement:</span>{' '}
                AI-driven computational insights, natural language sentiment processing metrics, and structural summaries displayed via FinPulse AI are computed for foundational educational informational indexes only. They do not comprise or signify SEBI-registered portfolio management or certified investment consultancy suggestions.
              </p>
              <p className="mt-1.5 font-medium text-slate-600 dark:text-[#737373]">
                Trading securities involves significant financial exposure. Past computational tracking behaviors are not continuous guarantees of positive forward iterations. Please check with an active certified investment advisor before trading assets.
              </p>
            </div>
          </div>

          {/* Sub-Footer Meta Attributions */}
          <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 text-[11px] font-medium text-slate-400 dark:border-[#242424] dark:text-[#737373] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-cyan-400" />
              <p>© {currentYear} FinPulse.ai Technologies Inc. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#8a8a8a] sm:text-right">
              <p>Secure data practices · Powered by custom financial models</p>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
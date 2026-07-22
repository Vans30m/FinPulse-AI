import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Twitter,
  Linkedin,
  Github,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Loader2
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
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Organized Information Architecture
  const sitemap: FooterSection[] = [
    {
      title: "Platform",
      links: [
        { label: "Pulse Engine", to: "/" },
        { label: "Market Sentiment", to: "/markets" },
        { label: "Advanced Analytics", to: "/analytics" },
        { label: "Pricing Tiers", to: "/pricing" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", to: "/docs" },
        { label: "API Reference", to: "/api" },
        { label: "Market Insights", to: "/blog" },
        { label: "System Status", to: "/status", isExternal: true }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About FinPulse", to: "/about" },
        { label: "Careers", to: "/careers" },
        { label: "Press Kit", to: "/press" },
        { label: "Contact Support", to: "/contact" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", to: "/privacy" },
        { label: "Terms of Service", to: "/terms" },
        { label: "Risk Disclosures", to: "/disclosures" },
        { label: "Cyber Security", to: "/security" }
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
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md mt-auto transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">

        {/* Upper Master Grid */}
        <div className="grid grid-cols-1 gap-12 pb-12 lg:grid-cols-6 lg:gap-8">

          {/* Brand & Value Proposition Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                FinPulse<span className="text-blue-600 dark:text-cyan-400">.ai</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm">
              Empowering algorithmic traders and institutional investors with secure, real-time computational market sentiment intelligence.
            </p>
            {/* Social Interactivity Cluster */}
            <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-sky-500 transition-all duration-200" aria-label="Twitter X Link">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 transition-all duration-200" aria-label="LinkedIn Link">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white transition-all duration-200" aria-label="GitHub Repository">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Dynamic Sitemap Navigation Links */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-4">
            {sitemap.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-slate-200">
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
                          className="inline-block py-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-transform duration-200 hover:translate-x-1"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          className="inline-block py-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-transform duration-200 hover:translate-x-1"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Conversion Grid (Newsletter Subscription Banner) */}
        <div className="border-y border-slate-200 dark:border-slate-800/60 py-8 my-4 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Subscribe to Intelligence Dispatches</h3>
            <p className="text-xs text-slate-555 dark:text-slate-400 mt-1">Get advanced sentiment alerts delivered directly to your workstation.</p>
          </div>
          <div className="lg:col-span-2">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row max-w-md w-full gap-2.5 sm:ml-auto">
              <input
                type="email"
                required
                value={email}
                disabled={status === 'loading' || status === 'success'}
                placeholder="Enter Your Email Address"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 dark:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 transition-all hover:bg-blue-700 dark:hover:bg-cyan-400 disabled:bg-emerald-600 disabled:text-white whitespace-nowrap min-h-[44px]"
              >
                {status === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {status === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {status === 'idle' && (
                  <>
                    Subscribe <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
                {status === 'success' ? 'Added' : status === 'loading' ? 'Processing' : ''}
              </button>
            </form>
          </div>
        </div>

        {/* Lower Regulatory & Regulatory Compliance Asset Section */}
        <div className="pt-8 space-y-6">
          <div className="flex gap-3.5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] p-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-6xl mx-auto shadow-sm">
            <ShieldAlert className="h-5 w-5 text-amber-500 dark:text-amber-400/80 shrink-0 mt-0.5" />
            <div>
              <p>
                <span className="font-bold text-slate-800 dark:text-slate-200">SEBI Regulatory Compliance Statement:</span> AI-driven computational insights, natural language sentiment processing metrics, and structural summaries displayed via FinPulse AI are computed for foundational educational informational indexes only. They do not comprise or signify SEBI-registered portfolio management or certified investment consultancy suggestions.
              </p>
              <p className="mt-1.5 font-medium text-slate-600 dark:text-slate-500">
                Trading securities involves significant financial exposure. Past computational tracking behaviors are not continuous guarantees of positive forward iterations. Please check with an active certified investment advisor before trading assets.
              </p>
            </div>
          </div>

          {/* Sub-Footer Meta Attributions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <p>© {currentYear} FinPulse AI Technologies Inc. All configurations reserved.</p>
            <p className="flex items-center gap-1">
              Built via continuous encryption standards. Powered by custom financial models.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
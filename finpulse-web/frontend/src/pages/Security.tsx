import { Lock, Eye, Cpu, ShieldCheck } from "lucide-react";

export default function Security() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400">
          <Lock className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Trust & Cyber Security</h1>
          <p className="text-xs text-slate-400 mt-1">Platform Integrity & Compliance Center</p>
        </div>
      </div>

      {/* Grid of Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 space-y-3">
          <Eye className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Data Encryption</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All database tables, portfolio details, API logs, and watchlists are encrypted using AES-256 standards in transit and at rest.
          </p>
        </div>

        <div className="glass-panel p-6 space-y-3">
          <Cpu className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Key Management</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            API keys are cryptographically hashed using Argon2id hashes, preventing key leakage in database breaches.
          </p>
        </div>

        <div className="glass-panel p-6 space-y-3">
          <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">SOC 2 / HIPAA</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            FinPulse AI aligns with SOC 2 Type II trust principles, conducting bi-annual external audit runs to verify controls.
          </p>
        </div>
      </div>

      {/* Trust Content */}
      <div className="glass-panel p-8 space-y-6 text-sm text-slate-650 dark:text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reporting Vulnerabilities (Bug Bounty)</h2>
        <p>
          We operate a managed bug bounty system for security research reports. If you identify a credential bypass, SQL injection hazard, or API rate containment failure, please file a detailed report to <strong>security@finpulse.ai</strong> immediately.
        </p>
        <p>
          Do not execute public disclosures until our engineering desk verifies and remediates the report. Eligible findings qualify for financial bounty bounties.
        </p>
      </div>
    </div>
  );
}

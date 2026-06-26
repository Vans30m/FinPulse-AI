import { Check, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  const faqs = [
    { q: "How is market sentiment computed?", a: "FinPulse AI analyzes real-time articles, financial news feeds, and social sentiment indexes to compile an aggregated market brief." },
    { q: "Can I cancel my subscription at any time?", a: "Yes, you can cancel your subscription from your billing dashboard with single-click actions. There are no locking contracts." },
    { q: "What data frequencies are supported?", a: "Basic updates check indices every 5 minutes. Pro supports real-time streams, while Enterprise supports milliseconds Webhook events." }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Flexible Plans for Every Trader
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Scale your market intelligence with high-fidelity sentiment data and lightning-fast webhooks.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-sm font-semibold ${billingCycle === "monthly" ? "text-blue-600 dark:text-cyan-400" : "text-slate-400"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="relative h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors"
          >
            <div
              className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-blue-600 dark:bg-cyan-400 transition-transform ${
                billingCycle === "yearly" ? "translate-x-5" : ""
              }`}
            />
          </button>
          <span className={`text-sm font-semibold ${billingCycle === "yearly" ? "text-blue-600 dark:text-cyan-400" : "text-slate-400"}`}>
            Yearly <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 ml-1">Save 20%</span>
          </span>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Basic */}
        <div className="glass-panel p-8 flex flex-col justify-between border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Basic</h3>
            <p className="text-xs text-slate-400 mt-1">For casual market observers</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
              <span className="text-sm text-slate-400 ml-2">/ month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Delayed Sentiment Feed (5 mins)
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Standard Market Indices
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Basic Portfolio Mocking
              </li>
            </ul>
          </div>
          <button className="mt-8 w-full rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-bold text-slate-900 dark:text-white transition-colors">
            Get Started
          </button>
        </div>

        {/* Pro */}
        <div className="glass-panel p-8 flex flex-col justify-between border-blue-500/30 dark:border-cyan-500/30 relative">
          <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-blue-600 dark:bg-cyan-500 px-3.5 py-1 text-xs font-bold text-white dark:text-slate-950">
            Most Popular
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro</h3>
            <p className="text-xs text-slate-400 mt-1">For active individual traders</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {billingCycle === "monthly" ? "$49" : "$39"}
              </span>
              <span className="text-sm text-slate-400 ml-2">/ month</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Real-Time Live News Feed
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Predictive Volatility Analytics
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Advanced Watchlist Controls
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Custom SMS / Email Alerts
              </li>
            </ul>
          </div>
          <button className="mt-8 w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-slate-950 transition-colors">
            Subscribe Pro
          </button>
        </div>

        {/* Enterprise */}
        <div className="glass-panel p-8 flex flex-col justify-between border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise</h3>
            <p className="text-xs text-slate-400 mt-1">For hedge funds & institutions</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Custom</span>
            </div>
            <ul className="mt-8 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Millisecond Webhook Streams
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Direct Database Replications
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                SLA Support Guarantees
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Unlimited Watchlists & Alerts
              </li>
            </ul>
          </div>
          <button className="mt-8 w-full rounded-xl bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 py-3 text-sm font-bold text-white dark:text-slate-950 transition-colors">
            Contact Sales
          </button>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-16 max-w-4xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <HelpCircle className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-6">
              <h4 className="font-bold text-slate-900 dark:text-white">{faq.q}</h4>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

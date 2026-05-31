export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-night-950/60 py-8 px-6 mt-auto transition-colors duration-300">
      <div className="mx-auto max-w-7xl text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <p>© {new Date().getFullYear()} FinPulse AI. All rights reserved.</p>
        <p className="max-w-3xl mx-auto leading-relaxed">
          Disclaimer: AI-generated summaries and sentiment analysis values are for informational purposes only and do not constitute SEBI-registered investment advice. Please consult a certified financial advisor before executing trades.
        </p>
      </div>
    </footer>
  );
}


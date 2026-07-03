export default function FearGreedIndex() {
    const score = 65; // Dynamic index score (0-100)

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Fear & Greed Index</h3>
            <div className="relative flex flex-col items-center justify-center">
                {/* Simple SVG Arc representation */}
                <svg className="w-40 h-24" viewBox="0 0 100 50">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" className="dark:stroke-slate-800" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray="126" strokeDashoffset={126 - (126 * score) / 100} />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="50%" stopColor="#eab308" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute bottom-2 text-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{score}</span>
                    <p className="text-xs font-bold text-emerald-500 tracking-wide uppercase mt-1">Greed</p>
                </div>
            </div>
        </div>
    );
}
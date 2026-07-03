export default function AIBulletSummary() {
    const insights = [
        "Federal Reserve hints at steady interest rates amid resilient jobs data output.",
        "Tech sector leads morning recovery as semiconductor chip manufacturing stabilizes.",
        "Crude Oil falls 1.4% following supply chain optimization milestones in European hubs."
    ];

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
            <div className="flex items-center space-x-2 mb-4">
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold rounded-md uppercase tracking-wider">AI Insight</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Global Market Pulse</h3>
            </div>
            <ul className="space-y-3.5">
                {insights.map((bullet, index) => (
                    <li key={index} className="flex items-start space-x-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-indigo-500 font-bold mt-0.5">•</span>
                        <span>{bullet}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
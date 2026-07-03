export default function AIPickOfTheDay() {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">AI Pick of the Day</span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">NVDA</h3>
                </div>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                    Strong Buy
                </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                NVIDIA Corp shows key structural breakouts with an internal metric confirmation score of 94%.
            </p>
            <div className="grid grid-cols-2 gap-3 text-center border-t border-slate-100 dark:border-white/5 pt-4">
                <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Target</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">$135.00</p>
                </div>
                <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Stop Loss</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">$118.50</p>
                </div>
            </div>
        </div>
    );
}
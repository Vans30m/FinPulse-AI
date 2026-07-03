export default function TrendingSectorStreaks() {
  const sectors = [
    { name: "Information Technology", streak: "5d Rally", up: true },
    { name: "Energy & Utilities", streak: "3d Decline", up: false },
    { name: "Financial Services", streak: "2d Rally", up: true },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Sector Streaks</h3>
      <div className="space-y-3">
        {sectors.map((sector, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">{sector.name}</span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${sector.up
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
              : "bg-rose-50 dark:bg-rose-950/50 text-rose-600"
              }`}>
              {sector.streak}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
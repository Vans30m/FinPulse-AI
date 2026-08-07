
interface MarketOption {
  id: string;
  label: string;
  flag: string;
}

interface PreferenceCardProps {
  options: MarketOption[];
  selectedMarkets: string[];
  onToggleMarket: (id: string) => void;
}

export default function PreferenceCard({
  options,
  selectedMarkets,
  onToggleMarket
}: PreferenceCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-5">
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Favorite Markets</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select and filter your active market indexes dashboard defaults.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = selectedMarkets.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onToggleMarket(opt.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                isSelected
                  ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500 text-blue-600 dark:text-cyan-400 dark:border-cyan-500/60 shadow-md shadow-blue-500/5"
                  : "bg-slate-50 dark:bg-white/[0.01] border-slate-200/65 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.03]"
              }`}
            >
              <span className="text-lg leading-none">{opt.flag}</span>
              <span className="text-xs font-black uppercase tracking-wider">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

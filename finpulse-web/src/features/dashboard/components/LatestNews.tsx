import { Newspaper, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Define the impact levels
type ImpactLevel = 'high' | 'medium' | 'low';

interface NewsItem {
  id: string;
  time: string;
  currency: string;
  impact: ImpactLevel;
  title: string;
}

// Mock Data representing an Economic Calendar feed
const MOCK_NEWS: NewsItem[] = [
  { id: '1', time: '8:30 AM', currency: 'USD', impact: 'high', title: 'Core CPI m/m' },
  { id: '2', time: '8:30 AM', currency: 'USD', impact: 'high', title: 'CPI m/m' },
  { id: '3', time: '8:30 AM', currency: 'USD', impact: 'medium', title: 'CPI y/y' },
  { id: '4', time: '10:00 AM', currency: 'EUR', impact: 'low', title: 'German Buba President Nagel Speaks' },
  { id: '5', time: '1:00 PM', currency: 'GBP', impact: 'high', title: 'Monetary Policy Report Hearings' },
  { id: '6', time: '2:15 PM', currency: 'USD', impact: 'low', title: 'Federal Budget Balance' },
  { id: '7', time: '7:50 PM', currency: 'JPY', impact: 'medium', title: 'Bank Lending y/y' },
];

export default function LatestNews() {
  
  // Maps the impact level to the specific Forex Factory colors
  const getImpactColor = (impact: ImpactLevel) => {
    switch (impact) {
      case 'high': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'; // Red with soft glow
      case 'medium': return 'bg-amber-400'; // Yellow
      case 'low': return 'bg-slate-400'; // Grey
    }
  };

  return (
    <div className="glass-panel p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          Economic Calendar
        </h2>
        <Link 
          to="/calendar" 
          className="text-xs text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          Full Feed <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* News List */}
      <div className="space-y-1 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        {MOCK_NEWS.map((news) => (
          <div
            key={news.id}
            className="group flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-200 dark:border-white/5 last:border-0"
          >
            {/* Time */}
            <div className="w-16 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {news.time}
            </div>

            {/* Impact Icon (The Forex Factory square) */}
            <div className="flex items-center justify-center w-6 flex-shrink-0">
              <div className={`w-3 h-3 rounded-sm ${getImpactColor(news.impact)}`} />
            </div>

            {/* Currency/Asset */}
            <div className="w-10 flex-shrink-0 text-xs font-bold text-slate-500 dark:text-slate-300">
              {news.currency}
            </div>

            {/* Title */}
            <div className="flex-1 text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white line-clamp-1">
              {news.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
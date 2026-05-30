import { ArrowLeft, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

// Expanded Mock Data for the full page
type ImpactLevel = 'high' | 'medium' | 'low';

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  impact: ImpactLevel;
  title: string;
  actual: string;
  forecast: string;
  previous: string;
}

const FULL_CALENDAR_DATA: CalendarEvent[] = [
  { id: '1', date: 'Today', time: '8:30 AM', currency: 'USD', impact: 'high', title: 'Core CPI m/m', actual: '0.3%', forecast: '0.3%', previous: '0.4%' },
  { id: '2', date: 'Today', time: '8:30 AM', currency: 'USD', impact: 'high', title: 'CPI m/m', actual: '0.4%', forecast: '0.4%', previous: '0.3%' },
  { id: '3', date: 'Today', time: '8:30 AM', currency: 'USD', impact: 'medium', title: 'CPI y/y', actual: '3.5%', forecast: '3.4%', previous: '3.2%' },
  { id: '4', date: 'Today', time: '10:00 AM', currency: 'EUR', impact: 'low', title: 'German Buba President Nagel Speaks', actual: '', forecast: '', previous: '' },
  { id: '5', date: 'Tomorrow', time: '1:00 PM', currency: 'GBP', impact: 'high', title: 'Monetary Policy Report', actual: '', forecast: '', previous: '' },
  { id: '6', date: 'Tomorrow', time: '1:30 PM', currency: 'USD', impact: 'high', title: 'PPI m/m', actual: '', forecast: '0.3%', previous: '0.6%' },
];

export default function CalendarPage() {
  const getImpactColor = (impact: ImpactLevel) => {
    switch (impact) {
      case 'high': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
      case 'medium': return 'bg-amber-400';
      case 'low': return 'bg-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 text-slate-700 dark:text-slate-200 p-6 sm:p-12 relative overflow-hidden">
      {/* Background Graphic Lines Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid opacity-30" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-hero opacity-50" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <button className="flex items-center gap-2 text-sm text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 transition-colors glass-panel px-4 py-2">
            <Filter className="h-4 w-4" />
            Filter Impact
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-cyan-400" />
            Global Economic Calendar
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Real-time tracking of market-moving events and macroeconomic data releases.
          </p>
        </div>

        {/* Calendar Data Table */}
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-night-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">Date / Time</div>
            <div className="col-span-1 text-center">Cur</div>
            <div className="col-span-1 text-center">Imp</div>
            <div className="col-span-5">Event</div>
            <div className="col-span-1 text-right">Actual</div>
            <div className="col-span-1 text-right">Forecast</div>
            <div className="col-span-1 text-right">Previous</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {FULL_CALENDAR_DATA.map((event) => (
              <div 
                key={event.id} 
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <div className="col-span-2 flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{event.date}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{event.time}</span>
                </div>
                
                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-white/10 px-2 py-1 rounded">
                    {event.currency}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center">
                  <div className={`w-3 h-3 rounded-sm ${getImpactColor(event.impact)}`} title={`${event.impact} impact`} />
                </div>

                <div className="col-span-5 text-sm text-slate-700 dark:text-slate-200 font-medium">
                  {event.title}
                </div>

                <div className="col-span-1 text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {event.actual || '-'}
                </div>
                <div className="col-span-1 text-right text-sm text-slate-500 dark:text-slate-400">
                  {event.forecast || '-'}
                </div>
                <div className="col-span-1 text-right text-sm text-slate-500 dark:text-slate-400">
                  {event.previous || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
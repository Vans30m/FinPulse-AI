import { Bell } from 'lucide-react';

// Define the shape of the data based on your mockData.json
interface AlertItem {
  time: string;
  tag: string;
  title: string;
  detail: string;
}

interface AlertsTimelineProps {
  initialData: AlertItem[];
}

export default function AlertsTimeline({ initialData }: AlertsTimelineProps) {
  return (
    <div className="glass-card p-6" id="alerts">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Alerts Timeline</h2>
        <Bell className="h-4 w-4 text-blue-600 dark:text-cyan-300" />
      </div>
      <div className="mt-4 space-y-4">
        {initialData.map((alert) => (
          <div key={`${alert.time}-${alert.title}`} className="flex gap-3">
            <div className="mt-2 h-2 w-2 rounded-full bg-blue-600 dark:bg-cyan-300 shadow-glow" />
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{alert.time}</span>
                <span className="rounded-full bg-slate-200 dark:bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  {alert.tag}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {alert.title}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-300">{alert.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
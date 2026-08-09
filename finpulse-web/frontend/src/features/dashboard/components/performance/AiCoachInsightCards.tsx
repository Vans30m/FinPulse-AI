import { ShieldAlert, Sparkles, Target, Telescope } from "lucide-react";
import type { CoachInsightBucket } from "./aiPerformanceCoachTypes";

interface Props {
  insights: CoachInsightBucket[];
}

const iconMap = {
  "Performance Strengths": Sparkles,
  "Risk Analysis": ShieldAlert,
  "Improvement Suggestions": Target,
  "Future Outlook": Telescope,
};

export default function AiCoachInsightCards({ insights }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((bucket) => {
        const Icon = iconMap[bucket.title];
        return (
          <div key={bucket.title} className="rounded-2xl border border-slate-900 bg-[#050711]/70 p-4 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-900 pb-2.5">
              <Icon className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">{bucket.title}</span>
            </div>
            <div className="space-y-2">
              {bucket.points.map((point) => (
                <p key={point} className="text-xs text-slate-300 leading-relaxed">{point}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

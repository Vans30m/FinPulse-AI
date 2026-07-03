import { motion } from "framer-motion";
import type { CoachRating } from "./aiPerformanceCoachTypes";

interface Props {
  score: number;
  rating: CoachRating;
}

export default function AiCoachScoreRing({ score, rating }: Props) {
  const size = 190;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(score, 100)) / 100) * circumference;

  const ratingTone =
    rating === "Excellent"
      ? "text-emerald-400"
      : rating === "Good"
        ? "text-cyan-400"
        : rating === "Average"
          ? "text-amber-400"
          : "text-rose-400";

  return (
    <div className="rounded-3xl border border-slate-900 bg-[#050711]/70 p-5 flex flex-col items-center justify-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(51,65,85,0.5)" strokeWidth={stroke} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ai-coach-gradient)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="ai-coach-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-5xl font-black text-white font-mono leading-none">{score}</p>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">/ 100 Score</p>
        </div>
      </div>

      <p className={`mt-3 text-sm font-black uppercase tracking-wide ${ratingTone}`}>{rating}</p>
    </div>
  );
}

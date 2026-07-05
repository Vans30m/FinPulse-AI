import { useEffect, useState } from 'react';

interface FearGreedData {
    score: number;
    label: string;
    description: string;
    colorClass: string;
    gradientClass: string;
    glowClass: string;
}

export default function FearGreedIndex() {
    const targetScore = 65;
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const duration = 1500; // 1.5 seconds

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Cubic ease-out
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.floor(easeOutCubic * targetScore));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [targetScore]);

    // Determine state details based on the animated score
    const getStateDetails = (val: number): FearGreedData => {
        if (val <= 25) {
            return {
                score: val,
                label: 'Extreme Fear',
                description: 'Market is in panic. Potential buying opportunity.',
                colorClass: 'text-rose-500 dark:text-rose-400',
                gradientClass: 'from-rose-600 to-rose-400',
                glowClass: 'shadow-rose-500/20 dark:shadow-rose-500/10',
            };
        } else if (val <= 45) {
            return {
                score: val,
                label: 'Fear',
                description: 'Investors are cautious. Check fundamentals.',
                colorClass: 'text-orange-500 dark:text-orange-400',
                gradientClass: 'from-orange-600 to-amber-400',
                glowClass: 'shadow-orange-500/20 dark:shadow-orange-500/10',
            };
        } else if (val <= 55) {
            return {
                score: val,
                label: 'Neutral',
                description: 'Market is balanced. No clear directional bias.',
                colorClass: 'text-amber-500 dark:text-amber-400',
                gradientClass: 'from-amber-500 to-yellow-400',
                glowClass: 'shadow-amber-500/20 dark:shadow-amber-500/10',
            };
        } else if (val <= 75) {
            return {
                score: val,
                label: 'Greed',
                description: 'Bullish sentiment. Watch for overvaluation.',
                colorClass: 'text-emerald-500 dark:text-emerald-400',
                gradientClass: 'from-emerald-500 to-teal-400',
                glowClass: 'shadow-emerald-500/20 dark:shadow-emerald-500/10',
            };
        } else {
            return {
                score: val,
                label: 'Extreme Greed',
                description: 'High FOMO. Market might be due for a correction.',
                colorClass: 'text-teal-500 dark:text-cyan-400',
                gradientClass: 'from-teal-500 to-cyan-400',
                glowClass: 'shadow-teal-500/20 dark:shadow-teal-500/10',
            };
        }
    };

    const currentState = getStateDetails(animatedScore);

    // Calculate coordinate of the glowing indicator dot on the arc
    // Radius r = 40, Center = (50, 50)
    // Angle goes from Math.PI (left, score 0) to 0 (right, score 100)
    const angleRad = Math.PI - (Math.PI * (animatedScore / 100));
    const indicatorX = 50 + 40 * Math.cos(angleRad);
    const indicatorY = 50 - 40 * Math.sin(angleRad);

    // Extend path score slightly to overlap the indicator dot and remove any linecap gap
    const pathScoreValue = Math.min(100, animatedScore + 1.5);
    const pathAngleRad = Math.PI - (Math.PI * (pathScoreValue / 100));
    const pathX = 50 + 40 * Math.cos(pathAngleRad);
    const pathY = 50 - 40 * Math.sin(pathAngleRad);

    const pingBgClass = animatedScore <= 45 ? 'bg-rose-400' : animatedScore <= 55 ? 'bg-amber-400' : 'bg-emerald-400';
    const dotBgClass = animatedScore <= 45 ? 'bg-rose-500' : animatedScore <= 55 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg ${currentState.glowClass} transition-all duration-500 hover:-translate-y-1 hover:shadow-xl`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Fear & Greed Index</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sentiment analysis helper</p>
                </div>
                <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingBgClass}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotBgClass}`}></span>
                </span>
            </div>

            <div className="relative flex flex-col items-center justify-center py-2">
                {/* SVG Arc Gauge */}
                <svg className="w-56 h-32 drop-shadow-md" viewBox="0 0 100 55">
                    {/* Background Track */}
                    <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke="#e2e8f0" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        className="dark:stroke-slate-800" 
                    />
                    
                    {/* Active Gradient Track */}
                    <path 
                        d={`M 10 50 A 40 40 0 0 1 ${pathX} ${pathY}`}
                        fill="none" 
                        stroke="url(#fearGreedGradient)" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                    />

                    {/* Glowing Pointer Dot */}
                    <circle 
                        cx={indicatorX} 
                        cy={indicatorY} 
                        r="3.5" 
                        fill="#ffffff" 
                        className="filter drop-shadow-[0_0_3px_rgba(255,255,255,0.9)]"
                    />

                    <defs>
                        <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f43f5e" />     {/* Rose */}
                            <stop offset="35%" stopColor="#f97316" />    {/* Orange */}
                            <stop offset="65%" stopColor="#eab308" />    {/* Yellow */}
                            <stop offset="100%" stopColor="#10b981" />   {/* Emerald */}
                        </linearGradient>
                    </defs>
                </svg>

                {/* Score and Label Overlay */}
                <div className="absolute bottom-5 text-center flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-in">
                        {animatedScore}
                    </span>
                    <span className={`text-sm font-bold tracking-wider uppercase mt-1 transition-colors duration-500 ${currentState.colorClass}`}>
                        {currentState.label}
                    </span>
                </div>
            </div>

            {/* Description Text */}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2 px-4 italic">
                {currentState.description}
            </p>

            {/* Historical Values (Adds premium high-fidelity look) */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500">Yesterday</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">62 (Greed)</span>
                </div>
                <div className="flex flex-col border-x border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-400 dark:text-slate-500">Last Week</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">58 (Greed)</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500">Last Month</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">48 (Neutral)</span>
                </div>
            </div>
        </div>
    );
}
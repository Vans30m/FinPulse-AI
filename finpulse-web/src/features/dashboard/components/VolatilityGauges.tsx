import { useEffect, useState } from "react";
import { getFundamentals } from "../../../services/marketService";

export default function VolatilityGauges() {
    const [vix, setVix] = useState({ value: "13.42", status: "Low", color: "text-emerald-500" });

    useEffect(() => {
        async function fetchVix() {
            try {
                const fundamentals = await getFundamentals("^VIX");
                const value = fundamentals.price.toFixed(2);
                let status = "Low";
                let color = "text-emerald-500";

                if (fundamentals.price > 25) {
                    status = "High";
                    color = "text-rose-500";
                } else if (fundamentals.price > 15) {
                    status = "Moderate";
                    color = "text-amber-500";
                }

                setVix({ value, status, color });
            } catch (err) {
                console.error("Failed to fetch VIX from Yahoo Finance:", err);
            }
        }

        fetchVix();
        const interval = setInterval(fetchVix, 30000);
        return () => clearInterval(interval);
    }, []);

    const gauges = [
        { name: "VIX (Volatility)", value: vix.value, status: vix.status, color: vix.color },
        { name: "Market Liquidity", value: "Normal", status: "Stable", color: "text-blue-500" },
        { name: "Systemic Stress", value: "0.18", status: "Minimal", color: "text-emerald-500" }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 font-display">Volatility Indicators</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {gauges.map((gauge, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">{gauge.name}</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-lg font-black text-slate-800 dark:text-slate-100">{gauge.value}</span>
                            <span className={`text-xs font-bold ${gauge.color}`}>{gauge.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
import React from "react";
import { Plus, Minus, RotateCcw, Maximize2, Camera, Sliders } from "lucide-react";

interface ChartToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  showTimeframes: boolean;
  onToggleTimeframes: () => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  showTimeframes,
  onToggleTimeframes,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-slate-800/60 rounded-xl mb-4">
      <div className="flex items-center gap-1">
        <button 
          onClick={onToggleTimeframes}
          title="Toggle Timeframes" 
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
            showTimeframes 
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" /> Timeframes
        </button>
      </div>

      {/* Actions Controls Panel */}
      <div className="flex items-center gap-1">
        <button onClick={onZoomIn} title="Zoom In" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all">
          <Plus size={16} />
        </button>
        <button onClick={onZoomOut} title="Zoom Out" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all">
          <Minus size={16} />
        </button>
        <button onClick={onReset} title="Reset Zoom" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all">
          <RotateCcw size={16} />
        </button>
        <button title="Fullscreen" className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
          <Maximize2 size={16} />
        </button>
        <button title="Screenshot" className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
          <Camera size={16} />
        </button>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Plus, X, Target, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  direction: 'ABOVE' | 'BELOW';
  isTriggered: boolean;
  createdAt: string;
}

export default function MyAlertsDashboard() {
  const [myAlerts, setMyAlerts] = useState<UserAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form & Search States
  const [newTicker, setNewTicker] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initial Fetch
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://localhost:3000/api/alerts');
        const data = await res.json();
        if (Array.isArray(data)) setMyAlerts(data);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // Debounced Finnhub Search
  useEffect(() => {
    if (!newTicker.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(newTicker)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error("Search fetch failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newTicker, showSuggestions]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker || !newTarget) {
      toast.error("Please fill in all fields");
      return;
    }

    const loadingToast = toast.loading(`Setting alert for ${newTicker}...`);

    try {
      const res = await fetch('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: newTicker,
          targetPrice: newTarget,
          direction: 'ABOVE'
        })
      });

      if (res.ok) {
        const createdAlert = await res.json();
        setMyAlerts((prev) => [createdAlert, ...prev]);
        toast.success(`Alert set for ${newTicker}!`, { id: loadingToast });
        
        setNewTicker('');
        setNewTarget('');
        setIsModalOpen(false);
      } else {
        toast.error("Failed to create alert", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Network error. Is the backend running?", { id: loadingToast });
    }
  };

  const activeCount = myAlerts.filter(a => !a.isTriggered).length;
  const triggeredCount = myAlerts.filter(a => a.isTriggered).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-1 space-y-8">
      
      {/* HEADER & STATS (Unchanged) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Price Alerts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Automated monitoring and notifications for your customized price targets.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-cyan-400 px-5 py-2.5 text-sm font-bold text-white dark:text-night-900 shadow-md hover:scale-[1.02] transition-transform">
          <Plus className="h-4 w-4" /> New Target
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-slate-400"><Target className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Watching Now</p><h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeCount} Active</h3></div>
        </div>
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Targets Reached</p><h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{triggeredCount} Triggered</h3></div>
        </div>
      </div>

      {/* ALERTS LIST (Unchanged) */}
      <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Your Triggers</h2>
        {isLoading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : myAlerts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
            <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-slate-900 dark:text-white font-bold mb-1">No alerts set</h3>
            <p className="text-sm text-slate-500">Create a new price target to get notified instantly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAlerts.map((alert) => (
              <div key={alert.id} className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors ${alert.isTriggered ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'}`}>
                <div className={`p-2.5 rounded-xl ${alert.isTriggered ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 shadow-sm'}`}>
                  {alert.isTriggered ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className={`text-base font-bold ${alert.isTriggered ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-white'}`}>{alert.ticker}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${alert.isTriggered ? 'bg-emerald-200 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>{alert.isTriggered ? 'Triggered' : 'Active'}</span>
                  </div>
                  <p className={`text-sm mt-1 ${alert.isTriggered ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>Target Price: <strong className="font-mono">${alert.targetPrice.toFixed(2)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE ALERT MODAL (Updated with Global Search) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Price Alert</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handleCreateAlert} className="space-y-4">
              
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-1">Asset Ticker</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="Search global markets..." 
                    value={newTicker} 
                    onChange={e => {
                      setNewTicker(e.target.value.toUpperCase());
                      setShowSuggestions(true);
                    }} 
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white uppercase pr-10" 
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex justify-between items-center border-b border-slate-50 dark:border-white/5 last:border-0"
                        onClick={() => {
                          setNewTicker(asset.symbol);
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{asset.symbol}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{asset.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">{asset.type?.replace('Common ', '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target Price ($)</label>
                <input type="number" step="any" required placeholder="150.00" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
              </div>

              <button type="submit" className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-night-900 mt-4 shadow-md hover:scale-[1.02] transition-transform">
                Set Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Plus, X, Target, Loader2, Play, Pause, Trash2, Search, ArrowUpDown, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAlerts, useCreateAlert, useDeleteAlert, useUpdateAlert, useToggleAlertStatus, useAlertHistory } from '../../../hooks/useDashboard';
import API_BASE_URL from "../../../config/api";

export default function MyAlertsDashboard() {
  const { data: myAlerts = [], isLoading } = useAlerts();
  const { data: history = [] } = useAlertHistory();
  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const deleteAlertMutation = useDeleteAlert();
  const toggleStatusMutation = useToggleAlertStatus();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'history'>('alerts');

  // Form & Creation States
  const [newTicker, setNewTicker] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [newTarget, setNewTarget] = useState('');
  const [newDirection, setNewDirection] = useState('ABOVE');
  const [newType, setNewType] = useState('PRICE');
  const [newNotes, setNewNotes] = useState('');
  const [newRepeat, setNewRepeat] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Debounced search for ticker suggestions
  useEffect(() => {
    if (!newTicker.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(newTicker)}`);
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

  // Actions
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker || !newTarget) {
      toast.error("Please fill in all fields");
      return;
    }
    const loadingToast = toast.loading(`Setting alert for ${newTicker}...`);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    createAlertMutation.mutate({
      ticker: selectedAsset?.symbol || newTicker.toUpperCase(),
      targetPrice: parseFloat(newTarget),
      direction: newDirection,
      type: newType,
      notes: newNotes || undefined,
      expiresAt: oneYearFromNow.toISOString(),
      repeat: newRepeat
    }, {
      onSuccess: () => {
        toast.success(`Alert set for ${newTicker}!`, { id: loadingToast });
        setNewTicker('');
        setNewTarget('');
        setNewNotes('');
        setNewRepeat(false);
        setIsModalOpen(false);
      },
      onError: () => {
        toast.error("Failed to create alert", { id: loadingToast });
      }
    });
  };

  const handleToggleStatus = (id: string, currentEnabled: boolean) => {
    toggleStatusMutation.mutate({
      id,
      data: { enabled: !currentEnabled }
    });
  };

  const handleDeleteAlert = (id: string) => {
    deleteAlertMutation.mutate(id);
  };

  // Filtered triggers
  const filteredAlerts = myAlerts.filter((a: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = a.ticker.toLowerCase().includes(q) || (a.notes || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' 
      || (statusFilter === 'ACTIVE' && a.enabled && !a.isTriggered)
      || (statusFilter === 'TRIGGERED' && a.isTriggered)
      || (statusFilter === 'DISABLED' && !a.enabled);
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeCount = myAlerts.filter((a: any) => a.enabled && !a.isTriggered).length;
  const triggeredCount = myAlerts.filter((a: any) => a.isTriggered).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-1 space-y-8">
      
      {/* 1. HEADER & STATISTICS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Smart Alerts System</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Automated technical price, RSI, SMA, volume indicators, and earnings alerts.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white dark:text-night-900 shadow-md hover:scale-[1.02] transition-transform">
          <Plus className="h-4 w-4" /> New Alert
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-slate-400"><Target className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Monitoring</p><h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeCount} Active</h3></div>
        </div>
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Triggers Logged</p><h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{triggeredCount} Total</h3></div>
        </div>
      </div>

      {/* 2. TABS SELECTOR */}
      <div className="flex border-b border-slate-200 dark:border-white/15 gap-4">
        <button onClick={() => setActiveTab('alerts')} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'alerts' ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400' : 'border-transparent text-slate-550'}`}>Active Triggers</button>
        <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400' : 'border-transparent text-slate-550'}`}>Trigger History</button>
      </div>

      {/* 3. ALERTS / TRIGGERS CONTENT DISPLAY */}
      {activeTab === 'alerts' ? (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-white/70 dark:bg-night-900/70 p-4 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search alert ticker..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white w-full"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-xl outline-none text-slate-900 dark:text-white font-bold">
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIGGERED">Triggered</option>
                <option value="DISABLED">Paused</option>
              </select>

              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-xl outline-none text-slate-900 dark:text-white font-bold">
                <option value="ALL">All Types</option>
                <option value="PRICE">Price</option>
                <option value="VOLUME">Volume Spike</option>
                <option value="PERCENT_CHANGE">Percentage</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-cyan-400"></div></div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <Bell className="h-10 w-10 text-slate-350 dark:text-slate-650 mx-auto mb-4" />
              <h3 className="text-slate-900 dark:text-white font-bold mb-1">No alerts match criteria</h3>
              <p className="text-sm text-slate-500">Add customizable price trigger threshold fields above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlerts.map((alert: any) => (
                <div key={alert.id} className={`flex items-start justify-between p-5 rounded-2xl border transition-colors ${alert.isTriggered ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'}`}>
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleStatus(alert.id, alert.enabled)}
                      className={`p-2.5 rounded-xl border ${alert.enabled ? 'bg-blue-50 text-blue-600 dark:bg-white/5' : 'bg-slate-100 text-slate-400 dark:bg-white/5'}`}
                    >
                      {alert.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{alert.ticker}</h4>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${alert.isTriggered ? 'bg-emerald-250 text-emerald-800' : alert.enabled ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'}`}>
                          {alert.isTriggered ? 'Triggered' : alert.enabled ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Condition: {alert.direction} target price <strong className="font-mono">${alert.targetPrice.toFixed(2)}</strong></p>
                      {alert.notes && <p className="text-[11px] text-slate-400 italic mt-1.5">Note: {alert.notes}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-150 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <Clock className="h-10 w-10 text-slate-350 dark:text-slate-650 mx-auto mb-4" />
              <h3 className="text-slate-900 dark:text-white font-bold mb-1">No history logs</h3>
              <p className="text-sm text-slate-500">When your target alerts trigger, history logs will show here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h: any) => (
                <div key={h.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {h.alert?.ticker || 'ASSET'}
                      <span className="text-xs font-mono text-emerald-500">Triggered at ${h.triggeredPrice.toFixed(2)}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Trigger condition reached on {new Date(h.triggeredAt).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl">Success</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. CREATE ALERT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Smart Alert</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handleCreateAlert} className="space-y-4">
              
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-1">Asset Ticker</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="AAPL, MSFT, TSLA..." 
                    value={newTicker} 
                    onChange={e => { setSelectedAsset(null); setNewTicker(e.target.value.toUpperCase()); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white uppercase" 
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-55 w-full mt-1 bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex justify-between items-center border-b border-slate-50 last:border-0"
                        onClick={() => { setSelectedAsset(asset); setNewTicker(asset.symbol); setShowSuggestions(false); }}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{asset.symbol}</span>
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">{asset.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Direction</label>
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setNewDirection("ABOVE")}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                      newDirection === "ABOVE"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    Above (&gt;)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDirection("BELOW")}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                      newDirection === "BELOW"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    Below (&lt;)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target Value</label>
                <input type="number" step="any" required placeholder="150.00" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Notes</label>
                <input type="text" placeholder="Reason/Details..." value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-blue-550 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Alert Policy</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Valid for a year. This trigger automatically expires one year from today if it remains untriggered.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="repeat" checked={newRepeat} onChange={e => setNewRepeat(e.target.checked)} className="rounded" />
                <label htmlFor="repeat" className="text-xs font-bold text-slate-500 cursor-pointer">Repeat alert trigger on every match</label>
              </div>

              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white mt-4 shadow-md hover:scale-[1.02] transition-transform">
                Create Trigger
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}